const express = require("express");
const cors = require("cors");
const uploadRoutes = require("./src/app/backend/apis/route");
const chatRoutes = require("./src/app/backend/apis/chatRoutes");

require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/upload", uploadRoutes);
app.use("/api/chat", chatRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));