"use client";
import React, { useEffect, useState } from "react";
import styles from "./EmailList.module.scss";

export default function EmailList() {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  async function fetchEmails(silent = false) {
    if (!silent) setLoading(true);
    else setIsRefreshing(true);

    try {
      const response = await fetch("/api/inbox");
      const result = await response.json();
      if (result.success) {
        setEmails(result.data);
        setLastUpdated(new Date());
        setError(null); // Clear any previous errors if successful
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
              <span className="spinner-border spinner-border-sm me-2" style={{ width: '12px', height: '12px' }}></span>
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
                <span className={styles.time}>{new Date(email.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
