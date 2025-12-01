const mongoose = require("mongoose");

const deckSchema = new mongoose.Schema({
  title: { type: String, required: true },
  file_path: { type: String, required: true }, 
  deck_type: { type: String, required: true },
  category: { type: String, required: true },
  industry: { type: String, required: true },
  uploaded_by: { type: String, required: true },
  uploaded_by_email: { type: String },
  uploaded_at: { type: Date, default: Date.now },
  status: { type: String, default: "pending_processing" },
});

module.exports = mongoose.model("Deck", deckSchema);