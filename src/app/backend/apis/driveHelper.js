const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");
const Deck = require("./model");

const ROOT_FOLDER_ID = "0AJF2WP1hPW53Uk9PVA";

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

// Folder cache
const folderCache = new Map();

function sanitize(str) {
  return str.replace(/'/g, "\\'");
}

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

// Upload file using streaming
async function uploadAndSaveDeck(filePath, originalName, mimeType, industry, deckCategory, deckType, uploadedBy, uploadedByEmail) {
  let currentFolderId = ROOT_FOLDER_ID;

  if (industry) currentFolderId = await findOrCreateFolder(industry, currentFolderId);
  if (deckCategory) currentFolderId = await findOrCreateFolder(deckCategory, currentFolderId);
  if (deckType) currentFolderId = await findOrCreateFolder(deckType, currentFolderId);

  const fileId = await drive.files.create({
    requestBody: { name: originalName, parents: [currentFolderId] },
    media: { body: fs.createReadStream(filePath), mimeType },
    fields: "id",
    supportsAllDrives: true,
  }).then(res => res.data.id);

  const driveLink = `https://drive.google.com/uc?export=download&id=${fileId}`;

  const deck = new Deck({
    title: originalName,
    file_path: driveLink,
    deck_type: deckType,
    category: deckCategory,
    industry,
    uploaded_by: uploadedBy,
    uploaded_by_email: uploadedByEmail,
    status: "uploaded",
  });

  await deck.save();
  fs.unlinkSync(filePath); // delete temp file after upload
  return deck;
}

module.exports = { findOrCreateFolder, uploadAndSaveDeck, ROOT_FOLDER_ID };