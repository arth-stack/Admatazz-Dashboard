const { google } = require("googleapis");

// Read the service account from environment variable
const serviceAccount = require("../../../../service-account.json");
//const serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);

const auth = new google.auth.GoogleAuth({
  credentials: serviceAccount, // use credentials object instead of keyFile
  scopes: ["https://www.googleapis.com/auth/drive"],
});

const drive = google.drive({ version: "v3", auth });

module.exports = drive;