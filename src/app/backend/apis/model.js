const mongoose = require("mongoose");

const deckSchema = new mongoose.Schema({
  title: { type: String },
  file_path: { type: String }, 
  deck_type: { type: String },
  category: { type: String },
  industry: { type: String },
  uploaded_by: { type: String },
  uploaded_by_email: { type: String },
  uploaded_at: { type: Date, default: Date.now },
  status: { type: String, default: "pending_processing" },
});

module.exports = mongoose.model("Deck", deckSchema);