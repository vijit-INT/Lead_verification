"use client";

import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
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
          <div className={styles.statValue}>1,284</div>
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
          <div className={styles.statValue}>952</div>
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
          <div className={styles.statValue}>74%</div>
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
          {[
            {
              name: "John Smith",
              action: "Profile Enriched",
              company: "Google",
              time: "2 mins ago",
              initial: "JS",
            },
            {
              name: "Sarah Chen",
              action: "LinkedIn Found",
              company: "Stripe",
              time: "15 mins ago",
              initial: "SC",
            },
            {
              name: "Alex Johnson",
              action: "Company Data Deep Search",
              company: "Salesforce",
              time: "1 hour ago",
              initial: "AJ",
            },
            {
              name: "Maria Garcia",
              action: "Profile Enriched",
              company: "Microsoft",
              time: "3 hours ago",
              initial: "MG",
            },
          ].map((item, i) => (
            <div key={i} className={styles.activityItem}>
              <div className={styles.avatar}>{item.initial}</div>
              <div className={styles.activityContent}>
                <h6>
                  {item.name} <span className="text-muted fw-normal">at</span>{" "}
                  {item.company}
                </h6>
                <p>{item.action}</p>
                <div className={styles.activityTime}>{item.time}</div>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.activityCard}>
          <h5 className="mb-4">Quick Actions</h5>
          <div className="d-grid gap-3">
            <Link
              href="/agent"
              className="btn btn-primary d-flex align-items-center justify-content-center gap-2 py-3 rounded-4"
            >
              <span className="material-symbols-outlined">add_circle</span>
              New Verification
            </Link>
            <button className="btn btn-light d-flex align-items-center justify-content-center gap-2 py-3 rounded-4 border">
              <span className="material-symbols-outlined">download</span>
              Export Report
            </button>
            <button className="btn btn-light d-flex align-items-center justify-content-center gap-2 py-3 rounded-4 border">
              <span className="material-symbols-outlined">settings</span>
              API Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
