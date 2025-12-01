const drive = require("./googleAuth");
const { PassThrough } = require("stream");
const ROOT_FOLDER_ID = "0AJF2WP1hPW53Uk9PVA";
const Deck = require("./model");

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

  if (search.data.files.length > 0) {
    return search.data.files[0].id;
  }

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

// Recursively find a folder by name (case-insensitive)
async function findFolderByName(parentId, name) {
  console.log(`[findFolderByName] Searching for "${name}" under parentId: ${parentId}`);
  const query = `mimeType='application/vnd.google-apps.folder' and '${parentId}' in parents and trashed=false`;

  const res = await drive.files.list({
    q: query,
    fields: "files(id, name)",
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });

  if (!res.data.files) return null;
  const folder = res.data.files.find(f => f.name.toLowerCase() === name.toLowerCase());
  return folder ? folder.id : null;
}

// Get first PDF file in a folder
async function getFirstFileInFolder(folderId) {
  const res = await drive.files.list({
    q: `'${folderId}' in parents and mimeType='application/pdf' and trashed=false`,
    fields: "files(id, name)",
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });

  return res.data.files && res.data.files.length > 0 ? res.data.files[0] : null;
}

// Find deck PDF based on industry / category / type
async function findDeck(industry, deckCategory, deckType) {
  let currentFolderId = ROOT_FOLDER_ID;

  if (industry) {
    const industryFolder = await findFolderByName(currentFolderId, industry);
    if (!industryFolder) return null;
    currentFolderId = industryFolder;
  }

  if (deckCategory) {
    const categoryFolder = await findFolderByName(currentFolderId, deckCategory);
    if (!categoryFolder) return null;
    currentFolderId = categoryFolder;
  }

  if (deckType) {
    const typeFolder = await findFolderByName(currentFolderId, deckType);
    if (!typeFolder) return null;
    currentFolderId = typeFolder;
  }

  // Return first PDF file in this folder
  const file = await getFirstFileInFolder(currentFolderId);
  return file;
}

// Generate Drive download link
function generateDriveLink(fileId) {
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
}

/**
 * Upload file to Drive and save metadata to MongoDB
 * @param {object} file - file object from multer
 * @param {string} industry
 * @param {string} deckCategory
 * @param {string} deckType
 * @param {string} uploadedBy
 * @param {string} uploadedByEmail
 */
async function uploadAndSaveDeck(file, industry, deckCategory, deckType, uploadedBy, uploadedByEmail) {
  // 1️⃣ Find or create folder hierarchy
  let currentFolderId = ROOT_FOLDER_ID;

  if (industry) currentFolderId = await findOrCreateFolder(industry, currentFolderId);
  if (deckCategory) currentFolderId = await findOrCreateFolder(deckCategory, currentFolderId);
  if (deckType) currentFolderId = await findOrCreateFolder(deckType, currentFolderId);

  // 2️⃣ Upload file to Drive
  const driveFileId = await uploadFile(file, currentFolderId);
  const driveLink = generateDriveLink(driveFileId);

  // 3️⃣ Save metadata in MongoDB
  const deck = new Deck({
    title: file.originalname,
    file_path: driveLink,
    deck_type: deckType,
    category: deckCategory,
    industry: industry,
    uploaded_by: uploadedBy,
    uploaded_by_email: uploadedByEmail,
    status: "uploaded"
  });

  await deck.save();
  return deck;
}

module.exports = {
  findOrCreateFolder,
  uploadFile,
  findDeck,
  generateDriveLink,
  uploadAndSaveDeck, 
  ROOT_FOLDER_ID
};