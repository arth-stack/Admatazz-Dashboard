const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const { chatWithAI, getSearchSuggestions } = require("./chatController");

// Rate limiting to prevent abuse
const chatLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 requests per windowMs
  message: {
    success: false,
    error: "Too many chat requests, please try again later."
  }
});

// Chat routes
router.post("/chat", chatLimiter, chatWithAI);
router.get("/suggestions", getSearchSuggestions);

module.exports = router;