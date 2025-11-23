const drive = require("./googleAuth");
const { PassThrough } = require("stream");

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

// Upload file
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

module.exports = { findOrCreateFolder, uploadFile };