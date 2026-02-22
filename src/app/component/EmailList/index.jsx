"use client";
import React, { useEffect, useState } from "react";
import styles from "./EmailList.module.scss";

export default function EmailList() {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchEmails() {
      try {
        const response = await fetch("/api/inbox");
        const result = await response.json();
        if (result.success) {
          setEmails(result.data);
        } else {
          setError(result.message);
        }
      } catch (err) {
        setError("Failed to fetch emails");
      } finally {
        setLoading(false);
      }
    }

    fetchEmails();
  }, []);

  if (loading) return <div className={styles.status}>Loading emails...</div>;
  if (error) return <div className={styles.status}>Error: {error}</div>;

  return (
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
  );
}
