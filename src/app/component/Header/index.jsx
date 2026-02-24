"use client";
import { useState } from "react";
import EmailList from "../EmailList";
import styles from "./Header.module.css";

export default function Header() {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <header className="app-header d-flex align-items-center p-2 fixed-top bg-white border-bottom">
      <div className="d-flex align-items-center">
        <button className="btn btn-icon d-lg-none" id="sidebar-toggle">
          <span className="material-symbols-outlined">menu</span>
        </button>
        {/* <span className="logo-text ms-2 me-4">CloneMail</span> */}
      </div>

      <div className="flex-grow-1">
        {/* Global Sync Status Processor */}
        <EmailList headerOnly={true} />
      </div>

      <div className="d-flex align-items-center ms-4 position-relative">
        <button
          className="btn btn-icon d-none d-sm-block"
          onClick={() => setShowSettings(!showSettings)}
        >
          <span className="material-symbols-outlined">settings</span>
        </button>

        {showSettings && (
          <>
            <div
              className={styles.modalBackdrop}
              onClick={() => setShowSettings(false)}
            />
            <div className={styles.settingsModal}>
              <div className={styles.modalHeader}>
                <h5>Scoring Configuration</h5>
                <button
                  className={styles.closeBtn}
                  onClick={() => setShowSettings(false)}
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className={styles.settingsForm}>
                <div className={styles.formGroup}>
                  <label>1 - FINANCIAL CAPABILITY</label>
                  <div className={styles.inputWrapper}>
                    <input type="text" value="30" readOnly />
                    <div
                      className={styles.inputColor}
                      style={{ background: "#4f46e5" }}
                    ></div>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>2 - STRATEGIC ROADMAP ALIGNMENT</label>
                  <div className={styles.inputWrapper}>
                    <input type="text" value="30" readOnly />
                    <div
                      className={styles.inputColor}
                      style={{ background: "#7c3aed" }}
                    ></div>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>3 - INDUSTRY & REQUIREMENT FIT</label>
                  <div className={styles.inputWrapper}>
                    <input type="text" value="20" readOnly />
                    <div
                      className={styles.inputColor}
                      style={{ background: "#10b981" }}
                    ></div>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>4 - DATA VERIFIABILITY</label>
                  <div className={styles.inputWrapper}>
                    <input type="text" value="20" readOnly />
                    <div
                      className={styles.inputColor}
                      style={{ background: "#f59e0b" }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
