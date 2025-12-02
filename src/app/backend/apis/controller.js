const { uploadAndSaveDeck } = require("./driveHelper");

const handleUpload = async (req, res) => {
  try {
    const file = req.file;
    if (!file)
      return res.status(400).json({ success: false, error: "No file uploaded" });

    const { industry, deckCategory, deckType, uploadedBy, uploadedByEmail } =
      req.body;

    const deck = await uploadAndSaveDeck(
      file,
      industry,
      deckCategory,
      deckType,
      uploadedBy,
      uploadedByEmail
    );

    res.json({ success: true, deck });
  } catch (err) {
    console.error("Upload failed:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = { uploadFile: handleUpload };