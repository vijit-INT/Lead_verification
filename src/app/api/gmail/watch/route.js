import { NextResponse } from "next/server";
import { setupGmailWatch } from "../../../../lib/gmailService";

export async function GET() {
  try {
    const result = await setupGmailWatch();
    return NextResponse.json({
      success: true,
      message: "Gmail Watch established",
      data: result,
    });
  } catch (error) {
    console.error("Failed to setup Gmail Watch:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 },
    );
  }
}

// In production, this could also be a POST if you want to protect it
export async function POST() {
  return GET();
}
