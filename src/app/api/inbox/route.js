import { NextResponse } from "next/server";
import { getGmailClient } from "../../../lib/googleAuth";
import { getEmailDetails } from "../../../lib/gmailService";

export async function GET() {
  try {
    const gmail = await getGmailClient();

    // List latest 10 messages from inbox
    const res = await gmail.users.messages.list({
      userId: "me",
      maxResults: 10,
      q: "label:INBOX",
    });

    const messages = res.data.messages || [];
    const emailDetails = await Promise.all(
      messages.map((msg) => getEmailDetails(msg.id)),
    );

    return NextResponse.json({
      success: true,
      data: emailDetails,
    });
  } catch (error) {
    console.error("Error fetching inbox:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 },
    );
  }
}
