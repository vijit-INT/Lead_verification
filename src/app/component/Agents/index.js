"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import axios from "axios";
import styles from "./Agents.module.css";
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
  });
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

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

  // POST Request (Search)
  // Client-side Logic Imports
  // (In a real project, import these at the top. For this refactor, we are replacing the body).

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      console.log("🚀 Starting Client-Side Search...");

      // 1. Parallel Multi-Angle Intelligence Gathering
      const [
        userLinkedIn,
        companyLinkedIn,
        companyWebsite,
        deepCompanyResults,
        deepPersonResults,
      ] = await Promise.all([
        findLinkedInProfile(formData.name, formData.companyName, formData.role),
        findCompanyLinkedIn(formData.companyName),
        findCompanyWebsite(formData.companyName),
        deepCompanySearch(formData.companyName),
        deepPersonSearch(formData.name, formData.companyName, formData.role),
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

      const enrichedData = await enrichProfile(searchData, formData);

      if (enrichedData) {
        setResults(enrichedData);
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
                  <label htmlFor="name">Lead Name *</label>
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
                  <label htmlFor="companyName">Company Name *</label>
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

          {results && (
            <div className={styles.resultsContainer}>
              {/* User Profile Section */}
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
