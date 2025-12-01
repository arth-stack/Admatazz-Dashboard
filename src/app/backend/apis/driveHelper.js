const { google } = require("googleapis");
const { PassThrough } = require("stream");
const Deck = require("./model"); 

const ROOT_FOLDER_ID = "0AJF2WP1hPW53Uk9PVA";

// Initialize Drive
const serviceAccount = require("../../../../service-account.json");
const auth = new google.auth.GoogleAuth({
  credentials: serviceAccount,
  scopes: ["https://www.googleapis.com/auth/drive"], 
});
const drive = google.drive({ version: "v3", auth });

// Sanitize folder names
function sanitize(str) {
  return str.replace(/'/g, "\\'");
}

// Find or create folder
async function findOrCreateFolder(folderName, parentFolderId) {
  const safeName = sanitize(folderName);
  const query = `name='${safeName}' and mimeType='application/vnd.google-apps.folder' and '${parentFolderId}' in parents and trashed=false`;

  const search = await drive.files.list({
    q: query,
    fields: "files(id, name)",
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });

  if (search.data.files.length > 0) return search.data.files[0].id;

  const folder = await drive.files.create({
    requestBody: {
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentFolderId],
    },
    fields: "id",
    supportsAllDrives: true,
  });

  return folder.data.id;
}

// Upload file to Drive
async function uploadFile(file, folderId) {
  const stream = new PassThrough();
  stream.end(file.buffer);

  const response = await drive.files.create({
    requestBody: {
      name: file.originalname,
      parents: [folderId],
    },
    media: {
      mimeType: file.mimetype,
      body: stream,
    },
    supportsAllDrives: true,
  });

  return response.data.id;
}

// Upload file and save in MongoDB
async function uploadAndSaveDeck(file, industry, deckCategory, deckType, uploadedBy, uploadedByEmail) {
  if (!file) throw new Error("No file provided");

  let currentFolderId = ROOT_FOLDER_ID;
  if (industry) currentFolderId = await findOrCreateFolder(industry, currentFolderId);
  if (deckCategory) currentFolderId = await findOrCreateFolder(deckCategory, currentFolderId);
  if (deckType) currentFolderId = await findOrCreateFolder(deckType, currentFolderId);

  const fileId = await uploadFile(file, currentFolderId);
  const driveLink = `https://drive.google.com/uc?export=download&id=${fileId}`;

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