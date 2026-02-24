"use client";

import { useState } from "react";
// import styles from "./gmail.module.css";
export default function NewGamilPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activePanel, setActivePanel] = useState("inbox");
  const [selectedEmail, setSelectedEmail] = useState(null);
  const styles = {
    appHeader: "app-header",
    logoText: "logo-text",
    searchBoxContainer: "search-box-container",
    searchBox: "search-box",
    sidebar: "sidebar",
  };
  const openEmail = (id) => {
    setSelectedEmail(id);
  };

  const backToList = () => {
    setSelectedEmail(null);
  };

  return (
    <div>
      {/* Header */}
      <header
        className={`${styles.appHeader} d-flex align-items-center p-2 fixed-top bg-white border-bottom`}
      >
        <div className="d-flex align-items-center">
          <button
            className="btn btn-icon d-lg-none"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          <span className={`${styles.logoText} ms-2 me-4`}>CloneMail</span>
        </div>

        <div className={`${styles.searchBoxContainer} me-auto`}>
          <div className={`input-group ${styles.searchBox} shadow-sm`}>
            <span className="input-group-text border-0 bg-transparent ps-3">
              <span className="material-symbols-outlined">search</span>
            </span>
            <input
              type="text"
              className="form-control border-0"
              placeholder="Search mail"
            />
          </div>
        </div>

        <div className="d-flex align-items-center ms-4">
          <button className="btn btn-icon d-none d-sm-block">
            <span className="material-symbols-outlined">help</span>
          </button>
          <button className="btn btn-icon d-none d-sm-block">
            <span className="material-symbols-outlined">settings</span>
          </button>
        </div>
      </header>

      {/* MAIN WRAPPER */}
      <div id="main-content-wrapper" className="d-flex">
        {/* Sidebar */}
        <nav
          className={`${styles.sidebar} ${
            sidebarOpen ? "show" : ""
          } flex-shrink-0 d-flex flex-column`}
        >
          <button className="btn compose-btn w-auto m-3 shadow-sm rounded-pill">
            <span className="material-symbols-outlined me-2">edit</span> Compose
          </button>

          {/* Sidebar Links */}
          <ul className="nav flex-column sidebar-nav">
            {[
              "inbox",
              "starred",
              "snoozed",
              "sent",
              "drafts",
              "allmail",
              "trash",
            ].map((item) => (
              <li key={item} className="nav-item">
                <button
                  className={`nav-link folder-link ${
                    activePanel === item ? "active" : ""
                  }`}
                  onClick={() => {
                    setActivePanel(item);
                    setSelectedEmail(null);
                    setSidebarOpen(false);
                  }}
                >
                  <span className="material-symbols-outlined me-3">
                    {item === "inbox"
                      ? "inbox"
                      : item === "starred"
                        ? "star"
                        : item === "snoozed"
                          ? "schedule"
                          : item === "sent"
                            ? "send"
                            : item === "drafts"
                              ? "draft"
                              : item === "allmail"
                                ? "all_inbox"
                                : "delete"}
                  </span>
                  {item.charAt(0).toUpperCase() + item.slice(1)}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Content Area */}
        <main className="content-area flex-grow-1">
          {/* Email List */}
          {!selectedEmail && (
            <div className="email-list-panel">
              <div className="email-list-rows">
                <div
                  className="email-row unread-row"
                  onClick={() => openEmail(1)}
                >
                  <div className="email-col-3">CEO Office</div>
                  <div className="email-col-4">Urgent: All-Hands Meeting…</div>
                  <div className="email-col-5">1:00 AM</div>
                </div>

                <div
                  className="email-row read-row"
                  onClick={() => openEmail(2)}
                >
                  <div className="email-col-3">Google Pay</div>
                  <div className="email-col-4">Your monthly summary…</div>
                  <div className="email-col-5">Yesterday</div>
                </div>
              </div>
            </div>
          )}

          {/* Email Detail */}
          {selectedEmail && (
            <div className="email-detail-panel p-4">
              <button className="btn btn-icon mb-3" onClick={backToList}>
                <span className="material-symbols-outlined">arrow_back</span>
              </button>

              <h2 className="mb-3">New Project Proposal</h2>

              <p>Hi team,</p>
              <p>Please find attached the updated project proposal.</p>
              <p>
                Thanks,
                <br />
                Jane
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
