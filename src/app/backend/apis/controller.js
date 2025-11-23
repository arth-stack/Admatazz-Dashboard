const { findOrCreateFolder, uploadFile: driveUploadFile } = require("./driveService");

const ROOT_FOLDER_ID = "0AJF2WP1hPW53Uk9PVA"; // Move to .env if needed

// Rename controller function to avoid shadowing
const handleUpload = async (req, res) => {
  const { industry, deckCategory, deckType } = req.body;

  if (!req.file) {
    return res.status(400).json({ success: false, error: "No file uploaded" });
  }

  try {
    // Folder hierarchy
    const industryFolderId = await findOrCreateFolder(industry, ROOT_FOLDER_ID);
    const deckCategoryFolderId = await findOrCreateFolder(deckCategory, industryFolderId);
    const deckTypeFolderId = await findOrCreateFolder(deckType, deckCategoryFolderId);

    // Upload file
    const fileId = await driveUploadFile(req.file, deckTypeFolderId);

    res.json({ success: true, fileId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = { uploadFile: handleUpload };