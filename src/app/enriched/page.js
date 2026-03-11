"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import Link from "next/link";
import styles from "./enriched.module.css";

export default function EnrichedPage() {
  const [enrichedLeads, setEnrichedLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const leadsRes = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/getsearchparams`,
        );

        if (leadsRes.data.success) {
          const allLeads = leadsRes.data.data;
          // Enriched: has responce_results
          setEnrichedLeads(
            allLeads.filter((item) => item.responce_results !== null),
          );
        }
      } catch (error) {
        console.error("Error fetching enriched leads:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.welcome}>
          <h1>Profile Enriched List</h1>
          <p>Detailed intelligence extracted for your leads.</p>
        </div>
        <Link href="/" className={styles.navButton}>
          <span className="material-symbols-outlined">dashboard</span>
          Back to Agent
        </Link>
      </header>

      <section className={styles.content}>
        <div className={styles.activityCard}>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h5 className="mb-0">Verified Profiles</h5>
            <span className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill px-3 py-2">
              {enrichedLeads.length} Profiles Found
            </span>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status"></div>
              <p className="small text-muted mt-2">Loading profiles...</p>
            </div>
          ) : enrichedLeads.length === 0 ? (
            <div className="text-center py-5 border rounded bg-light">
              <span
                className="material-symbols-outlined text-muted mb-3"
                style={{ fontSize: "3rem" }}
              >
                person_search
              </span>
              <p className="text-muted">
                No enriched profiles found yet. Use the AI Agent to enrich your
                leads.
              </p>
              <Link href="/agent" className="btn btn-primary mt-2">
                Launch AI Agent
              </Link>
            </div>
          ) : (
            <div className={styles.listGrid}>
              {enrichedLeads.map((item, i) => {
                const initials = item.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase();

                return (
                  <div
                    key={item.search_id || i}
                    className={styles.activityItem}
                  >
                    <div
                      className={styles.avatar}
                      style={{ background: "#ecfdf5", color: "#059669" }}
                    >
                      {initials}
                    </div>
                    <div className={styles.activityContent}>
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <h6 className="text-capitalize mb-1">{item.name}</h6>
                          <p className="text-capitalize mb-1">
                            {item.companyName}
                          </p>
                        </div>
                        <Link
                          href={`/enriched-details/${item.search_id}`}
                          className="btn btn-sm btn-outline-primary rounded-pill px-3"
                          style={{ fontSize: "0.75rem", fontWeight: "600" }}
                        >
                          View Deep Intelligence
                        </Link>
                      </div>
                      <div className="d-flex align-items-center gap-3 mt-2">
                        <div className={styles.activityTime}>
                          <span
                            className="material-symbols-outlined align-middle me-1"
                            style={{ fontSize: "1rem" }}
                          >
                            badge
                          </span>
                          {item.role || "Lead"}
                        </div>
                        <div className={styles.activityTime}>
                          <span
                            className="material-symbols-outlined align-middle me-1"
                            style={{ fontSize: "1rem" }}
                          >
                            calendar_today
                          </span>
                          {new Date(item.created_at).toLocaleDateString()}
                        </div>
                        <span
                          className="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-2 py-1"
                          style={{ fontSize: "0.65rem" }}
                        >
                          AI Verified
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
