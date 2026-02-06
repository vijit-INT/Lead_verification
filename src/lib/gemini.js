import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

/**
 * Uses Gemini to extract and structure data from raw search results
 */
export async function enrichProfile(searchResults, userData) {
  if (!genAI) {
    console.error("Gemini API key missing");
    return null;
  }

  // Use gemini-2.5-flash as requested
  const model = genAI.getGenerativeModel(
    { model: "gemini-2.5-flash" },
    { apiVersion: "v1" },
  );

  const prompt = `
    You are a Senior Lead Intelligence Investigator. Your goal is to build a definitive, 360-degree profile of a person and their company based on heterogeneous search data.

    Investigative Context:
    Target Person: ${userData.name}
    Claimed Role: ${userData.role}
    Claimed Company: ${userData.companyName}
    
    Raw Intelligence Gathered:
    ${JSON.stringify(searchResults, null, 2)}
    
    Advanced Investigative Protocol:
    1. CROSS-VERIFICATION: Compare User Input with Search Evidence. If a LinkedIn profile is found, treat it as the "Source of Truth" for current role and company.
    2. ENTITY RESOLUTION: In the "deepPersonResults", identify which snippets definitely belong to the target person vs. others with the same name. Look for role/company overlaps.
    3. GAP ANALYSIS: If some fields (like education) are missing in one snippet, look for them in the "deepPersonResults".
    4. COMPANY INTELLIGENCE: Analyze "deepCompanyResults" to identify technologies, funding rounds, and recent strategic moves.
    5. DEDUCTIVE REASONING: Infer "skills" from the person's projects, news mentions, or job descriptions found in snippets.

    JSON OUTPUT REQUIREMENTS (Be Extremely Detailed):
    {
      "userProfile": {
        "fullName": "...",
        "currentRole": "...",
        "linkedinProfileUrl": "...",
        "linkedinProfileId": "...",
        "location": "...",
        "connections": "...",
        "summary": "Full professional summary deduced from all snippets",
        "skills": ["List at least 10-15 relevant skills based on background"],
        "education": [{"institution": "...", "degree": "...", "field": "...", "duration": "..."}],
        "experience": [{"title": "...", "company": "...", "duration": "...", "description": "Describe impact based on news or snippets"}]
      },
      "companyProfile": {
        "companyName": "Standardized Legal Name",
        "linkedinCompanyUrl": "...",
        "linkedinCompanyId": "...",
        "companyWebsite": "...",
        "industry": "...",
        "companyType": "e.g. Public, Private, Growth Stage",
        "companySize": "...",
        "employeeCount": "Confirmed Range",
        "headquarters": "Full City, Country",
        "founded": "Year",
        "revenue": "Estimated or Reported Revenue",
        "valuation": "Estimated Valuation",
        "description": "Comprehensive company overview",
        "specialties": [],
        "technologies": ["Identify internal tech stack or products"],
        "funding": {"totalFunding": "...", "latestRound": "...", "investors": []},
        "competitors": ["List 3-5 direct competitors"],
        "recentNews": ["Identify specific news dates and events"]
      },
      "additionalInfo": {
        "confidenceScore": 0.0 to 1.0 (Detailed evaluation),
        "verificationStatus": "VERIFIED | PROBABLE | UNCERTAIN",
        "dataSource": "Summary of search breadth (e.g. LinkedIn + News + GitHub)",
        "lastUpdated": "Current timestamp",
        "notes": "Analyst's notes on potential data conflicts or interesting findings"
      }
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    const cleanedText = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    return JSON.parse(cleanedText);
  } catch (e) {
    console.error("Gemini Enrichment Failed:", e.message || e);
    // Fallback: return basic structure using what we found
    return {
      userProfile: {
        fullName: userData.name,
        currentRole: userData.role,
        linkedinProfileUrl: searchResults.userLinkedIn?.url,
      },
      companyProfile: {
        companyName: userData.companyName,
        linkedinCompanyUrl: searchResults.companyLinkedIn?.url,
      },
    };
  }
}

/**
 * Handles follow-up questions from the user based on previous intelligence and new global searches
 */
export async function askFollowUp(question, previousResults, newSearchResults) {
  if (!genAI) return "API Key missing";

  const model = genAI.getGenerativeModel(
    { model: "gemini-2.5-flash" },
    { apiVersion: "v1" },
  );

  const prompt = `
    You are the Senior Lead Intelligence Investigator. A user is asking a follow-up question about a target.

    Objective: Answer the user's question by combining previously gathered intelligence with newly discovered global web data.

    Previous Knowledge:
    ${JSON.stringify(previousResults, null, 2)}

    Newly Discovered Global Intelligence (Fresh Web Results):
    ${JSON.stringify(newSearchResults, null, 2)}

    User Question:
    "${question}"

    Instructions:
    1. Provide a direct, factual answer.
    2. If the user asks for information not in the previous knowledge, prioritize the "Newly Discovered Global Intelligence".
    3. If the answer is not found in either, state that clearly but provide the closest relevant context.
    4. Keep the tone professional and analytical.
    5. Format the output as clean Markdown.
  `;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (e) {
    console.error("Gemini Follow-up Failed:", e);
    return "I encountered an error while researching your question. Please try again.";
  }
}
