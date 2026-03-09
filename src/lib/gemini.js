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
    Company URL: ${userData.companyUrl || "N/A"}
    Requirement: ${userData.requirement || "N/A"}
    Budget: ${userData.budget || "N/A"}
    
    Raw Intelligence Gathered:
    ${JSON.stringify(
      {
        userLinkedIn: searchResults.userLinkedIn,
        companyLinkedIn: searchResults.companyLinkedIn,
        companyWebsite: searchResults.companyWebsite,
        providedCompanyUrl: userData.companyUrl,
        // Limit deep results to top 3 most relevant to keep prompt well under 15k
        deepCompanyResults: (searchResults.deepCompanyResults || []).slice(
          0,
          3,
        ),
        deepPersonResults: (searchResults.deepPersonResults || []).slice(0, 3),
      },
      null,
      2,
    )}
    
    Advanced Investigative Protocol:
    1. CROSS-VERIFICATION: Compare User Input with Search Evidence. For the person's current identity, treat LinkedIn as the source of truth. For business alignment, financial capability, and strategic roadmap, treat official Annual Reports, Financial Statements, and Corporate LinkedIn posts as the primary source of truth.
    2. ENTITY RESOLUTION: In the "deepPersonResults", identify which snippets definitely belong to the target person vs. others with the same name.
    3. BUSINESS ALIGNMENT ANALYSIS: Critique whether the "Requirement" makes logical sense for their "Claimed Company".
    4. PUBLIC/PRIVATE FINANCIAL AUDIT: Determine if the company is Publicly Listed. Meticulously analyze the provided intelligence for "current year financial statements", "annual reports" (PDF snippets), or "investor relations" data. High-priority should be given to annual report data for generating efficient insights. If private, look for "funding rounds", "valuation news", or "next year plans".
    5. STRATEGIC ROADMAP CHECK: Look for mentions of "expansion plans", "digital transformation", or "tech initiatives" for the current/next year in annual reports or official press releases. Does the "Requirement" align with these announced plans?
    6. BUDGET VIABILITY: Analyze the "Budget" against the 2 Lakhs (200,000 INR) project minimum for Indus Net Technologies.
    7. COMPANY ASSOCIATION VERIFICATION: Critically compare the "Claimed Company" (${userData.companyName}) with the person's current company found in the search results (LinkedIn/Web). 
       - If they differ, flag it as a mismatch (isCompanyMatch: false).
       - If they are the same, confirm the association (isCompanyMatch: true).
       - If the person cannot be found at all, set isFound: false.
       - If the user recently changed companies, document the transition.
    8. CORE BUSINESS ANALYSIS: If a Company URL is provided (${userData.companyUrl}), or based on search results, identify the company's core business products. Determine what key value propositions can be presented regarding their business.
    9. SCORING LOGIC (STRICT POSITIVE RUBRIC): The total alignment score (0-50) must be the sum of these four predefined categories. 
       - IMPORTANT: Provide EXACTLY ONE score attribute per category. Consolidate multiple reasons into a single 'factor' string.
       
       - 1. CORPORATE INTELLIGENCE (0-20 pts): Consolidate Financial Capability, Strategic Roadmap, and Industry Fit into one entry.
       - 2. INDIVIDUAL PROFILES (0-10 pts): Points for personal professional standing. 
            CRITICAL: If isCompanyMatch is false or isFound is false, this score MUST be 0.
       - 3. INDIVIDUAL AUTHORITY (0-15 pts): Decision-making power. High (10-15) for C-suite/Founders, Low (0-5) for others.
       - 4. LOCATION (0-5 pts): High (5) for English-speaking/Tier-1 countries, Low (0-2) for high-risk/non-English countries.
       
       - NO NEGATIVE MARKING: Every lead starts at 0. Do not subtract points.

    JSON OUTPUT REQUIREMENTS (Be Extremely Detailed):
    {
      "businessAnalysis": {
        "requirementAnalysis": "Detailed breakdown of the requirement and its feasibility",
        "industryAlignment": "Critical check: Does the requirement match their actual business logic?",
        "budgetAnalysis": "Analysis based on 2 Lakhs minimum threshold for Indus Net Technologies",
        "strategicFit": "How this project fits into their current public-facing roadmap",
        "potentialRisks": [
          "Identify specific red flags for sales (e.g. Lead asks for X but company roadmap only mentions Y; Company is in cost-cutting mode)."
        ],
        "recommendation": "Direct recommendation (High Potential / High Risk / Misaligned)",
        "alignmentScore": 0-50,
        "scoreAttributes": [
          {"category": "CORPORATE INTELLIGENCE", "factor": "Consolidated explanation", "contribution": "+X"},
          {"category": "INDIVIDUAL PROFILES", "factor": "Consolidated explanation", "contribution": "+X"},
          {"category": "INDIVIDUAL AUTHORITY", "factor": "Consolidated explanation", "contribution": "+X"},
          {"category": "LOCATION", "factor": "Consolidated explanation", "contribution": "+X"}
        ]
      },
      "companyCoreRequirement": {
        "coreProducts": ["List of core business products/services"],
        "businessPresentation": "Consolidated summary of what we can present regarding their business to impress them",
        "keyOfferings": "Primary business model and revenue drivers"
      },
      "financialAudit": {
        "companyStatus": "Publicly Listed | Private Entity",
        "financialSummary": "Comprehensive summary of current year's financials and annual reports. Prioritize data found in official reports for maximum efficiency.",
        "futurePlans": "Deduce next year's plans/initiatives from news/reports",
        "requirementMatch": "Specific check: Is the user's requirement mentioned or needed in their future plans?",
        "listingDetails": "Stock exchange info if public, or latest funding info if private"
      },
      "userProfile": {
        "isFound": true/false,
        "fullName": "...",
        "currentRole": "...",
        "currentCompany": "Current company found from search",
        "isCompanyMatch": true/false,
        "claimedCompanyMatchAnalysis": "Detailed analysis of whether they actually work at ${userData.companyName} or if they have moved on/never worked there, or if they couldn't be found.",
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
        "confidenceScore": 0.0 to 1.0,
        "verificationStatus": "VERIFIED | PROBABLE | UNCERTAIN",
        "dataSource": "Summary of search breadth",
        "lastUpdated": "Current timestamp",
        "notes": "Analyst's notes"
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
