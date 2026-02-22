import { NextResponse } from "next/server";
import { getLatestEmails, getEmailDetails } from "../../../../lib/gmailService";

export async function POST(req) {
  try {
    const body = await req.json();

    // Google Pub/Sub sends the data in a base64 encoded 'message.data' field
    if (!body.message || !body.message.data) {
      return NextResponse.json(
        { error: "Invalid Pub/Sub message" },
        { status: 400 },
      );
    }

    const decodedData = JSON.parse(
      Buffer.from(body.message.data, "base64").toString("utf-8"),
    );
    const { emailAddress, historyId } = decodedData;

    console.log(
      `Notification received for ${emailAddress}, historyId: ${historyId}`,
    );

    // Fetch the changes since this historyId
    const newMessages = await getLatestEmails(historyId);

    const results = [];
    for (const msg of newMessages) {
      const details = await getEmailDetails(msg.id);
      console.log(`New Email from ${details.from}: ${details.subject}`);
      results.push(details);

      // TODO: Save to database or trigger further processing
      // Example:
      // await saveEmailToInbox(details);
    }

    return NextResponse.json({ success: true, processed: results.length });
  } catch (error) {
    console.error("Error in Gmail Webhook:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
