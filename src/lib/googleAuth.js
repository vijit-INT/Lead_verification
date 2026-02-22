import { google } from "googleapis";

export async function getGoogleAuthClient() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.GMAIL_REFRESH_TOKEN,
  });

  return oauth2Client;
}

export async function getGmailClient() {
  const auth = await getGoogleAuthClient();
  return google.gmail({ version: "v1", auth });
}
