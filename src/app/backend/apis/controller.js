const { uploadAndSaveDeck } = require("./driveHelper");

const handleUpload = async (req, res) => {
  try {
    const files = req.files; // for multiple files, use req.files (ensure multer setup uses .array())
    if (!files || files.length === 0)
      return res.status(400).json({ success: false, error: "No files uploaded" });

    const { industry, deckCategory, deckType, uploadedBy, uploadedByEmail } = req.body;

    // Upload all files sequentially
    const uploadedDecks = [];
    for (const file of files) {
      const deck = await uploadAndSaveDeck(
        file.path,
        file.originalname,
        file.mimetype,
        industry,
        deckCategory,
        deckType,
        uploadedBy,
        uploadedByEmail
      );
      uploadedDecks.push(deck);
    }

    res.json({ success: true, decks: uploadedDecks });
  } catch (err) {
    console.error("Upload failed:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = { uploadFile: handleUpload };