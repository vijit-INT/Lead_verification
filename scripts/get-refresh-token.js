const { google } = require("googleapis");
const readline = require("readline");

/**
 * This script helps you get a refresh token for the Gmail API.
 * 1. Fill in your CLIENT_ID and CLIENT_SECRET.
 * 2. Run this script: node scripts/get-refresh-token.js
 * 3. Follow the instructions in the terminal.
 */

const CLIENT_ID = "YOUR_CLIENT_ID";
const CLIENT_SECRET = "YOUR_CLIENT_SECRET";
const REDIRECT_URI = "http://localhost:3000/api/auth/callback/google";

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI,
);

const SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.modify",
];

const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  scope: SCOPES,
  prompt: "consent", // Necessary to get a refresh token every time
});

console.log("Authorize this app by visiting this url:", authUrl);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question("Enter the code from that page here: ", (code) => {
  rl.close();
  oauth2Client.getToken(code, (err, token) => {
    if (err) return console.error("Error retrieving access token", err);
    console.log("Your Refresh Token is:", token.refresh_token);
    console.log("Full Token Object:", JSON.stringify(token, null, 2));
  });
});
