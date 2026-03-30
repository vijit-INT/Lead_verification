import { enrichProfileServer } from "../../../../lib/gemini-server";

export async function POST(request) {
  try {
    const { searchResults, userData } = await request.json();

    if (!searchResults || !userData) {
      return Response.json(
        { error: "Missing searchResults or userData" },
        { status: 400 }
      );
    }

    const result = await enrichProfileServer(searchResults, userData);
    return Response.json(result);
  } catch (error) {
    console.error("Enrich API Error:", error);
    return Response.json(
      { error: error.message || "Failed to enrich profile" },
      { status: 500 }
    );
  }
}
