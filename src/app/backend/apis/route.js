const express = require("express");
const router = express.Router();
const uploadController = require("./controller");
const multer = require("multer");

// Use memory storage for fast uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post("/", upload.single("file"), uploadController.uploadFile);

module.exports = router;