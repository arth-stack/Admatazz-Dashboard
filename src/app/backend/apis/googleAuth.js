const { google } = require("googleapis");

// Read the service account from environment variable
if (!process.env.GOOGLE_SERVICE_ACCOUNT_B64) {
  throw new Error("GOOGLE_SERVICE_ACCOUNT_B64 is not set");
}

const serviceAccount = JSON.parse(
  Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_B64, "base64").toString("utf8")
);

const auth = new google.auth.GoogleAuth({
  credentials: serviceAccount, // use credentials object instead of keyFile
  scopes: ["https://www.googleapis.com/auth/drive"],
});

const drive = google.drive({ version: "v3", auth });

module.exports = drive;