import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();
    console.log("Received search params:", body);

    // In a real application, you would save this data to a database here.
    // Since no database is configured, we'll just return a success response.

    return NextResponse.json({
      success: true,
      message: "Search parameters and results received successfully",
      receivedData: {
        fullname: body.fullname,
        companyName: body.companyName,
        role: body.role,
        email_address: body.email_address,
        // We avoid logging the full response results to keep console clean,
        // but it's part of the body
      },
    });
  } catch (error) {
    console.error("Error in insertsearchparams API:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
