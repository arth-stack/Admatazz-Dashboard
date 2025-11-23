const express = require("express");
const router = express.Router();
const uploadController = require("./controller");
const upload = require("./middleware");

router.post("/", upload.single("file"), uploadController.uploadFile);

module.exports = router;