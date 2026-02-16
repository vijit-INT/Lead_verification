"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import styles from "./EnrichedDetails.module.css";
import { getSearchParamById } from "../../../services/leadService";
import { googleSearch } from "../../../lib/search";
import { askFollowUp } from "../../../lib/gemini";

export default function EnrichedDetails() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const reportRef = useRef(null);

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

  useEffect(() => {
    const fetchDetails = () => {
      setLoading(true);
      getSearchParamById(id)
        .then((res) => {
          if (res.success) {
            const fetchedData = res.data;
            // Parse response_results if it's a string
            if (typeof fetchedData.responce_results === "string") {
              fetchedData.enrichedData = JSON.parse(
                fetchedData.responce_results,
              );
            } else {
              fetchedData.enrichedData = fetchedData.responce_results;
            }
            setData(fetchedData);
          } else {
            setError(res.message || "Failed to fetch lead details");
          }
          setLoading(false);
        })
        .catch((err) => {
          console.error("Error fetching lead details:", err);
          setError(
            err?.response?.data?.message ||
              "An error occurred while fetching details",
          );
          setLoading(false);
        });
    };

    if (id) {
      fetchDetails();
    }
  }, [id]);

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
      setChatSearching(true);
      const searchContext = `${userQuestion} ${data.name} ${data.companyName}`;
      const newGlobalKnowledge = await googleSearch(searchContext);
      setChatSearching(false);

      const aiResponse = await askFollowUp(
        userQuestion,
        data.enrichedData,
        newGlobalKnowledge,
      );

      setChatHistory((prev) => [...prev, { role: "ai", content: aiResponse }]);
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
    const chatHistoryEl = element.querySelector(`.${styles.chatHistory}`);
    const chatInputArea = element.querySelector(`.${styles.chatInputArea}`);
    const clearBtn = element.querySelector(`.${styles.clearBtn}`);
    const chatContainer = element.querySelector(`.${styles.chatContainer}`);

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

          const fileName = `Enriched_Report_${data.name.replace(/\s+/g, "_") || "Lead"}.pdf`;
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

  if (loading) {
    return (
      <div className={styles.container}>
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="mt-3 text-muted">Loading enriched profile details...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={styles.container}>
        <div className="alert alert-danger" role="alert">
          <span className="material-symbols-outlined me-2 text-danger">
            error
          </span>
          {error || "Lead not found"}
        </div>
        <Link href="/enriched" className={styles.backButton}>
          <span className="material-symbols-outlined">arrow_back</span>
          Back to Enriched List
        </Link>
      </div>
    );
  }

  const results = data.enrichedData;

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <div className={styles.headerTitle}>
          <h1>
            <div className={styles.iconCircle}>
              <span className="material-symbols-outlined">verified_user</span>
            </div>
            Enriched Profile Details
          </h1>
          <p>Comprehensive data synthesis for {data.name}</p>
        </div>
        <Link href="/enriched" className={styles.backButton}>
          <span className="material-symbols-outlined">arrow_back</span>
          Back to Enriched List
        </Link>
      </div>

      <div className="row justify-content-center">
        <div className="col-lg-10">
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
              {results.companyProfile && (
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
                        <strong>Website:</strong>{" "}
                        {results.companyProfile.companyWebsite ? (
                          <a
                            href={results.companyProfile.companyWebsite}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary"
                          >
                            {results.companyProfile.companyWebsite}
                          </a>
                        ) : (
                          "N/A"
                        )}
                      </div>
                      <div className="col-md-6 mb-3">
                        <strong>Size:</strong>{" "}
                        {results.companyProfile.companySize || "N/A"}
                      </div>
                      <div className="col-md-6 mb-3">
                        <strong>Headquarters:</strong>{" "}
                        {results.companyProfile.headquarters || "N/A"}
                      </div>
                      <div className="col-md-6 mb-3">
                        <strong>Founded:</strong>{" "}
                        {results.companyProfile.founded || "N/A"}
                      </div>
                      {results.companyProfile.description && (
                        <div className="col-12 mb-3">
                          <strong>Description:</strong>
                          <p className="mt-2">
                            {results.companyProfile.description}
                          </p>
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
                      {results.companyProfile.recentNews &&
                        results.companyProfile.recentNews.length > 0 && (
                          <div className="col-12 mb-3">
                            <strong>Recent News:</strong>
                            <ul className="mt-2 small">
                              {results.companyProfile.recentNews.map(
                                (news, idx) => (
                                  <li key={idx} className="mb-2">
                                    {news}
                                  </li>
                                ),
                              )}
                            </ul>
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              )}

              {/* User Profile Section */}
              {results.userProfile && (
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
                        <strong>LinkedIn:</strong>{" "}
                        {results.userProfile.linkedinProfileUrl ? (
                          <a
                            href={results.userProfile.linkedinProfileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary"
                          >
                            {results.userProfile.linkedinProfileUrl}
                          </a>
                        ) : (
                          "N/A"
                        )}
                      </div>
                      {results.userProfile.summary && (
                        <div className="col-12 mb-3">
                          <strong>Summary:</strong>
                          <p className="mt-2 text-dark">
                            {results.userProfile.summary}
                          </p>
                        </div>
                      )}
                      {results.userProfile.skills &&
                        results.userProfile.skills.length > 0 && (
                          <div className="col-12 mb-3">
                            <strong>Skills:</strong>
                            <div className="mt-2">
                              {results.userProfile.skills.map((skill, idx) => (
                                <span
                                  key={idx}
                                  className="badge bg-secondary me-2 mb-2"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      {results.userProfile.experience &&
                        results.userProfile.experience.length > 0 && (
                          <div className="col-12 mb-3">
                            <strong>Experience:</strong>
                            <div className="mt-2">
                              {results.userProfile.experience.map(
                                (exp, idx) => (
                                  <div
                                    key={idx}
                                    className="mb-3 p-3 bg-light rounded"
                                  >
                                    <h6>
                                      {exp.title} at {exp.company}
                                    </h6>
                                    <p className="mb-1 text-muted small">
                                      {exp.duration}
                                    </p>
                                    <p className="mb-0 small">
                                      {exp.description}
                                    </p>
                                  </div>
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
                              {results.userProfile.education.map((edu, idx) => (
                                <div
                                  key={idx}
                                  className="mb-3 p-3 bg-light rounded"
                                >
                                  <h6>{edu.institution}</h6>
                                  <p className="mb-0 small">
                                    {edu.degree}{" "}
                                    {edu.field ? `in ${edu.field}` : ""}
                                  </p>
                                  {edu.duration && (
                                    <p className="mb-0 text-muted small">
                                      {edu.duration}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              )}

              {/* Additional Info Section */}
              {results.additionalInfo && (
                <div className={`${styles.resultCard} card shadow-sm mb-4`}>
                  <div className="card-header bg-info text-white">
                    <h5 className="mb-0">
                      <span className="material-symbols-outlined me-2">
                        info
                      </span>
                      Additional Intelligence
                    </h5>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <strong>Verification Status:</strong>{" "}
                        {results.additionalInfo.verificationStatus || "N/A"}
                      </div>
                      <div className="col-md-6 mb-3">
                        <strong>Last Updated:</strong>{" "}
                        {results.additionalInfo.lastUpdated
                          ? new Date(
                              results.additionalInfo.lastUpdated,
                            ).toLocaleDateString()
                          : "N/A"}
                      </div>
                      <div className="col-12 mb-3">
                        <strong>Data Sources:</strong>
                        <p className="mt-1 small text-muted">
                          {results.additionalInfo.dataSource}
                        </p>
                      </div>
                      {results.additionalInfo.notes && (
                        <div className="col-12">
                          <strong>Notes:</strong>
                          <p className="mt-1 small">
                            {results.additionalInfo.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Chat Section */}
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
                      className={`${styles.message} ${msg.role === "user" ? styles.userMessage : styles.aiMessage}`}
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
                      {chatSearching ? (
                        <div className={styles.aiSearching}>
                          <div
                            className="spinner-border spinner-border-sm text-primary"
                            role="status"
                          ></div>
                          <span>Researching the web for more details...</span>
                        </div>
                      ) : (
                        <div
                          className="spinner-grow spinner-grow-sm text-primary"
                          role="status"
                        ></div>
                      )}
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
                    placeholder="Ask anything about this lead..."
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
        </div>
      </div>
    </div>
  );
}
