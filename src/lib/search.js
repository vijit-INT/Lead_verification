import axios from "axios";

const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
const GOOGLE_CX = process.env.NEXT_PUBLIC_GOOGLE_CX;

/**
 * Executes a search query using Google Custom Search JSON API
 * @param {string} query
 * @returns {Promise<Array>} List of search items
 */
export async function googleSearch(query) {
  if (!GOOGLE_API_KEY || !GOOGLE_CX) {
    console.error("Missing Google Search configuration");
    return [];
  }

  try {
    const res = await axios.get("https://www.googleapis.com/customsearch/v1", {
      params: {
        key: GOOGLE_API_KEY,
        cx: GOOGLE_CX,
        q: query,
      },
    });
    return res.data.items || [];
  } catch (error) {
    console.error("Google Search Error:", error);
    return [];
  }
}

/**
 * Finds the most likely LinkedIn profile URL for a person
 */
export async function findLinkedInProfile(name, company) {
  const query = `site:linkedin.com/in "${name}" "${company}"`;
  const results = await googleSearch(query);

  const linkedin = results.find((r) => r.link.includes("linkedin.com/in"));

  return {
    url: linkedin?.link || null,
    snippet: linkedin?.snippet || null,
    title: linkedin?.title || null,
  };
}

/**
 * Finds the most likely Company LinkedIn Page URL
 */
export async function findCompanyLinkedIn(company) {
  const query = `site:linkedin.com/company "${company}"`;
  const results = await googleSearch(query);

  // Results usually prioritize the exact company page at the top
  const companyPage = results.find((r) =>
    r.link.includes("linkedin.com/company"),
  );

  return {
    url: companyPage?.link || null,
    snippet: companyPage?.snippet || null,
    title: companyPage?.title || null,
  };
}

/**
 * Finds the company website
 */
export async function findCompanyWebsite(company) {
  const query = `"${company}" official website`;
  // Exclude social media to find actual website
  const results = await googleSearch(
    query + " -site:linkedin.com -site:facebook.com -site:twitter.com",
  );

  return results[0]?.link || null;
}
