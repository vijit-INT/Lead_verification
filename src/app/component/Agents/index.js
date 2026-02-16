"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import axios from "axios";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import styles from "./Agents.module.css";
import {
  insertSearchParams,
  insertChatHistory,
} from "../../../services/leadService";
import {
  findLinkedInProfile,
  findCompanyLinkedIn,
  findCompanyWebsite,
  deepCompanySearch,
  deepPersonSearch,
  googleSearch,
} from "../../../lib/search";
import { enrichProfile, askFollowUp } from "../../../lib/gemini";

export default function Agents() {
  const [formData, setFormData] = useState({
    name: "",
    role: "",
    email: "",
    companyName: "",
    requirement: "",
    budget: "",
  });
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchId, setSearchId] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const reportRef = useRef(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Chat State
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatSearching, setChatSearching] = useState(false);
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, chatLoading, chatSearching]);

  // Axios instance (optional, but good practice for base URL)
  // import axios from 'axios'; inside the function if not imported at top, but usually top-level

  // NOTE: In a real app, you might extract these API calls to a service file.

  // URL Parameter Handling
  const searchParams = useSearchParams();
  const hasAutoStarted = useRef(false);

  useEffect(() => {
    if (hasAutoStarted.current) return;

    const name = searchParams.get("name");
    const company = searchParams.get("company");
    const role = searchParams.get("role");
    const email = searchParams.get("email");
    const autoStart = searchParams.get("autoStart");

    if (name || company || role || email) {
      const newFormData = {
        name: name || "",
        companyName: company || "",
        role: role || "",
        email: email || "",
      };
      setFormData(newFormData);

      if (autoStart === "true" && name && company) {
        hasAutoStarted.current = true;
        startInvestigation(newFormData);
      }
    }
  }, [searchParams]);

  const startInvestigation = async (overriddenData = null) => {
    const data = overriddenData || formData;
    setLoading(true);
    setError(null);
    setSuccess(null);
    setSearchId(null);
    setResults(null);

    try {
      console.log("🚀 Starting Investigation for:", data.name);

      // 1. Parallel Multi-Angle Intelligence Gathering
      const [
        userLinkedIn,
        companyLinkedIn,
        companyWebsite,
        deepCompanyResults,
        deepPersonResults,
      ] = await Promise.all([
        findLinkedInProfile(data.name, data.companyName, data.role),
        findCompanyLinkedIn(data.companyName),
        findCompanyWebsite(data.companyName),
        deepCompanySearch(data.companyName),
        deepPersonSearch(data.name, data.companyName, data.role),
      ]);

      if (!userLinkedIn.url && !companyLinkedIn.url) {
        throw new Error(
          "No LinkedIn profile or Company page found. Please check spelling.",
        );
      }

      console.log("✅ Search Complete. Found:", {
        userLinkedIn,
        companyLinkedIn,
      });

      // 2. Advanced AI Synthesis
      const searchData = {
        userLinkedIn,
        companyLinkedIn,
        companyWebsite,
        deepCompanyResults,
        deepPersonResults,
      };

      const enrichedData = await enrichProfile(searchData, data);

      if (enrichedData) {
        setResults(enrichedData);

        const payload = {
          fullname: data.name,
          companyName: data.companyName,
          role: data.role,
          email_address: data.email,
          requirement: data.requirement,
          budget: data.budget,
          responce_results: JSON.stringify(enrichedData),
        };

        insertSearchParams(payload)
          .then((res) => {
            console.log("✅ Lead data and investigation results saved:", res);
            if (res.success && res.searchParamId) {
              setSearchId(res.searchParamId);
            }
            setSuccess(
              res?.message || "Investigation results saved successfully!",
            );
          })
          .catch((err) => {
            console.error("❌ Failed to save lead data:", err);
            setError(
              err?.response?.data?.message ||
                "Error saving investigation results",
            );
          });
      } else {
        throw new Error("AI Processing failed to generate a profile.");
      }
    } catch (err) {
      console.error("Search Error:", err);
      setError(err.message || "An error occurred during search");
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    await startInvestigation();
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userQuestion = chatInput;
    setChatInput("");
    setChatHistory((prev) => [
      ...prev,
      { role: "user", content: userQuestion },
    ]);
    setChatLoading(true);

    try {
      // 1. New Global Search based on question
      setChatSearching(true);
      const searchContext = `${userQuestion} ${formData.name} ${formData.companyName}`;
      const newGlobalKnowledge = await googleSearch(searchContext);
      setChatSearching(false);

      // 2. Ask Gemini with full context
      const aiResponse = await askFollowUp(
        userQuestion,
        results,
        newGlobalKnowledge,
      );

      setChatHistory((prev) => [...prev, { role: "ai", content: aiResponse }]);

      // 3. Save Chat History if searchId exists
      if (searchId) {
        insertChatHistory({
          serach_id: searchId,
          chat_history: aiResponse,
        })
          .then((res) => console.log("✅ Chat history saved:", res))
          .catch((err) =>
            console.error("❌ Failed to save chat history:", err),
          );
      }
    } catch (err) {
      console.error("Chat Error:", err);
      setChatHistory((prev) => [
        ...prev,
        {
          role: "ai",
          content: "I encountered an error researching that. Please try again.",
        },
      ]);
    } finally {
      setChatLoading(false);
      setChatSearching(false);
    }
  };

  const handleClearChat = () => {
    setChatHistory([]);
  };

  const downloadPDF = (includeChat = true) => {
    if (!reportRef.current) return;
    setIsDownloading(true);
    setShowDownloadMenu(false);

    const element = reportRef.current;

    // Temporarily hide elements that shouldn't be in PDF
    const chatContainer = element.querySelector(`.${styles.chatContainer}`);
    const chatInputArea = element.querySelector(`.${styles.chatInputArea}`);
    const clearBtn = element.querySelector(`.${styles.clearBtn}`);

    const originalChatDisplay = chatContainer
      ? chatContainer.style.display
      : "";
    const originalChatInputDisplay = chatInputArea
      ? chatInputArea.style.display
      : "";
    const originalClearBtnDisplay = clearBtn ? clearBtn.style.display : "";

    if (!includeChat && chatContainer) {
      chatContainer.style.display = "none";
    }
    if (chatInputArea) chatInputArea.style.display = "none";
    if (clearBtn) clearBtn.style.display = "none";

    // Wait for animations and menu to close
    setTimeout(() => {
      html2canvas(element, {
        scale: 3, // High resolution
        useCORS: true,
        logging: false,
        backgroundColor: "#f8faff",
        scrollY: -window.scrollY,
        onclone: (clonedDoc) => {
          // Force visibility and stop animations in the cloned version
          const clonedEl = clonedDoc.querySelector(
            `.${styles.resultsContainer}`,
          );
          if (clonedEl) {
            clonedEl.style.animation = "none";
            clonedEl.style.opacity = "1";
            clonedEl.style.transform = "none";
            clonedEl.style.visibility = "visible";
          }
          // Ensure all cards are visible
          clonedDoc.querySelectorAll(".card").forEach((card) => {
            card.style.opacity = "1";
            card.style.transform = "none";
            card.style.animation = "none";
          });
        },
        ignoreElements: (el) => {
          return (
            el.classList.contains("no-pdf") ||
            el.classList.contains(styles.downloadDropdown)
          );
        },
      })
        .then((canvas) => {
          // Restore visibility
          if (!includeChat && chatContainer)
            chatContainer.style.display = originalChatDisplay;
          if (chatInputArea)
            chatInputArea.style.display = originalChatInputDisplay;
          if (clearBtn) clearBtn.style.display = originalClearBtnDisplay;

          const imgData = canvas.toDataURL("image/jpeg", 1.0);
          const pdf = new jsPDF("p", "mm", "a4");
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = pdf.internal.pageSize.getHeight();

          const imgWidth = canvas.width;
          const imgHeight = canvas.height;
          const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);

          const finalWidth = imgWidth * ratio;
          const finalHeight = imgHeight * ratio;

          let heightLeft = finalHeight;
          let position = 0;

          pdf.addImage(
            imgData,
            "JPEG",
            (pdfWidth - finalWidth) / 2,
            position,
            finalWidth,
            finalHeight,
            undefined,
            "FAST",
          );
          heightLeft -= pdfHeight;

          while (heightLeft > 0) {
            position = heightLeft - finalHeight;
            pdf.addPage();
            pdf.addImage(
              imgData,
              "JPEG",
              (pdfWidth - finalWidth) / 2,
              position,
              finalWidth,
              finalHeight,
              undefined,
              "FAST",
            );
            heightLeft -= pdfHeight;
          }

          const fileName = `Investigation_Report_${formData.name.replace(/\s+/g, "_") || "Lead"}.pdf`;
          pdf.save(fileName);
          setIsDownloading(false);
        })
        .catch((err) => {
          console.error("PDF Export Error:", err);
          setIsDownloading(false);
          if (!includeChat && chatContainer)
            chatContainer.style.display = originalChatDisplay;
          if (chatInputArea)
            chatInputArea.style.display = originalChatInputDisplay;
          if (clearBtn) clearBtn.style.display = originalClearBtnDisplay;
        });
    }, 500);
  };

  // GET Request (Example placeholder)
  const handleGet = async () => {
    try {
      const response = await axios.get("/api/linkedin-search");
      console.log("GET Response:", response.data);
      // Handle data...
    } catch (error) {
      console.error("GET Error:", error);
      // Handle error...
    }
  };

  // PUT Request (Example placeholder)
  const handlePut = async () => {
    try {
      const response = await axios.put("/api/linkedin-search", {
        ...formData,
        action: "update",
      });
      console.log("PUT Response:", response.data);
      // Handle success...
    } catch (error) {
      console.error("PUT Error:", error);
      // Handle error...
    }
  };

  // DELETE Request (Example placeholder)
  const handleDelete = async () => {
    try {
      // Assuming we need an ID or similar
      const response = await axios.delete("/api/linkedin-search", {
        data: { email: formData.email },
      });
      console.log("DELETE Response:", response.data);
      // Handle success...
    } catch (error) {
      console.error("DELETE Error:", error);
      // Handle error...
    }
  };

  return (
    <div className={`${styles.agentsContainer} container-fluid p-4`}>
      <div className={styles.pageHeader}>
        <div className={styles.headerTitle}>
          <h1>
            <div className={styles.iconCircle}>
              <span className="material-symbols-outlined">person_search</span>
            </div>
            AI Lead Investigator
          </h1>
          <p>Find and enrich profile data with autonomous AI agents.</p>
        </div>
        <Link href="/" className={styles.backButton}>
          <span className="material-symbols-outlined">dashboard</span>
          Back to Dashboard
        </Link>
      </div>

      <div className="row">
        <div className="col-12">
          <div className={styles.formCard}>
            <h5 className="mb-4 d-flex align-items-center gap-2">
              <span className="material-symbols-outlined text-primary">
                person_add
              </span>
              Investigation Parameters
            </h5>
            <form onSubmit={handleSearch}>
              <div className={styles.inputGrid}>
                <div className={styles.inputField}>
                  <label htmlFor="name">
                    Lead Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className={styles.customInput}
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., Vijit Singh"
                  />
                </div>

                <div className={styles.inputField}>
                  <label htmlFor="companyName">
                    Company Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className={styles.customInput}
                    id="companyName"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., IntGlobal"
                  />
                </div>

                <div className={styles.inputField}>
                  <label htmlFor="role">Industry/Role</label>
                  <input
                    type="text"
                    className={styles.customInput}
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    placeholder="e.g., Software Engineer"
                  />
                </div>

                <div className={styles.inputField}>
                  <label htmlFor="email">Email Address</label>
                  <input
                    type="email"
                    className={styles.customInput}
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="e.g., name@company.com"
                  />
                </div>

                <div className={styles.inputField}>
                  <label htmlFor="requirement">
                    Business Requirement <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className={styles.customInput}
                    id="requirement"
                    name="requirement"
                    required
                    value={formData.requirement}
                    onChange={handleInputChange}
                    placeholder="e.g., Needs Mobile App for Real Estate"
                  />
                </div>

                <div className={styles.inputField}>
                  <label htmlFor="budget">Project Budget (INR)</label>
                  <input
                    type="text"
                    className={styles.customInput}
                    id="budget"
                    name="budget"
                    value={formData.budget}
                    onChange={handleInputChange}
                    placeholder="e.g., 5,00,000"
                  />
                </div>

                <button
                  type="submit"
                  className={styles.searchBtn}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm"
                        role="status"
                      ></span>
                      Searching...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined">
                        analytics
                      </span>
                      Start Investigation
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="row justify-content-center">
        <div className="col-lg-10">
          {error && (
            <div className="alert alert-danger" role="alert">
              <span className="material-symbols-outlined me-2">error</span>
              <strong>Error:</strong> {error}
            </div>
          )}

          {success && (
            <div className="alert alert-success" role="alert">
              <span className="material-symbols-outlined me-2">
                check_circle
              </span>
              {success}
            </div>
          )}

          {results && (
            <div className={styles.resultsContainer} ref={reportRef}>
              <div className="d-flex justify-content-end mb-4 no-pdf">
                <div className={styles.downloadDropdown}>
                  <button
                    className={styles.downloadBtn}
                    onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                    disabled={isDownloading}
                  >
                    {isDownloading ? (
                      <span className="spinner-border spinner-border-sm me-2"></span>
                    ) : (
                      <span className="material-symbols-outlined me-2">
                        download
                      </span>
                    )}
                    {isDownloading ? "Generating PDF..." : "Download Report"}
                    <span className="material-symbols-outlined ms-2">
                      {showDownloadMenu ? "expand_less" : "expand_more"}
                    </span>
                  </button>

                  {showDownloadMenu && (
                    <div className={styles.dropdownMenu}>
                      <button onClick={() => downloadPDF(false)}>
                        <span className="material-symbols-outlined">
                          description
                        </span>
                        Report Only (No Chat)
                      </button>
                      <button onClick={() => downloadPDF(true)}>
                        <span className="material-symbols-outlined">forum</span>
                        Report + Chat History
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Scoring Section */}
              {results.businessAnalysis && (
                <div className={`${styles.resultCard} card shadow-sm mb-4`}>
                  <div className="card-header bg-dark text-white">
                    <h5 className="mb-0 d-flex align-items-center">
                      <span className="material-symbols-outlined me-2">
                        speed
                      </span>
                      AI Lead Alignment Score
                    </h5>
                  </div>
                  <div className="card-body">
                    <div className={styles.scoreHeader}>
                      <div className={styles.donutWrapper}>
                        <div
                          className={styles.donutChart}
                          style={{
                            "--percentage":
                              results.businessAnalysis.alignmentScore,
                          }}
                        >
                          <div className={styles.donutInternal}>
                            <span className={styles.donutScore}>
                              {results.businessAnalysis.alignmentScore}
                            </span>
                            <span className={styles.donutLabel}>Score</span>
                          </div>
                        </div>
                      </div>

                      <div className={styles.scoringDetails}>
                        <div className={styles.pointSection}>
                          <h6 className={styles.earnedTitle}>
                            <span className="material-symbols-outlined">
                              add_circle
                            </span>
                            Points Earned
                          </h6>
                          <div className={styles.pointList}>
                            {results.businessAnalysis.scoringBreakdown?.pointsEarned?.map(
                              (item, idx) => (
                                <div key={idx} className={styles.pointItem}>
                                  <span>{item.point}</span>
                                  <span
                                    className={`${styles.pointValue} ${styles.earnedValue}`}
                                  >
                                    {item.value}
                                  </span>
                                </div>
                              ),
                            )}
                          </div>
                        </div>

                        <div className={styles.pointSection}>
                          <h6 className={styles.deductedTitle}>
                            <span className="material-symbols-outlined">
                              remove_circle
                            </span>
                            Points Deducted
                          </h6>
                          <div className={styles.pointList}>
                            {results.businessAnalysis.scoringBreakdown?.pointsDeducted?.map(
                              (item, idx) => (
                                <div key={idx} className={styles.pointItem}>
                                  <span>{item.point}</span>
                                  <span
                                    className={`${styles.pointValue} ${styles.deductedValue}`}
                                  >
                                    {item.value}
                                  </span>
                                </div>
                              ),
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 p-3 bg-light rounded border">
                      <div className="d-flex align-items-center gap-3">
                        <div
                          className={`badge ${results.businessAnalysis.alignmentScore > 70 ? "bg-success" : "bg-warning"} text-wrap`}
                        >
                          {results.businessAnalysis.recommendation}
                        </div>
                        <p className="mb-0 small text-muted">
                          <strong>Executive Summary:</strong>{" "}
                          {results.businessAnalysis.requirementAnalysis}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Potential Risk Section */}
              {results.businessAnalysis?.potentialRisks &&
                results.businessAnalysis.potentialRisks.length > 0 && (
                  <div
                    className={`${styles.resultCard} card shadow-sm mb-4 border-danger`}
                  >
                    <div className="card-header bg-danger text-white">
                      <h5 className="mb-0 d-flex align-items-center">
                        <span className="material-symbols-outlined me-2">
                          warning
                        </span>
                        Potential Sales Risks & Red Flags
                      </h5>
                    </div>
                    <div className="card-body bg-danger-subtle">
                      <div className="row">
                        <div className="col-12">
                          <ul className="mb-0">
                            {results.businessAnalysis.potentialRisks.map(
                              (risk, idx) => (
                                <li key={idx} className="mb-2 text-dark">
                                  <strong>Risk Indicator:</strong> {risk}
                                </li>
                              ),
                            )}
                          </ul>
                          <div className="mt-2 small text-muted">
                            <span
                              className="material-symbols-outlined align-middle me-1"
                              style={{ fontSize: "1rem" }}
                            >
                              info
                            </span>
                            These risks are deduced from discrepancies between
                            the stated requirement and public company data.
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              {/* Financial & Strategic Roadmap Section */}
              {results.financialAudit && (
                <div className={`${styles.resultCard} card shadow-sm mb-4`}>
                  <div className="card-header bg-secondary text-white">
                    <div className="d-flex justify-content-between align-items-center">
                      <h5 className="mb-0 d-flex align-items-center">
                        <span className="material-symbols-outlined me-2">
                          account_balance
                        </span>
                        Financial & Strategic Roadmap
                      </h5>
                      <span className="badge bg-light text-dark">
                        {results.financialAudit.companyStatus}
                      </span>
                    </div>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-6 mb-4">
                        <h6 className="text-primary d-flex align-items-center gap-2 mb-3">
                          <span className="material-symbols-outlined">
                            query_stats
                          </span>
                          Financial Summary & Status
                        </h6>
                        <div className="p-3 border rounded bg-white small">
                          {results.financialAudit.financialSummary}
                          {results.financialAudit.listingDetails && (
                            <div className="mt-2 pt-2 border-top font-monospace">
                              {results.financialAudit.listingDetails}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="col-md-6 mb-4">
                        <h6 className="text-primary d-flex align-items-center gap-2 mb-3">
                          <span className="material-symbols-outlined">
                            event_upcoming
                          </span>
                          Future Plans (Next Year Roadmap)
                        </h6>
                        <div className="p-3 border rounded bg-white small">
                          {results.financialAudit.futurePlans}
                        </div>
                      </div>
                      <div className="col-12">
                        <div
                          className={`p-3 rounded border d-flex align-items-center gap-3 ${results.financialAudit.requirementMatch?.toLowerCase().includes("yes") || results.financialAudit.requirementMatch?.toLowerCase().includes("aligned") ? "bg-success-subtle border-success" : "bg-warning-subtle border-warning"}`}
                        >
                          <span className="material-symbols-outlined">
                            Target
                          </span>
                          <div>
                            <strong className="d-block">
                              Requirement Strategic Match Analysis
                            </strong>
                            <p className="mb-0 small">
                              {results.financialAudit.requirementMatch}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {/* Company Profile Section */}
              {results.companyProfile &&
                Object.keys(results.companyProfile).length > 0 && (
                  <div className={`${styles.resultCard} card shadow-sm mb-4`}>
                    <div className="card-header bg-success text-white">
                      <h5 className="mb-0">
                        <span className="material-symbols-outlined me-2">
                          business
                        </span>
                        Company Profile
                      </h5>
                    </div>
                    <div className="card-body">
                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <strong>Company Name:</strong>{" "}
                          {results.companyProfile.companyName || "N/A"}
                        </div>
                        <div className="col-md-6 mb-3">
                          <strong>Industry:</strong>{" "}
                          {results.companyProfile.industry || "N/A"}
                        </div>
                        <div className="col-md-6 mb-3">
                          <strong>Company Type:</strong>{" "}
                          {results.companyProfile.companyType || "N/A"}
                        </div>
                        <div className="col-md-6 mb-3">
                          <strong>Company Size:</strong>{" "}
                          {results.companyProfile.companySize || "N/A"}
                        </div>
                        <div className="col-md-6 mb-3">
                          <strong>Employee Count:</strong>{" "}
                          {results.companyProfile.employeeCount || "N/A"}
                        </div>
                        <div className="col-md-6 mb-3">
                          <strong>Headquarters:</strong>{" "}
                          {results.companyProfile.headquarters || "N/A"}
                        </div>
                        <div className="col-md-6 mb-3">
                          <strong>Founded:</strong>{" "}
                          {results.companyProfile.founded || "N/A"}
                        </div>
                        <div className="col-md-6 mb-3">
                          <strong>Revenue:</strong>{" "}
                          {results.companyProfile.revenue || "N/A"}
                        </div>
                        {results.companyProfile.valuation && (
                          <div className="col-md-6 mb-3">
                            <strong>Valuation:</strong>{" "}
                            {results.companyProfile.valuation}
                          </div>
                        )}
                        {results.companyProfile.linkedinCompanyId && (
                          <div className="col-md-6 mb-3">
                            <strong>LinkedIn Company ID:</strong>{" "}
                            {results.companyProfile.linkedinCompanyId}
                          </div>
                        )}

                        {results.companyProfile.linkedinCompanyUrl && (
                          <div className="col-12 mb-3">
                            <strong>LinkedIn Company Page:</strong>{" "}
                            <a
                              href={
                                results.companyProfile.linkedinCompanyUrl.startsWith(
                                  "http",
                                )
                                  ? results.companyProfile.linkedinCompanyUrl
                                  : `https://${results.companyProfile.linkedinCompanyUrl}`
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary"
                            >
                              {results.companyProfile.linkedinCompanyUrl}
                            </a>
                          </div>
                        )}
                        {results.companyProfile.description && (
                          <div className="col-12 mb-3">
                            <strong>Company Description:</strong>
                            <p className="mt-2">
                              {results.companyProfile.description}
                            </p>
                          </div>
                        )}
                        {results.companyProfile.specialties &&
                          results.companyProfile.specialties.length > 0 && (
                            <div className="col-12 mb-3">
                              <strong>Specialties:</strong>
                              <div className="mt-2">
                                {results.companyProfile.specialties.map(
                                  (specialty, idx) => (
                                    <span
                                      key={idx}
                                      className="badge bg-info me-2 mb-2"
                                    >
                                      {specialty}
                                    </span>
                                  ),
                                )}
                              </div>
                            </div>
                          )}
                        {results.companyProfile.technologies &&
                          results.companyProfile.technologies.length > 0 && (
                            <div className="col-12 mb-3">
                              <strong>Technologies:</strong>
                              <div className="mt-2">
                                {results.companyProfile.technologies.map(
                                  (tech, idx) => (
                                    <span
                                      key={idx}
                                      className="badge bg-warning text-dark me-2 mb-2"
                                    >
                                      {tech}
                                    </span>
                                  ),
                                )}
                              </div>
                            </div>
                          )}
                        {results.companyProfile.funding && (
                          <div className="col-12 mb-3">
                            <strong>Funding Information:</strong>
                            <div className="mt-2 p-3 bg-light rounded">
                              {results.companyProfile.funding.totalFunding && (
                                <p className="mb-1">
                                  <strong>Total Funding:</strong>{" "}
                                  {results.companyProfile.funding.totalFunding}
                                </p>
                              )}
                              {results.companyProfile.funding.latestRound && (
                                <p className="mb-1">
                                  <strong>Latest Round:</strong>{" "}
                                  {results.companyProfile.funding.latestRound}
                                </p>
                              )}
                              {results.companyProfile.funding.investors &&
                                results.companyProfile.funding.investors
                                  .length > 0 && (
                                  <p className="mb-0">
                                    <strong>Investors:</strong>{" "}
                                    {results.companyProfile.funding.investors.join(
                                      ", ",
                                    )}
                                  </p>
                                )}
                            </div>
                          </div>
                        )}
                        {results.companyProfile.competitors &&
                          results.companyProfile.competitors.length > 0 && (
                            <div className="col-12 mb-3">
                              <strong>Competitors:</strong>
                              <div className="mt-2">
                                {results.companyProfile.competitors.map(
                                  (competitor, idx) => (
                                    <span
                                      key={idx}
                                      className="badge bg-danger me-2 mb-2"
                                    >
                                      {competitor}
                                    </span>
                                  ),
                                )}
                              </div>
                            </div>
                          )}
                        {results.companyProfile.recentNews &&
                          results.companyProfile.recentNews.length > 0 && (
                            <div className="col-12 mb-3">
                              <strong>Recent News:</strong>
                              <div className="mt-2">
                                <ul className="list-unstyled">
                                  {results.companyProfile.recentNews.map(
                                    (news, idx) => (
                                      <li key={idx} className="mb-2">
                                        <span
                                          className="material-symbols-outlined me-2"
                                          style={{
                                            fontSize: "1rem",
                                            verticalAlign: "middle",
                                          }}
                                        >
                                          article
                                        </span>
                                        {news}
                                      </li>
                                    ),
                                  )}
                                </ul>
                              </div>
                            </div>
                          )}
                      </div>
                    </div>
                  </div>
                )}

              {/* Additional Info Section */}
              {results.additionalInfo &&
                Object.keys(results.additionalInfo).length > 0 && (
                  <div className={`${styles.resultCard} card shadow-sm`}>
                    <div className="card-header bg-info text-white">
                      <h5 className="mb-0">
                        <span className="material-symbols-outlined me-2">
                          info
                        </span>
                        Additional Information
                      </h5>
                    </div>
                    <div className="card-body">
                      {results.additionalInfo.verificationStatus && (
                        <p>
                          <strong>Verification Status:</strong>{" "}
                          {results.additionalInfo.verificationStatus}
                        </p>
                      )}
                      {results.additionalInfo.dataSource && (
                        <p>
                          <strong>Data Source:</strong>{" "}
                          {results.additionalInfo.dataSource}
                        </p>
                      )}
                      {results.additionalInfo.lastUpdated && (
                        <p>
                          <strong>Last Updated:</strong>{" "}
                          {results.additionalInfo.lastUpdated}
                        </p>
                      )}
                      {results.additionalInfo.notes && (
                        <p>
                          <strong>Notes:</strong> {results.additionalInfo.notes}
                        </p>
                      )}
                    </div>
                  </div>
                )}

              {/* User Profile Section (Moved to end per requirements) */}
              {results.userProfile &&
                Object.keys(results.userProfile).length > 0 && (
                  <div className={`${styles.resultCard} card shadow-sm mb-4`}>
                    <div className="card-header bg-primary text-white">
                      <h5 className="mb-0">
                        <span className="material-symbols-outlined me-2">
                          person
                        </span>
                        User Profile
                      </h5>
                    </div>
                    <div className="card-body">
                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <strong>Full Name:</strong>{" "}
                          {results.userProfile.fullName || "N/A"}
                        </div>
                        <div className="col-md-6 mb-3">
                          <strong>Current Role:</strong>{" "}
                          {results.userProfile.currentRole || "N/A"}
                        </div>
                        <div className="col-md-6 mb-3">
                          <strong>Location:</strong>{" "}
                          {results.userProfile.location || "N/A"}
                        </div>
                        <div className="col-md-6 mb-3">
                          <strong>Connections:</strong>{" "}
                          {results.userProfile.connections || "N/A"}
                        </div>
                        {results.userProfile.linkedinProfileId && (
                          <div className="col-md-6 mb-3">
                            <strong>LinkedIn Profile ID:</strong>{" "}
                            {results.userProfile.linkedinProfileId}
                          </div>
                        )}
                        {results.userProfile.linkedinProfileUrl && (
                          <div className="col-12 mb-3">
                            <strong>LinkedIn Profile:</strong>{" "}
                            <a
                              href={
                                results.userProfile.linkedinProfileUrl.startsWith(
                                  "http",
                                )
                                  ? results.userProfile.linkedinProfileUrl
                                  : `https://${results.userProfile.linkedinProfileUrl}`
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary"
                            >
                              {results.userProfile.linkedinProfileUrl}
                            </a>
                          </div>
                        )}
                        {results.userProfile.summary && (
                          <div className="col-12 mb-3">
                            <strong>Summary:</strong>
                            <p className="mt-2">
                              {results.userProfile.summary}
                            </p>
                          </div>
                        )}
                        {results.userProfile.skills &&
                          results.userProfile.skills.length > 0 && (
                            <div className="col-12 mb-3">
                              <strong>Skills:</strong>
                              <div className="mt-2">
                                {results.userProfile.skills.map(
                                  (skill, idx) => (
                                    <span
                                      key={idx}
                                      className="badge bg-secondary me-2 mb-2"
                                    >
                                      {skill}
                                    </span>
                                  ),
                                )}
                              </div>
                            </div>
                          )}
                        {results.userProfile.education &&
                          results.userProfile.education.length > 0 && (
                            <div className="col-12 mb-3">
                              <strong>Education:</strong>
                              <div className="mt-2">
                                {results.userProfile.education.map(
                                  (edu, idx) => (
                                    <div
                                      key={idx}
                                      className="mb-3 p-3 bg-light rounded"
                                    >
                                      <h6>{edu.institution || "N/A"}</h6>
                                      <p className="mb-1">
                                        <strong>Degree:</strong>{" "}
                                        {edu.degree || "N/A"}
                                      </p>
                                      {edu.field && (
                                        <p className="mb-1">
                                          <strong>Field:</strong> {edu.field}
                                        </p>
                                      )}
                                      {edu.duration && (
                                        <p className="mb-0">
                                          <strong>Duration:</strong>{" "}
                                          {edu.duration}
                                        </p>
                                      )}
                                    </div>
                                  ),
                                )}
                              </div>
                            </div>
                          )}
                        {results.userProfile.experience &&
                          results.userProfile.experience.length > 0 && (
                            <div className="col-12">
                              <strong>Experience:</strong>
                              <div className="mt-2">
                                {results.userProfile.experience.map(
                                  (exp, idx) => (
                                    <div
                                      key={idx}
                                      className="mb-3 p-3 bg-light rounded"
                                    >
                                      <h6>{exp.title || "N/A"}</h6>
                                      <p className="mb-1">
                                        <strong>Company:</strong>{" "}
                                        {exp.company || "N/A"}
                                      </p>
                                      <p className="mb-1">
                                        <strong>Duration:</strong>{" "}
                                        {exp.duration || "N/A"}
                                      </p>
                                      {exp.description && (
                                        <p className="mb-0">
                                          {exp.description}
                                        </p>
                                      )}
                                    </div>
                                  ),
                                )}
                              </div>
                            </div>
                          )}
                      </div>
                    </div>
                  </div>
                )}
              {/* AI Follow-up Chat Section */}
              <div className={styles.chatContainer}>
                <div className="d-flex align-items-center justify-content-between mb-4">
                  <div className="d-flex align-items-center gap-2">
                    <span className="material-symbols-outlined text-primary">
                      psychology
                    </span>
                    <h5 className="mb-0">Interactive AI Analyst</h5>
                  </div>
                  {chatHistory.length > 0 && (
                    <button
                      onClick={handleClearChat}
                      className={styles.clearBtn}
                      title="Clear History"
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: "1.2rem" }}
                      >
                        delete_sweep
                      </span>
                      Clear Chat
                    </button>
                  )}
                </div>

                <div className={styles.chatHistory}>
                  {chatHistory.length === 0 && (
                    <div className="text-center text-muted py-4">
                      <p className="small mb-0">
                        Ask deep questions about this lead or their company.
                      </p>
                      <p className="small">
                        The agent will research the live web for you.
                      </p>
                    </div>
                  )}
                  {chatHistory.map((msg, i) => (
                    <div
                      key={i}
                      className={`${styles.message} ${
                        msg.role === "user"
                          ? styles.userMessage
                          : styles.aiMessage
                      }`}
                    >
                      <div className={styles.messageHeader}>
                        <span
                          className="material-symbols-outlined"
                          style={{ fontSize: "1rem" }}
                        >
                          {msg.role === "user" ? "person" : "smart_toy"}
                        </span>
                        {msg.role === "user" ? "You" : "AI Agent"}
                      </div>
                      <div style={{ whiteSpace: "pre-wrap" }}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className={`${styles.message} ${styles.aiMessage}`}>
                      <div className={styles.messageHeader}>
                        <span
                          className="material-symbols-outlined"
                          style={{ fontSize: "1rem" }}
                        >
                          smart_toy
                        </span>
                        AI Agent
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <span
                          className="spinner-border spinner-border-sm"
                          role="status"
                        ></span>
                        Analysing...
                      </div>
                    </div>
                  )}
                  {chatSearching && (
                    <div className={styles.aiSearching}>
                      <span className="material-symbols-outlined pulse">
                        public
                      </span>
                      Scouring global intelligence for fresh data...
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                <form
                  onSubmit={handleChatSubmit}
                  className={styles.chatInputArea}
                >
                  <input
                    type="text"
                    className={styles.chatInput}
                    placeholder="Ask a question (e.g., 'What are their recent product launches?' or 'Find his email schema')"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    disabled={chatLoading}
                  />
                  <button
                    type="submit"
                    className={styles.sendBtn}
                    disabled={chatLoading || !chatInput.trim()}
                  >
                    <span className="material-symbols-outlined">send</span>
                  </button>
                </form>
              </div>
            </div>
          )}

          {!loading && !results && !error && (
            <div className="alert alert-info" role="alert">
              <span className="material-symbols-outlined me-2">info</span>
              Enter user details and click "Start Investigation" to get started.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
