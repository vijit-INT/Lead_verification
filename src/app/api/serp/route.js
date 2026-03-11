import { NextResponse } from "next/server";
import axios from "axios";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  const apiKey = process.env.NEXT_PUBLIC_SERP_API_KEY;

  if (!query) {
    return NextResponse.json(
      { error: "Query parameter 'q' is required" },
      { status: 400 },
    );
  }

  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing SERP API configuration" },
      { status: 500 },
    );
  }

  try {
    const res = await axios.get("https://serpapi.com/search", {
      params: {
        api_key: apiKey,
        q: query,
        engine: "google",
      },
    });

    return NextResponse.json(res.data);
  } catch (error) {
    console.error(
      "SerpApi Proxy Error:",
      error.response?.data || error.message,
    );
    return NextResponse.json(
      {
        error: "Failed to fetch from SerpApi",
        details: error.response?.data || error.message,
      },
      { status: error.response?.status || 500 },
    );
  }
}
