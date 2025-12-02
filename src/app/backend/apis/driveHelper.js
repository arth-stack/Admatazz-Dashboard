const { google } = require("googleapis");
const { Readable } = require("stream");
const Deck = require("./model");

const ROOT_FOLDER_ID = "0AJF2WP1hPW53Uk9PVA";

// Decode service account JSON
if (!process.env.GOOGLE_SERVICE_ACCOUNT_B64) {
  throw new Error("GOOGLE_SERVICE_ACCOUNT_B64 is not set");
}

const serviceAccount = JSON.parse(
  Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_B64, "base64").toString("utf8")
);

const auth = new google.auth.GoogleAuth({
  credentials: serviceAccount,
  scopes: ["https://www.googleapis.com/auth/drive"],
});

const drive = google.drive({ version: "v3", auth });

// Cache folders
const folderCache = new Map();

// Convert buffer → stream for Google Drive API
function bufferToStream(buffer) {
  const readable = new Readable();
  readable.push(buffer);
  readable.push(null);
  return readable;
}

// Clean folder names
function sanitize(str) {
  return str.replace(/'/g, "\\'");
}

// Find or create folders with cache
async function findOrCreateFolder(folderName, parentFolderId) {
  const cacheKey = `${parentFolderId}/${folderName}`;
  if (folderCache.has(cacheKey)) return folderCache.get(cacheKey);

  const safeName = sanitize(folderName);
  const query = `name='${safeName}' and mimeType='application/vnd.google-apps.folder' and '${parentFolderId}' in parents and trashed=false`;

  const search = await drive.files.list({
    q: query,
    fields: "files(id, name)",
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });

  let folderId;

  if (search.data.files.length > 0) {
    folderId = search.data.files[0].id;
  } else {
    const folder = await drive.files.create({
      requestBody: {
        name: folderName,
        mimeType: "application/vnd.google-apps.folder",
        parents: [parentFolderId],
      },
      fields: "id",
      supportsAllDrives: true,
    });

    folderId = folder.data.id;
  }

  folderCache.set(cacheKey, folderId);
  return folderId;
}

// Upload file to Google Drive
async function uploadFile(file, folderId) {
  const response = await drive.files.create(
    {
      requestBody: {
        name: file.originalname,
        parents: [folderId],
      },
      media: {
        mimeType: file.mimetype,
        body: bufferToStream(file.buffer), // FIXED ✔
      },
      fields: "id",
      supportsAllDrives: true,
    },
    {
      onUploadProgress: (evt) =>
        console.log(
          `Uploaded ${evt.bytesRead || 0} bytes → ${file.originalname}`
        ),
    }
  );

  return response.data.id;
}

// Save to database
async function uploadAndSaveDeck(
  file,
  industry,
  deckCategory,
  deckType,
  uploadedBy,
  uploadedByEmail
) {
  if (!file) throw new Error("No file provided");

  // Prepare folder structure
  let currentFolderId = ROOT_FOLDER_ID;

  if (industry)
    currentFolderId = await findOrCreateFolder(industry, currentFolderId);

  if (deckCategory)
    currentFolderId = await findOrCreateFolder(deckCategory, currentFolderId);

  if (deckType)
    currentFolderId = await findOrCreateFolder(deckType, currentFolderId);

  // Upload file to Google Drive
  const fileId = await uploadFile(file, currentFolderId);

  const driveLink = `https://drive.google.com/uc?export=download&id=${fileId}`;

  // Save in MongoDB
  const deck = new Deck({
    title: file.originalname,
    file_path: driveLink,
    deck_type: deckType,
    category: deckCategory,
    industry: industry,
    uploaded_by: uploadedBy,
    uploaded_by_email: uploadedByEmail,
    status: "uploaded",
  });

  await deck.save();
  return deck;
}

module.exports = {
  findOrCreateFolder,
  uploadFile,
  uploadAndSaveDeck,
  ROOT_FOLDER_ID,
};