const express = require("express");
const path = require("path");
const cors = require("cors");
const uploadRoutes = require("./src/app/backend/apis/route");
const chatRoutes = require("./src/app/backend/apis/chatRoutes");

require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// Define distPath once
const distPath = path.join(__dirname, "dist/admatazz-employee-project");

// Serve Angular frontend
app.use(express.static(distPath));

// API routes
app.use("/api/upload", uploadRoutes);
app.use("/api/chat", chatRoutes);

// Fallback: serve index.html for Angular routes
app.use((req, res, next) => {
    if (!req.path.startsWith("/api")) {
        res.sendFile(path.join(distPath, "index.html"));
    } else {
        next();
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));