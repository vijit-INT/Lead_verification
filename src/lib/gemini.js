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

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
    You are an expert Data Analyst using search snippets to build a profile.
    
    User Input:
    Name: ${userData.name}
    Role: ${userData.role}
    Company: ${userData.companyName}
    
    Verified URLs Found (Prioritize information from these):
    User LinkedIn: ${searchResults.userLinkedIn?.url || "Not Found"}
    Company LinkedIn: ${searchResults.companyLinkedIn?.url || "Not Found"}
    
    All Search Snippets:
    ${JSON.stringify(searchResults, null, 2)}
    
    Instructions:
    1. Extract verified information from the snippets.
    2. infer missing details based on context (e.g. if snippet says "Software Eng at Google", role is verified).
    3. Return a clean JSON object.
    
    Output JSON Schema:
    {
      "userProfile": {
        "fullName": "...",
        "currentRole": "...",
        "linkedinProfileUrl": "...",
        "linkedinProfileId": "...",
        "location": "...",
        "connections": "...",
        "skills": [],
        "education": [],
        "experience": []
      },
      "companyProfile": {
        "companyName": "...",
        "linkedinCompanyUrl": "...",
        "linkedinCompanyId": "...",
        "website": "...",
        "industry": "...",
        "employeeCount": "...",
        "headquarters": "...",
        "description": "..."
      },
      "additionalInfo": {
        "confidenceScore": 0.0 to 1.0,
        "notes": "..."
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
    console.error("Gemini Enrichment Failed", e);
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
