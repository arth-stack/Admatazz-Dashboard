const express = require("express");
const router = express.Router();
const uploadController = require("./controller");
const multer = require("multer");
const fs = require("fs");

// Store uploads on disk
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = "/tmp/uploads";
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});

const upload = multer({ storage });

// **Use .array('files') for multiple files**
router.post("/", upload.array("files"), uploadController.uploadFile);

module.exports = router;