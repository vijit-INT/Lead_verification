"use client";

import { useState, useEffect, Suspense } from "react";
import axios from "axios";
import Link from "next/link";
import styles from "./page.module.css";
import Agents from "./component/Agents";

export default function Home() {
  const [stats, setStats] = useState({
    totalLeads: 0,
    enrichedProfiles: 0,
    conversionRate: "0%",
  });
  const [enrichedLeads, setEnrichedLeads] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  async function fetchData(silent = false) {
    if (!silent) setLoading(true);
    try {
      const [statsRes, leadsRes] = await Promise.all([
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/dashboard-stats`),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/getsearchparams`),
      ]);

      if (statsRes.data.success) {
        setStats(statsRes.data.data);
      }

      if (leadsRes.data.success) {
        const allLeads = leadsRes.data.data;
        setEnrichedLeads(
          allLeads.filter((item) => item.responce_results !== null),
        );
        setRecentActivities(
          allLeads.filter((item) => item.responce_results === null),
        );
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      // We don't set a global error state here to avoid breaking the dashboard on silent background updates
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();

    // Auto-update dashboard every 30 seconds
    const interval = setInterval(() => fetchData(true), 30000);

    return () => clearInterval(interval);
  }, []);

  // Dummy data for the "chart"
  const chartData = [45, 78, 56, 92, 120, 85, 110];
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <>
      <Suspense fallback={null}>
        <Agents />
      </Suspense>
      <div className={styles.dashboard} style={{ display: "none" }}>
        <header className={styles.header}>
          <div className={styles.welcome}>
            <h1>Lead Intel Dashboard</h1>
            <p>Welcome back! Here's what's happening with your leads.</p>
          </div>
          <Link href="/agent" className={styles.navButton}>
            <span className="material-symbols-outlined">smart_toy</span>
            Enrich Leads
          </Link>
        </header>

        <section className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statHeader}>
              <div className={`${styles.iconWrapper} bg-primary-subtle`}>
                <span className="material-symbols-outlined text-primary">
                  group
                </span>
              </div>
              <span
                className={`${styles.trend} bg-success-subtle text-success`}
              >
                +12.5%
              </span>
            </div>
            <div className={styles.statValue}>
              {loading ? "..." : stats.totalLeads.toLocaleString()}
            </div>
            <div className={styles.statLabel}>Total Leads Found</div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statHeader}>
              <div className={`${styles.iconWrapper} bg-success-subtle`}>
                <span className="material-symbols-outlined text-success">
                  verified
                </span>
              </div>
              <span
                className={`${styles.trend} bg-success-subtle text-success`}
              >
                +8.2%
              </span>
            </div>
            <div className={styles.statValue}>
              {loading ? "..." : stats.enrichedProfiles.toLocaleString()}
            </div>
            <div className={styles.statLabel}>Enriched Profiles</div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statHeader}>
              <div className={`${styles.iconWrapper} bg-warning-subtle`}>
                <span className="material-symbols-outlined text-warning">
                  monitoring
                </span>
              </div>
              <span className={`${styles.trend} text-muted`}>Stable</span>
            </div>
            <div className={styles.statValue}>
              {loading ? "..." : stats.conversionRate}
            </div>
            <div className={styles.statLabel}>Conversion Rate</div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statHeader}>
              <div className={`${styles.iconWrapper} bg-danger-subtle`}>
                <span className="material-symbols-outlined text-danger">
                  bolt
                </span>
              </div>
              <span className={`${styles.trend} bg-danger-subtle text-danger`}>
                -2.4%
              </span>
            </div>
            <div className={styles.statValue}>3.2 - 20.6s</div>
            <div className={styles.statLabel}>Avg. Enrichment Time</div>
          </div>
        </section>

        <div className={styles.bottomGrid}>
          <div className={styles.activityCard}>
            <h5 className="mb-4">Recent Lead Activities</h5>
            {loading ? (
              <div className="text-center py-4">
                <div
                  className="spinner-border spinner-border-sm text-primary"
                  role="status"
                ></div>
              </div>
            ) : recentActivities.length === 0 ? (
              <div className="text-center py-4 text-muted">
                No recent activities found.
              </div>
            ) : (
              recentActivities.map((item, i) => {
                const initials = item.name
                  ? item.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                  : "L";
                return (
                  <div
                    key={item.search_id || i}
                    className={styles.activityItem}
                  >
                    <div className={styles.avatar}>{initials}</div>
                    <div className={styles.activityContent}>
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <h6 className="mb-1 text-capitalize">
                            {item.name}{" "}
                            <span className="text-muted fw-normal">at</span>{" "}
                            {item.companyName}
                          </h6>
                          <p className="mb-1 text-capitalize">
                            {item.role || "Lead Discovery"}
                          </p>
                          <div className={styles.activityTime}>
                            {item.email || "No email provided"}
                          </div>
                        </div>
                        <Link
                          href={`/agent?name=${encodeURIComponent(item.name)}&company=${encodeURIComponent(item.companyName)}&role=${encodeURIComponent(item.role || "")}&email=${encodeURIComponent(item.email || "")}&autoStart=true`}
                          className="btn btn-sm btn-primary rounded-pill px-3"
                          style={{ fontSize: "0.7rem", fontWeight: "600" }}
                        >
                          Enrich
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className={styles.activityCard}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="mb-0">Profile Enriched List</h5>
              <Link
                href="/enriched"
                className="btn btn-sm text-primary p-0 d-flex align-items-center gap-1 fw-semibold"
              >
                View All{" "}
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: "1.2rem" }}
                >
                  chevron_right
                </span>
              </Link>
            </div>
            {loading ? (
              <div className="text-center py-4">
                <div
                  className="spinner-border spinner-border-sm text-primary"
                  role="status"
                ></div>
                <p className="small text-muted mt-2">Loading profiles...</p>
              </div>
            ) : enrichedLeads.length === 0 ? (
              <div className="text-center py-4">
                <p className="small text-muted">No enriched profiles found.</p>
              </div>
            ) : (
              enrichedLeads.map((item, i) => {
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
                          style={{ fontSize: "0.7rem", fontWeight: "500" }}
                        >
                          View Details
                        </Link>
                      </div>
                      <div className="d-flex align-items-center gap-2 mt-1">
                        <div className={styles.activityTime}>
                          {item.role || "Lead"}
                        </div>
                        <span
                          className="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-2"
                          style={{ fontSize: "0.65rem" }}
                        >
                          Verified
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </>
  );
}
