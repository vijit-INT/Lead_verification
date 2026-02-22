import { getGmailClient } from "./googleAuth";

/**
 * Starts watching the Gmail inbox for new messages.
 * This should be called once every 7 days (or less) to keep the watch active.
 */
export async function setupGmailWatch() {
  try {
    const gmail = await getGmailClient();
    const res = await gmail.users.watch({
      userId: "me",
      requestBody: {
        topicName: process.env.GOOGLE_PUBSUB_TOPIC,
        labelIds: ["INBOX"], // Watch only the inbox
      },
    });
    console.log("Gmail Watch setup successful:", res.data);
    return res.data;
  } catch (error) {
    console.error("Error setting up Gmail Watch:", error);
    throw error;
  }
}

/**
 * Fetches the latest emails since the last historyId.
 */
export async function getLatestEmails(historyId) {
  try {
    const gmail = await getGmailClient();

    // List history since the last historyId
    const res = await gmail.users.history.list({
      userId: "me",
      startHistoryId: historyId,
      historyTypes: ["messageAdded"],
    });

    const histories = res.data.history || [];
    const messages = [];

    for (const history of histories) {
      if (history.messagesAdded) {
        for (const messageAdded of history.messagesAdded) {
          messages.push(messageAdded.message);
        }
      }
    }

    return messages;
  } catch (error) {
    console.error("Error fetching latest emails:", error);
    throw error;
  }
}

/**
 * Fetches full detail of a specific email message.
 */
export async function getEmailDetails(messageId) {
  try {
    const gmail = await getGmailClient();
    const res = await gmail.users.messages.get({
      userId: "me",
      id: messageId,
      format: "full",
    });

    const message = res.data;
    const headers = message.payload.headers;

    const subject = headers.find((h) => h.name === "Subject")?.value;
    const from = headers.find((h) => h.name === "From")?.value;
    const date = headers.find((h) => h.name === "Date")?.value;

    let body = "";
    if (message.payload.parts) {
      // Simple logic to find text/plain or text/html part
      const part =
        message.payload.parts.find((p) => p.mimeType === "text/plain") ||
        message.payload.parts[0];
      if (part && part.body && part.body.data) {
        body = Buffer.from(part.body.data, "base64").toString("utf-8");
      }
    } else if (message.payload.body && message.payload.body.data) {
      body = Buffer.from(message.payload.body.data, "base64").toString("utf-8");
    }

    return {
      id: message.id,
      threadId: message.threadId,
      snippet: message.snippet,
      subject,
      from,
      date,
      body,
    };
  } catch (error) {
    console.error("Error fetching email details:", error);
    throw error;
  }
}
