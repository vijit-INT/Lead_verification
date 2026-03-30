/**
 * Client-side wrapper functions that call backend API routes
 * The actual API key is kept secure on the server
 */

/**
 * Client function: Enriches profile by calling backend API
 */
export async function enrichProfile(searchResults, userData) {
  try {
    const response = await fetch("/api/gemini/enrich", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ searchResults, userData }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Enrich API Error:", error);
      // Fallback: return basic structure
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

    return await response.json();
  } catch (error) {
    console.error("Failed to enrich profile:", error);
    // Fallback: return basic structure
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
 * Client function: Asks follow-up question by calling backend API
 */
export async function askFollowUp(question, previousResults, newSearchResults) {
  try {
    const response = await fetch("/api/gemini/followup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        question,
        previousResults,
        newSearchResults: newSearchResults || {},
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Follow-up API Error:", error);
      return "I encountered an error while researching your question. Please try again.";
    }

    const data = await response.json();
    return data.answer;
  } catch (error) {
    console.error("Failed to get follow-up response:", error);
    return "I encountered an error while researching your question. Please try again.";
  }
}
