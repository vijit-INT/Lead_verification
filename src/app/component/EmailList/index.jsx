"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./EmailList.module.scss";
import { insertSearchParams } from "../../../services/leadService";
import {
  findLinkedInProfile,
  findCompanyLinkedIn,
  findCompanyWebsite,
  deepCompanySearch,
  deepPersonSearch,
} from "../../../lib/search";
import { enrichProfile } from "../../../lib/gemini";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import LeadReport from "../Agents/LeadReport";
import agentStyles from "../Agents/Agents.module.css";

export default function EmailList({ headerOnly = false }) {
  const router = useRouter();
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [lastRedirectedId, setLastRedirectedId] = useState(null);
  const [processingEmails, setProcessingEmails] = useState(new Set());
  const [enrichmentStatus, setEnrichmentStatus] = useState(null);
  const [savedLeads, setSavedLeads] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [leadToDownload, setLeadToDownload] = useState(null);
  const [downloadingLeadId, setDownloadingLeadId] = useState(null);
  const reportRef = React.useRef(null);

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
      /(?:First Name|FirstName)\s*[-:]\s*([^\r\n]+)/i,
      /(?:First Name|FirstName)\s*:\s*([^\r\n]+)/i,
    ]);
    const lastName = findField([
      /(?:Last Name|LastName)\s*[-:]\s*([^\r\n]+)/i,
      /(?:Last Name|LastName)\s*:\s*([^\r\n]+)/i,
    ]);
    const fullName = findField([
      /(?:Name|Full Name|Lead Name)\s*[-:]\s*([^\r\n]+)/i,
      /(?:Name|Full Name|Lead Name)\s*:\s*([^\r\n]+)/i,
    ]);

    let name = fullName;
    if (!name && firstName) {
      name = lastName ? `${firstName} ${lastName}` : firstName;
    }

    const email =
      findField([
        /(?:Email|Email Address|Contact Email)\s*[-:]\s*([^\r\n]+)/i,
        /(?:Email|Email Address|Contact Email)\s*:\s*([^\r\n]+)/i,
      ]) ||
      fromEmail?.match(/<(.+?)>/)?.[1] ||
      (fromEmail && !fromEmail.includes("<") ? fromEmail : null);

    const budget = findField([
      /(?:Budget|What is your budget\?|Project Budget)\s*[-:]\s*([^\r\n]+)/i,
      /(?:Budget|What is your budget\?|Project Budget)\s*:\s*([^\r\n]+)/i,
    ]);

    const requirement = findField([
      /(?:Requirement|Requirement Type|requirement_type|Message|Description|Project Details|Project|Services)\s*[-:]\s*([^\r\n]+)/i,
      /(?:Requirement|Requirement Type|requirement_type|Message|Description|Project Details|Project|Services)\s*:\s*([^\r\n]+)/i,
    ]);

    const companyName = findField([
      /(?:Company|Company Name|Organization|Account Name)\s*[-:]\s*([^\r\n]+)/i,
      /(?:Company|Company Name|Organization|Account Name)\s*:\s*([^\r\n]+)/i,
    ]);
    const position = findField([
      /(?:Position|Role|Job Title|Designation)\s*[-:]\s*([^\r\n]+)/i,
      /(?:Position|Role|Job Title|Designation)\s*:\s*([^\r\n]+)/i,
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
      const parts = email.split("@");
      if (parts.length > 1) {
        const domain = parts[1].toLowerCase();
        const publicProviders = [
          "gmail.com",
          "yahoo.com",
          "outlook.com",
          "hotmail.com",
          "icloud.com",
          "live.com",
          "aol.com",
          "protonmail.com",
          "me.com",
          "msn.com",
          "yandex.com",
          "zoho.com",
          "gmx.com",
          "mail.com",
          "googlemail.com",
        ];

        if (domain && !publicProviders.includes(domain)) {
          const domainName = domain.split(".")[0];
          // Capitalize first letter (e.g., google.com -> Google)
          finalCompany =
            domainName.charAt(0).toUpperCase() + domainName.slice(1);
          console.log(
            `🏢 Extracted company "${finalCompany}" from professional domain: ${domain}`,
          );
        }
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

  async function handleBackgroundInvestigation(data, emailId) {
    setProcessingEmails((prev) => new Set(prev).add(emailId));
    setEnrichmentStatus(`Enriching lead: ${data.name}...`);

    try {
      console.log("🚀 Background Investigation for:", data.name);

      // 1. Parallel Intelligence Gathering
      const [
        userLinkedIn,
        companyLinkedIn,
        companyWebsite,
        deepCompanyResults,
        deepPersonResults,
      ] = await Promise.all([
        findLinkedInProfile(data.name, data.company, data.role),
        findCompanyLinkedIn(data.company),
        findCompanyWebsite(data.company),
        deepCompanySearch(data.company),
        deepPersonSearch(data.name, data.company, data.role),
      ]);

      // 2. Advanced AI Synthesis
      const searchData = {
        userLinkedIn,
        companyLinkedIn,
        companyWebsite,
        deepCompanyResults,
        deepPersonResults,
      };

      const enrichedData = await enrichProfile(searchData, {
        name: data.name,
        companyName: data.company,
        role: data.role,
        email: data.email,
        requirement: data.requirement,
        budget: data.budget,
      });

      if (enrichedData) {
        const payload = {
          fullname: data.name,
          companyName: data.company,
          role: data.role,
          email_address: data.email,
          requirement: data.requirement,
          budget: data.budget,
          responce_results: JSON.stringify(enrichedData),
          search_params: JSON.stringify({
            name: data.name,
            companyName: data.company,
            role: data.role,
            email: data.email,
            requirement: data.requirement,
            budget: data.budget,
          }),
        };

        const res = await insertSearchParams(payload);
        console.log("✅ Background enrichment saved for:", data.name, res);
        setEnrichmentStatus(`Successfully enriched: ${data.name}`);

        // Trigger automatic PDF download
        setLeadToDownload({ results: enrichedData, formData: data });
        setDownloadingLeadId(emailId);

        setTimeout(() => setEnrichmentStatus(null), 5000);
      }
    } catch (err) {
      console.error("❌ Background enrichment failed:", err);
      setEnrichmentStatus(`Enrichment failed for ${data.name}`);
      setTimeout(() => setEnrichmentStatus(null), 5000);
    } finally {
      setProcessingEmails((prev) => {
        const next = new Set(prev);
        next.delete(emailId);
        return next;
      });
      // Refresh inbox after 10 seconds delay once enrichment completes
      setTimeout(() => fetchEmails(true), 10000);
    }
  }

  async function fetchEmails(silent = false) {
    if (processingEmails.size > 0) {
      console.log(
        "ℹ️ Enrichment in progress. Skipping inbox sync to avoid conflicts.",
      );
      return;
    }

    if (!silent) setLoading(true);
    else setIsRefreshing(true);

    try {
      const response = await fetch("/api/inbox");
      const result = await response.json();

      // Also fetch saved leads to show status
      const searchRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/getsearchparams`,
      );
      const searchResult = await searchRes.json();
      if (searchResult.success) {
        setSavedLeads(searchResult.data || []);
      }

      if (result.success) {
        setEmails(result.data);
        setLastUpdated(new Date());
        setError(null);

        // Background enrichment logic
        if (result.data && result.data.length > 0) {
          const latestEmail = result.data[0];

          // Only process if we haven't already processed/redirected for this specific email ID
          if (
            latestEmail.id !== lastRedirectedId &&
            !processingEmails.has(latestEmail.id)
          ) {
            const parsed = parseLeadInfo(
              latestEmail.body || latestEmail.snippet,
              latestEmail.from,
            );
            console.log("parsed email", parsed);
            // Validation criteria with explicit email check
            const missingFields = [];
            if (!parsed.name || parsed.name === "Unknown")
              missingFields.push("name");
            if (!parsed.company || parsed.company === "Unknown")
              missingFields.push("company");
            if (!parsed.requirement) missingFields.push("requirement");
            if (!parsed.budget) missingFields.push("budget");

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            const hasValidEmail = parsed.email && emailRegex.test(parsed.email);
            if (!hasValidEmail) missingFields.push("valid email");

            const hasMinFields = missingFields.length === 0;

            if (!hasMinFields) {
              console.log(
                `⏭️ Skipping email (missing/invalid ${missingFields.join(", ")}):`,
                latestEmail.subject,
              );
              setLastRedirectedId(latestEmail.id);
              return;
            }

            // Check against saved leads
            const searchRes = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/api/getsearchparams`,
            );
            const searchResult = await searchRes.json();

            let shouldEnrich = true;
            if (
              searchResult.success &&
              searchResult.data &&
              searchResult.data.length > 0
            ) {
              const firstSaved = searchResult.data[0];
              console.log("searchResult.data[0]", searchResult.data[0]);
              const emailMatches =
                parsed.email &&
                firstSaved.email &&
                parsed.email.toLowerCase() === firstSaved.email.toLowerCase();

              const nameMatches =
                parsed.name?.toLowerCase() === firstSaved.name?.toLowerCase();

              if (
                (emailMatches || nameMatches) &&
                firstSaved.responce_results
              ) {
                shouldEnrich = false;
              }
            }

            if (shouldEnrich) {
              setLastRedirectedId(latestEmail.id);
              handleBackgroundInvestigation(parsed, latestEmail.id);
            } else {
              // Still update lastRedirectedId if we decided not to enrich because it exists
              setLastRedirectedId(latestEmail.id);
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
    const interval = setInterval(() => fetchEmails(true), 60000);

    return () => clearInterval(interval);
  }, []);

  const downloadAsPDF = (data, results) => {
    if (!reportRef.current) return;

    const element = reportRef.current;

    // Wait for DOM to render the hidden report
    setTimeout(() => {
      html2canvas(element, {
        scale: 3,
        useCORS: true,
        logging: false,
        backgroundColor: "#f8faff",
        onclone: (clonedDoc) => {
          const clonedEl = clonedDoc.querySelector(
            `.${agentStyles.resultsContainer}`,
          );
          if (clonedEl) {
            clonedEl.style.opacity = "1";
            clonedEl.style.visibility = "visible";
            clonedEl.style.display = "block";
            clonedEl.style.width = "1200px"; // Wider for better resolution
            clonedEl.style.padding = "40px";
            clonedEl.style.margin = "0 auto";
            clonedEl.style.background = "#ffffff";
            clonedEl.style.animation = "none";
          }
          // Kill all animations and force visibility in the cloned document
          clonedDoc.querySelectorAll("*").forEach((node) => {
            node.style.animation = "none";
            node.style.transition = "none";
          });
        },
      })
        .then((canvas) => {
          const imgData = canvas.toDataURL("image/png", 1.0);
          const pdf = new jsPDF("p", "mm", "a4", true);
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = pdf.internal.pageSize.getHeight();
          
          const margin = 10; // 10mm margin
          const contentWidth = pdfWidth - (2 * margin);
          const contentHeight = pdfHeight - (2 * margin);

          const imgWidth = canvas.width;
          const imgHeight = canvas.height;
          const ratio = contentWidth / imgWidth;

          const finalWidth = contentWidth;
          const finalHeight = imgHeight * ratio;

          let heightLeft = finalHeight;
          let currentPage = 0;

          while (heightLeft > 0) {
            if (currentPage > 0) pdf.addPage();
            currentPage++;

            const position = margin - (currentPage - 1) * contentHeight;

            pdf.addImage(
              imgData,
              "PNG",
              margin,
              position,
              finalWidth,
              finalHeight,
              undefined,
              "FAST",
            );

            // Cover margins with white rectangles to prevent content duplication
            pdf.setFillColor(255, 255, 255);
            pdf.rect(0, 0, pdfWidth, margin, "F"); // Top mask
            pdf.rect(0, pdfHeight - margin, pdfWidth, margin, "F"); // Bottom mask

            heightLeft -= contentHeight;
          }

          const fileName = `Investigation_Report_${data.name.replace(/\s+/g, "_") || "Lead"}.pdf`;
          pdf.save(fileName);

          // Cleanup after download
          setLeadToDownload(null);
          setDownloadingLeadId(null);
        })
        .catch((err) => {
          console.error("PDF Export Error:", err);
          setLeadToDownload(null);
          setDownloadingLeadId(null);
        });
    }, 1000);
  };

  useEffect(() => {
    if (leadToDownload && reportRef.current) {
      downloadAsPDF(leadToDownload.formData, leadToDownload.results);
    }
  }, [leadToDownload]);

  const handleViewReport = (email) => {
    // Find the saved lead for this email
    const parsed = parseLeadInfo(email.body || email.snippet, email.from);
    const saved = savedLeads.find((lead) => {
      const emailMatch =
        parsed.email &&
        lead.email_address &&
        parsed.email.toLowerCase() === lead.email_address.toLowerCase();
      const nameMatch =
        parsed.fullname &&
        lead.fullname &&
        parsed.fullname.toLowerCase() === lead.fullname.toLowerCase();
      return emailMatch || nameMatch;
    });

    if (saved && saved.responce_results) {
      try {
        const results = JSON.parse(saved.responce_results);
        const formData = saved.search_params
          ? JSON.parse(saved.search_params)
          : {
              name: saved.fullname,
              companyName: saved.companyName,
              role: saved.role,
              email: saved.email_address,
              requirement: saved.requirement,
              budget: saved.budget,
            };
        setSelectedReport({ results, formData });
      } catch (e) {
        console.error("Error parsing saved results", e);
      }
    }
  };

  if (loading) return <div className={styles.status}>Loading emails...</div>;
  if (error) return <div className={styles.status}>Error: {error}</div>;

  return (
    <div
      className={`${styles.emailListWrapper} ${headerOnly ? styles.headerOnly : ""}`}
    >
      <div className={styles.listHeader}>
        <div className={`${styles.updateStatus}`}>
          <div>
            <h3>Lead Verification</h3>
          </div>
          <div>
            {isRefreshing ? (
              <span className={styles.refreshing}>
                <span
                  className="spinner-border spinner-border-sm me-2"
                  style={{ width: "12px", height: "12px" }}
                ></span>
                Checking for new messages...
              </span>
            ) : enrichmentStatus ? (
              <span className={styles.enriching}>
                <span
                  className="spinner-border spinner-border-sm me-2"
                  style={{ width: "12px", height: "12px", color: "#3b82f6" }}
                ></span>
                {enrichmentStatus}
              </span>
            ) : lastUpdated ? (
              <span className={styles.lastUpdated}>
                Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {!headerOnly && (
        <div className={styles.emailListContainer}>
          {emails.length === 0 ? (
            <div className={styles.status}>No emails found.</div>
          ) : (
            emails.map((email) => {
              const parsed = parseLeadInfo(
                email.body || email.snippet,
                email.from,
              );
              const saved = savedLeads.find((lead) => {
                const emailMatch =
                  parsed.email &&
                  lead.email_address &&
                  parsed.email.toLowerCase() ===
                    lead.email_address.toLowerCase();
                return emailMatch;
              });
              const isProcessing = processingEmails.has(email.id);
              const isEnriched = !!(saved && saved.responce_results);

              return (
                <div
                  key={email.id}
                  className={`${styles.emailCard} ${isEnriched ? styles.enrichedCard : ""}`}
                  onClick={() => isEnriched && handleViewReport(email)}
                >
                  <div className={styles.left}>
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <h5 className={styles.sender}>{email.from}</h5>
                      {isEnriched && (
                        <span className="badge bg-success-subtle text-success border border-success-subtle">
                          <span
                            className="material-symbols-outlined align-middle me-1"
                            style={{ fontSize: "14px" }}
                          >
                            verified
                          </span>
                          Enriched
                        </span>
                      )}
                      {isProcessing && (
                        <span className="badge bg-primary-subtle text-primary border border-primary-subtle">
                          <span
                            className="spinner-border spinner-border-sm me-1"
                            style={{ width: "10px", height: "10px" }}
                          ></span>
                          Analyzing...
                        </span>
                      )}
                    </div>
                    <p className={styles.subject}>{email.subject}</p>
                    <p className={styles.message}>{email.snippet}</p>
                  </div>
                  <div className={styles.right}>
                    <div className="d-flex flex-column align-items-end">
                      <span className={styles.time}>
                        {new Date(email.date).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {isEnriched && (
                        <button
                          className="btn btn-sm btn-outline-primary mt-2 d-flex align-items-center gap-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewReport(email);
                          }}
                        >
                          <span
                            className="material-symbols-outlined"
                            style={{ fontSize: "16px" }}
                          >
                            visibility
                          </span>
                          View Report
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {!headerOnly && selectedReport && (
        <div className={styles.reportOverlay}>
          <div className={styles.reportContent}>
            <div className={styles.reportHeader}>
              <div>
                <h4 className="mb-0">Investigation Results</h4>
                <p className="text-muted small mb-0">
                  Autonomous AI Lead Analysis
                </p>
              </div>
              <div className="d-flex align-items-center gap-2">
                <button
                  className="btn btn-dark d-flex align-items-center gap-2"
                  onClick={() =>
                    downloadAsPDF(
                      selectedReport.formData,
                      selectedReport.results,
                    )
                  }
                >
                  <span className="material-symbols-outlined">download</span>
                  Export PDF
                </button>
                <button
                  className="btn btn-light btn-close-custom"
                  onClick={() => setSelectedReport(null)}
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
            </div>
            <div className={styles.reportScroll}>
              <LeadReport
                results={selectedReport.results}
                formData={selectedReport.formData}
              />
            </div>
          </div>
        </div>
      )}

      {/* Hidden Lead Report for PDF Generation */}
      <div style={{ position: "fixed", left: "-9999px", top: "0", zIndex: -1 }}>
        {leadToDownload && (
          <div style={{ width: "800px" }}>
            <LeadReport
              results={leadToDownload.results}
              formData={leadToDownload.formData}
              reportRef={reportRef}
            />
          </div>
        )}
      </div>
    </div>
  );
}
