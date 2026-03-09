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
import LeadReport from "./LeadReport";

export default function Agents() {
  const [formData, setFormData] = useState({
    name: "",
    role: "",
    email: "",
    mobile: "",
    companyName: "",
    companyUrl: "",
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
  const [autoDownloadTrigger, setAutoDownloadTrigger] = useState(false);
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
    const mobile = searchParams.get("mobile");
    const companyUrl = searchParams.get("companyUrl");
    const budget = searchParams.get("budget");
    const requirement = searchParams.get("requirement");
    const autoStart = searchParams.get("autoStart");

    if (
      name ||
      company ||
      role ||
      email ||
      mobile ||
      companyUrl ||
      budget ||
      requirement
    ) {
      const newFormData = {
        name: name || "",
        companyName: company || "",
        role: role || "",
        email: email || "",
        mobile: mobile || "",
        companyUrl: companyUrl || "",
        budget: budget || "",
        requirement: requirement || "",
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
        setAutoDownloadTrigger(true); // Trigger auto download

        const payload = {
          fullname: data.name,
          companyName: data.companyName,
          role: data.role,
          email_address: data.email,
          mobile: data.mobile,
          company_url: data.companyUrl,
          requirement: data.requirement,
          budget: data.budget,
          responce_results: JSON.stringify(enrichedData),
          search_params: JSON.stringify({
            name: data.name,
            companyName: data.companyName,
            role: data.role,
            email: data.email,
            mobile: data.mobile,
            companyUrl: data.companyUrl,
            requirement: data.requirement,
            budget: data.budget,
          }),
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
        scale: 3, // Still high, but more memory-stable than 4
        useCORS: true,
        logging: false,
        allowTaint: true,
        backgroundColor: "#ffffff",
        imageSmoothingEnabled: false, // Prevents blurring
        windowWidth: 1200, // Forces a wide viewport for consistent rendering
        scrollY: -window.scrollY,
        onclone: (clonedDoc) => {
          const clonedEl = clonedDoc.querySelector(
            `.${styles.resultsContainer}`,
          );

          if (clonedEl) {
            // Force reset of ALL parent opacities to 1
            let parent = clonedEl.parentElement;
            while (parent) {
              parent.style.opacity = "1";
              parent.style.filter = "none";
              parent.style.backdropFilter = "none";
              parent = parent.parentElement;
            }

            clonedEl.style.animation = "none";
            clonedEl.style.opacity = "1";
            clonedEl.style.transform = "none";
            clonedEl.style.transition = "none";
            clonedEl.style.visibility = "visible";
            clonedEl.style.width = "1200px";
            clonedEl.style.padding = "40px";
            clonedEl.style.margin = "0 auto";
            clonedEl.style.background = "#ffffff";
          }

          // Kill ALL filters/shadows in the entire cloned document
          clonedDoc.querySelectorAll("*").forEach((node) => {
            const style = window.getComputedStyle(node);
            if (
              style.filter !== "none" ||
              style.backdropFilter !== "none" ||
              style.boxShadow !== "none" ||
              style.opacity !== "1"
            ) {
              node.style.filter = "none";
              node.style.backdropFilter = "none";
              node.style.opacity = "1";
              node.style.transition = "none";
              node.style.animation = "none";
            }
          });

          // Specific card reset
          clonedDoc
            .querySelectorAll(".card, [class*='Card'], [class*='leadOverview']")
            .forEach((card) => {
              card.style.boxShadow = "none";
              card.style.border = "1px solid #e2e8f0";
              card.style.backgroundColor = "#ffffff";
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

          const imgData = canvas.toDataURL("image/png", 1.0);
          const pdf = new jsPDF("p", "mm", "a4", true); // Compress PDF
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

  useEffect(() => {
    if (autoDownloadTrigger && results && reportRef.current) {
      // Small delay to ensure DOM is fully rendered before PDF capture
      setTimeout(() => {
        downloadPDF(false); // Auto-download report only (no chat)
        setAutoDownloadTrigger(false);
      }, 1000);
    }
  }, [autoDownloadTrigger, results]);

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
        <Link href="/enriched" className={styles.backButton}>
          <span className="material-symbols-outlined">dashboard</span>
          Enriched List
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
                  <label htmlFor="mobile">Mobile Number</label>
                  <input
                    type="text"
                    className={styles.customInput}
                    id="mobile"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleInputChange}
                    placeholder="e.g., +91 7905597148"
                  />
                </div>

                <div className={styles.inputField}>
                  <label htmlFor="companyUrl">Company Website URL</label>
                  <input
                    type="url"
                    className={styles.customInput}
                    id="companyUrl"
                    name="companyUrl"
                    value={formData.companyUrl}
                    onChange={handleInputChange}
                    placeholder="e.g., https://www.company.com"
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

              {/* Lead Information Overview and Detailed Report */}
              <LeadReport
                results={results}
                formData={formData}
                reportRef={reportRef}
              />

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
