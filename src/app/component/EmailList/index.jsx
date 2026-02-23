"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./EmailList.module.scss";

export default function EmailList() {
  const router = useRouter();
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [lastRedirectedId, setLastRedirectedId] = useState(null);

  const parseLeadInfo = (body, fromEmail) => {
    // Clean up body (remove markdown bold/italic characters often found in emails)
    const cleanBody = body.replace(/[*_]/g, "");

    const findField = (regexes) => {
      for (const regex of regexes) {
        const match = cleanBody.match(regex);
        if (match && match[1]) return match[1].trim();
      }
      return null;
    };

    // Name parsing (handle combinations and multi-line values)
    const firstName = findField([
      /(?:First Name|FirstName)\s*:?[\r\n\s]*([^\r\n]+)/i,
    ]);
    const lastName = findField([
      /(?:Last Name|LastName)\s*:?[\r\n\s]*([^\r\n]+)/i,
    ]);
    const fullName = findField([
      /(?:Name|Full Name|Lead Name)\s*:?[\r\n\s]*([^\r\n]+)/i,
    ]);

    let name = fullName;
    if (!name && firstName) {
      name = lastName ? `${firstName} ${lastName}` : firstName;
    }

    const email =
      findField([
        /(?:Email|Email Address|Contact Email)\s*:?[\r\n\s]*([^\r\n]+)/i,
      ]) ||
      fromEmail?.match(/<(.+?)>/)?.[1] ||
      (fromEmail && !fromEmail.includes("<") ? fromEmail : null);

    const budget = findField([
      /(?:Budget|What is your budget\?|Project Budget)\s*:?[\r\n\s]*([^\r\n]+)/i,
    ]);

    const requirement = findField([
      /(?:Requirement|Requirement Type|requirement_type|Message|Description|Project Details|Project|Services)\s*:?[\r\n\s]*([^\r\n]+)/i,
    ]);

    const companyName = findField([
      /(?:Company|Company Name|Organization|Account Name)\s*:?[\r\n\s]*([^\r\n]+)/i,
    ]);
    const position = findField([
      /(?:Position|Role|Job Title|Designation)\s*:?[\r\n\s]*([^\r\n]+)/i,
    ]);

    let finalCompany = companyName;

    // Validate captured company - if it looks like a tagline or contains "SMEs", it's likely a false positive
    if (
      finalCompany &&
      (finalCompany.toLowerCase().includes("sme") || finalCompany.length > 40)
    ) {
      finalCompany = null;
    }

    if (!finalCompany && email) {
      const domain = email.split("@")[1];
      const common = [
        "gmail.com",
        "yahoo.com",
        "outlook.com",
        "hotmail.com",
        "icloud.com",
        "live.com",
        "aol.com",
        "protonmail.com",
      ];
      if (domain && !common.includes(domain.toLowerCase())) {
        finalCompany = domain.split(".")[0];
      }
    }

    return {
      name: name || "Unknown",
      email: email || "",
      budget: budget || "",
      requirement: requirement || "",
      company: finalCompany || "Unknown",
      role: position || "",
    };
  };

  async function fetchEmails(silent = false) {
    if (!silent) setLoading(true);
    else setIsRefreshing(true);

    try {
      const response = await fetch("/api/inbox");
      const result = await response.json();
      if (result.success) {
        setEmails(result.data);
        setLastUpdated(new Date());
        setError(null);

        // Auto-redirect logic for lead enrichment
        if (result.data && result.data.length > 0) {
          const latestEmail = result.data[0];

          // Only process if we haven't already redirected for this specific email ID
          if (latestEmail.id !== lastRedirectedId) {
            const parsed = parseLeadInfo(
              latestEmail.body || latestEmail.snippet,
              latestEmail.from,
            );

            // Check against saved leads (0th index as per request)
            const searchRes = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/api/getsearchparams`,
            );
            const searchResult = await searchRes.json();

            let shouldRedirect = true;
            if (
              searchResult.success &&
              searchResult.data &&
              searchResult.data.length > 0
            ) {
              const firstSaved = searchResult.data[0];

              // Priority 1: Match by Email
              const emailMatches =
                parsed.email &&
                firstSaved.email &&
                parsed.email.toLowerCase() === firstSaved.email.toLowerCase();

              // Priority 2: Match by Name (Fallback)
              const nameMatches =
                parsed.name?.toLowerCase() === firstSaved.name?.toLowerCase();

              // If it's a match and it already has results, don't redirect
              if (
                (emailMatches || nameMatches) &&
                firstSaved.responce_results
              ) {
                shouldRedirect = false;
              }
            }
            console.log("params", {
              name: parsed.name,
              company: parsed.company,
              role: parsed.role,
              email: parsed.email,
              requirement: parsed.requirement,
              budget: parsed.budget,
              autoStart: "true",
            });
            if (shouldRedirect) {
              setLastRedirectedId(latestEmail.id);
              const params = new URLSearchParams({
                name: parsed.name,
                company: parsed.company,
                role: parsed.role,
                email: parsed.email,
                requirement: parsed.requirement,
                budget: parsed.budget,
                autoStart: "true",
              });

              // router.push(`/agent?${params.toString()}`);
            }
          }
        }
      } else if (!silent) {
        setError(result.message);
      }
    } catch (err) {
      if (!silent) setError("Failed to fetch emails");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    fetchEmails(); // Initial fetch

    // Auto-update every 10 seconds
    const interval = setInterval(() => fetchEmails(true), 12000);

    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className={styles.status}>Loading emails...</div>;
  if (error) return <div className={styles.status}>Error: {error}</div>;

  return (
    <div className={styles.emailListWrapper}>
      <div className={styles.listHeader}>
        <div className={styles.updateStatus}>
          {isRefreshing ? (
            <span className={styles.refreshing}>
              <span
                className="spinner-border spinner-border-sm me-2"
                style={{ width: "12px", height: "12px" }}
              ></span>
              Checking for new messages...
            </span>
          ) : lastUpdated ? (
            <span className={styles.lastUpdated}>
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
          ) : null}
        </div>
      </div>
      <div className={styles.emailListContainer}>
        {emails.length === 0 ? (
          <div className={styles.status}>No emails found.</div>
        ) : (
          emails.map((email) => (
            <div key={email.id} className={styles.emailCard}>
              <div className={styles.left}>
                <h5 className={styles.sender}>{email.from}</h5>
                <p className={styles.subject}>{email.subject}</p>
                <p className={styles.message}>{email.snippet}</p>
              </div>
              <div className={styles.right}>
                <span className={styles.time}>
                  {new Date(email.date).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
