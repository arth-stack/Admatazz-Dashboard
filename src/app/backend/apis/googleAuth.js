const { google } = require("googleapis");
const SERVICE_ACCOUNT_FILE = "./service-account.json";

const auth = new google.auth.GoogleAuth({
  keyFile: SERVICE_ACCOUNT_FILE,
  scopes: ["https://www.googleapis.com/auth/drive"],
});

const drive = google.drive({ version: "v3", auth });

module.exports = drive;