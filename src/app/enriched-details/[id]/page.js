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
import LeadReport from "../../component/Agents/LeadReport";

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
            clonedEl.style.width = "800px"; // Standard width for clean A4 capture
            clonedEl.style.padding = "40px";
            clonedEl.style.margin = "0";
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
          const ratio = pdfWidth / imgWidth;

          const finalWidth = pdfWidth;
          const finalHeight = imgHeight * ratio;

          let heightLeft = finalHeight;
          let position = 0;

          // Add first page
          pdf.addImage(
            imgData,
            "JPEG",
            0,
            position,
            finalWidth,
            finalHeight,
            undefined,
            "FAST",
          );
          heightLeft -= pdfHeight;

          // Add extra pages if needed
          while (heightLeft > 0) {
            position = heightLeft - finalHeight;
            pdf.addPage();
            pdf.addImage(
              imgData,
              "JPEG",
              0,
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
  const formData = {
    name: data.fullname || data.name,
    companyName: data.companyName,
    role: data.role,
    email: data.email_address || data.email,
    requirement: data.requirement,
    budget: data.budget,
  };

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
            <div ref={reportRef}>
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

              <LeadReport results={results} formData={formData} />

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
