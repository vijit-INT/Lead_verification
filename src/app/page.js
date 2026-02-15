"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  const [stats, setStats] = useState({
    totalLeads: 0,
    enrichedProfiles: 0,
    conversionRate: "0%",
  });
  const [enrichedLeads, setEnrichedLeads] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
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

          // Enriched: has responce_results
          setEnrichedLeads(
            allLeads.filter((item) => item.responce_results !== null),
          );

          // Recent Activities: leftover data (no responce_results)
          setRecentActivities(
            allLeads.filter((item) => item.responce_results === null),
          );
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Dummy data for the "chart"
  const chartData = [45, 78, 56, 92, 120, 85, 110];
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <div className={styles.welcome}>
          <h1>Lead Intel Dashboard</h1>
          <p>Welcome back! Here's what's happening with your leads.</p>
        </div>
        <Link href="/agent" className={styles.navButton}>
          <span className="material-symbols-outlined">smart_toy</span>
          Launch AI Agent
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
            <span className={`${styles.trend} bg-success-subtle text-success`}>
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
            <span className={`${styles.trend} bg-success-subtle text-success`}>
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
          <div className={styles.statValue}>3.2s</div>
          <div className={styles.statLabel}>Avg. Enrichment Time</div>
        </div>
      </section>

      <section className={styles.chartContainer}>
        <div className={styles.chartHeader}>
          <h5 className="mb-0">Leads Discovery Trend (Weekly)</h5>
          <div className="btn-group">
            <button className="btn btn-sm btn-outline-secondary active">
              7 Days
            </button>
            <button className="btn btn-sm btn-outline-secondary">
              30 Days
            </button>
          </div>
        </div>
        <div className={styles.chartBody}>
          {chartData.map((val, i) => (
            <div
              key={i}
              className={styles.bar}
              style={{ height: `${(val / 120) * 100}%` }}
              data-value={val}
            >
              <div
                style={{
                  position: "absolute",
                  bottom: "-25px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  fontSize: "0.7rem",
                  color: "#94a3b8",
                }}
              >
                {days[i]}
              </div>
            </div>
          ))}
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
                <div key={item.search_id || i} className={styles.activityItem}>
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
          <h5 className="mb-4">Profile Enriched List</h5>
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
                <div key={item.search_id || i} className={styles.activityItem}>
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
  );
}
