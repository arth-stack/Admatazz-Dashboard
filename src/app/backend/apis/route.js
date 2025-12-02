const express = require("express");
const router = express.Router();
const uploadController = require("./controller");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Store uploads on disk to handle large files
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = "/tmp/uploads";
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});

const upload = multer({ storage });

router.post("/", upload.single("file"), uploadController.uploadFile);

module.exports = router;