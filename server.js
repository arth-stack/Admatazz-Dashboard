// --------------------
// Import Dependencies
// --------------------
const express = require("express");
const path = require("path");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const uploadRoutes = require("./src/app/backend/apis/route");
const chatRoutes = require("./src/app/backend/apis/chatRoutes");

// --------------------
// MongoDB Connection
// --------------------
const MONGO_URI = process.env.MONGO_URI;

const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connected successfully");
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  }
};
connectDB();

// --------------------
// Firebase Initialization
// --------------------
const { initializeApp, cert } = require("firebase-admin/app");

// Decode service account from Base64 env variable
if (!process.env.GOOGLE_SERVICE_ACCOUNT_B64) {
  throw new Error("GOOGLE_SERVICE_ACCOUNT_B64 is not set");
}

const serviceAccount = JSON.parse(
  Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_B64, "base64").toString("utf8")
);

initializeApp({
  credential: cert(serviceAccount),
});

// --------------------
// Express App Setup
// --------------------
const app = express();

app.use(cors({
  //origin: ["http://localhost:4200"], // Replace with frontend URL in production
  origin: ["https://admatazz-dashboard.vercel.app"]
}));
app.use(express.json());

// --------------------
// Serve Angular Frontend
// --------------------
const distPath = path.join(__dirname, "dist/admatazz-employee-project/");
app.use(express.static(distPath));

// --------------------
// API Routes
// --------------------
app.use("/api/upload", uploadRoutes);
app.use("/api/chat", chatRoutes);

// Fallback for Angular routes
app.use((req, res, next) => {
  if (!req.path.startsWith("/api")) {
    res.sendFile(path.join(distPath, "index.html"));
  } else {
    next();
  }
});

// --------------------
// Start Server
// --------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;