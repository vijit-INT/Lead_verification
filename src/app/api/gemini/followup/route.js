import { askFollowUpServer } from "../../../../lib/gemini-server";
// @/lib/gemini-server
export async function POST(request) {
  try {
    const { question, previousResults, newSearchResults } = await request.json();

    if (!question || !previousResults) {
      return Response.json(
        { error: "Missing question or previousResults" },
        { status: 400 }
      );
    }

    const result = await askFollowUpServer(
      question,
      previousResults,
      newSearchResults || {}
    );

    return Response.json({ answer: result });
  } catch (error) {
    console.error("Follow-up API Error:", error);
    return Response.json(
      { error: error.message || "Failed to get follow-up response" },
      { status: 500 }
    );
  }
}
