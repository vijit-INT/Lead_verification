import axios from "axios";

const SERP_API_KEY = process.env.NEXT_PUBLIC_SERP_API_KEY;

/**
 * Executes a search query using SERP API
 * @param {string} query
 * @returns {Promise<Array>} List of search items
 */
export async function googleSearch(query) {
  if (!SERP_API_KEY) {
    console.error("Missing SERP API configuration");
    return [];
  }

  try {
    const res = await axios.get("https://serpapi.com/search", {
      params: {
        api_key: SERP_API_KEY,
        q: query,
        engine: "google",
      },
    });

    // Transform SERP API response to match expected format
    const items = res.data.organic_results || [];
    return (
      items.map((item) => ({
        link: item.link,
        title: item.title,
        snippet: item.snippet,
      })) || []
    );
  } catch (error) {
    console.error("SERP API Error:", error);
    return [];
  }
}

/**
 * Finds the most likely LinkedIn profile URL for a person with enhanced accuracy
 */
export async function findLinkedInProfile(name, company, role = "") {
  // Try exact match first
  const queries = [
    `site:linkedin.com/in "${name}" "${company}"`,
    `site:linkedin.com/in "${name}" ${role}`,
    `site:linkedin.com/in "${name}"`,
  ];

  for (const query of queries) {
    const results = await googleSearch(query);
    const linkedin = results.find(
      (r) =>
        r.link.includes("linkedin.com/in") &&
        !r.link.includes("/dir/") && // Ignore directory pages
        !r.link.includes("/posts/"), // Ignore post pages
    );

    if (linkedin) {
      return {
        url: linkedin.link,
        snippet: linkedin.snippet,
        title: linkedin.title,
        status: "verified",
      };
    }
  }

  return { url: null, snippet: null, title: null, status: "not_found" };
}

/**
 * Performs deep research on a person across multiple platforms and news
 */
export async function deepPersonSearch(name, company, role = "") {
  const queries = [
    `"${name}" "${company}" interview OR news OR article`,
    `"${name}" professional background skills`,
    `site:twitter.com "${name}" "${company}"`,
    `site:github.com "${name}"`,
    `"${name}" ${role} portfolios`,
  ];

  const searchPromises = queries.map((q) => googleSearch(q));
  const resultsArray = await Promise.all(searchPromises);

  // Flatten and return unique results
  const allResults = resultsArray.flat();
  const seenUrls = new Set();

  return allResults.filter((item) => {
    if (!item.link || seenUrls.has(item.link)) return false;
    seenUrls.add(item.link);
    return true;
  });
}

/**
 * Finds the most likely Company LinkedIn Page URL
 */
export async function findCompanyLinkedIn(company) {
  const query = `site:linkedin.com/company "${company}"`;
  const results = await googleSearch(query);

  // Filter to find the most relevant company page
  const companyPage = results.find(
    (r) =>
      r.link.includes("linkedin.com/company") &&
      !r.link.includes("/life") &&
      !r.link.includes("/jobs"),
  );

  return {
    url: companyPage?.link || null,
    snippet: companyPage?.snippet || null,
    title: companyPage?.title || null,
  };
}

/**
 * Performs multiple targeted searches for deep company insights
 */
export async function deepCompanySearch(company) {
  const queries = [
    `"${company}" company overview products services`,
    `"${company}" headquarters address employee count revenue`,
    `"${company}" latest news funding rounds acquisitions`,
    `site:linkedin.com/company "${company}" about`,
  ];

  const searchPromises = queries.map((q) => googleSearch(q));
  const resultsArray = await Promise.all(searchPromises);

  // Flatten and return unique results
  const allResults = resultsArray.flat();
  const seenUrls = new Set();

  return allResults.filter((item) => {
    if (seenUrls.has(item.link)) return false;
    seenUrls.add(item.link);
    return true;
  });
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
