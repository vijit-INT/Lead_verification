"use client";
import React from "react";
import styles from "./Agents.module.css";

export default function LeadReport({ results, formData, reportRef }) {
  if (!results) return null;

  return (
    <div className="lead-report-content" id="report-content">
      {/* Lead Information Overview */}
      <div className={styles.leadOverview}>
        <div className={styles.overviewItem}>
          <span className={styles.overviewLabel}>Lead Name</span>
          <span className={styles.overviewValue}>{formData.name}</span>
        </div>
        <div className={styles.overviewItem}>
          <span className={styles.overviewLabel}>Company Name</span>
          <span className={styles.overviewValue}>
            {formData.companyName || formData.company}
          </span>
        </div>
        {formData.role && (
          <div className={styles.overviewItem}>
            <span className={styles.overviewLabel}>Industry/Role</span>
            <span className={styles.overviewValue}>{formData.role}</span>
          </div>
        )}
        {formData.email && (
          <div className={styles.overviewItem}>
            <span className={styles.overviewLabel}>Email Address</span>
            <span className={styles.overviewValue}>{formData.email}</span>
          </div>
        )}
        {formData.mobile && (
          <div className={styles.overviewItem}>
            <span className={styles.overviewLabel}>Mobile Number</span>
            <span className={styles.overviewValue}>{formData.mobile}</span>
          </div>
        )}
        {formData.companyUrl && (
          <div className={styles.overviewItem}>
            <span className={styles.overviewLabel}>Company URL</span>
            <span className={styles.overviewValue}>
              <a
                href={formData.companyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary"
              >
                {formData.companyUrl}
              </a>
            </span>
          </div>
        )}
        <div className={styles.overviewItem}>
          <span className={styles.overviewLabel}>Budget</span>
          <span className={styles.overviewValue}>
            {formData.budget || "400000"}
          </span>
        </div>
        <div className={styles.overviewItem}>
          <span className={styles.overviewLabel}>Requirement</span>
          <span className={styles.overviewValue}>
            {formData.requirement || "N/A"}
          </span>
        </div>
      </div>

      {/* Scoring Section */}
      {results.businessAnalysis && (
        <div className={`${styles.resultCard} card shadow-sm mb-4`}>
          <div className="card-header bg-dark text-white">
            <h5 className="mb-0 d-flex align-items-center">
              <span className="material-symbols-outlined me-2">speed</span>
              AI Lead Alignment Score
            </h5>
          </div>
          <div className="card-body">
            <div className={styles.scoreHeader}>
              <div className={styles.donutWrapper}>
                <div
                  className={styles.donutChart}
                  style={{
                    "--percentage":
                      (results.businessAnalysis.alignmentScore / 50) * 100,
                  }}
                >
                  <div className={styles.donutInternal}>
                    <span className={styles.donutScore}>
                      {results.businessAnalysis.alignmentScore}
                    </span>
                    <span className={styles.donutLabel}>out of 50</span>
                  </div>
                </div>
              </div>

              <div className={styles.scoringDetails}>
                <div className={styles.pointSection + " w-100"}>
                  <h6 className={styles.earnedTitle}>
                    <span className="material-symbols-outlined">
                      verified_user
                    </span>
                    {results.businessAnalysis.scoreAttributes
                      ? "Positive Alignment Factors"
                      : "Scoring Breakdown"}
                  </h6>
                  <div className={styles.pointList}>
                    {/* Handle New Structure: scoreAttributes with De-duplication safeguard */}
                    {Object.values(
                      results.businessAnalysis.scoreAttributes?.reduce(
                        (acc, item) => {
                          const cat = item.category?.toUpperCase();
                          if (!acc[cat]) {
                            acc[cat] = item;
                          } else {
                            // Consolidate factors if duplicate found
                            acc[cat].factor += ` | ${item.factor}`;
                            acc[cat].contribution =
                              `+${parseInt(acc[cat].contribution) + parseInt(item.contribution)}`;
                          }
                          return acc;
                        },
                        {},
                      ) || {},
                    ).map((item, idx) => {
                      const categoryWeights = {
                        "CORPORATE INTELLIGENCE": 20,
                        "INDIVIDUAL PROFILES": 10,
                        "INDIVIDUAL AUTHORITY": 15,
                        LOCATION: 5,
                      };
                      const maxPoints =
                        categoryWeights[item.category?.toUpperCase()] || 0;

                      return (
                        <div key={idx} className={styles.pointItem}>
                          <span>
                            <strong className="text-secondary opacity-75">
                              {item.category}{" "}
                              {maxPoints > 0 && `(Max ${maxPoints})`}:
                            </strong>{" "}
                            {item.factor}
                          </span>
                          <span
                            className={`${styles.pointValue} ${styles.earnedValue}`}
                          >
                            {item.contribution}
                          </span>
                        </div>
                      );
                    })}

                    {/* Handle Old Structure: scoringBreakdown.pointsEarned (Backwards Compatibility) */}
                    {!results.businessAnalysis.scoreAttributes &&
                      results.businessAnalysis.scoringBreakdown?.pointsEarned?.map(
                        (item, idx) => (
                          <div key={`old-${idx}`} className={styles.pointItem}>
                            <span>{item.point}</span>
                            <span
                              className={`${styles.pointValue} ${styles.earnedValue}`}
                            >
                              {item.value}
                            </span>
                          </div>
                        ),
                      )}

                    {/* Handle Old Structure: scoringBreakdown.pointsDeducted */}
                    {!results.businessAnalysis.scoreAttributes &&
                      results.businessAnalysis.scoringBreakdown?.pointsDeducted?.map(
                        (item, idx) => (
                          <div
                            key={`deduct-${idx}`}
                            className={styles.pointItem}
                          >
                            <span>{item.point}</span>
                            <span
                              className={`${styles.pointValue} ${styles.deductedValue}`}
                            >
                              {item.value}
                            </span>
                          </div>
                        ),
                      )}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 bg-light rounded border">
              <div className="d-flex align-items-center gap-3">
                <div
                  className={`badge ${results.businessAnalysis.alignmentScore > 35 ? "bg-success" : "bg-warning"} text-wrap`}
                >
                  {results.businessAnalysis.recommendation}
                </div>
                <p className="mb-0 small text-muted">
                  <strong>Executive Summary:</strong>{" "}
                  {results.businessAnalysis.requirementAnalysis}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Company's Core Requirement Section */}
      {results.companyCoreRequirement && (
        <div className={`${styles.resultCard} card shadow-sm mb-4`}>
          <div className="card-header bg-primary text-white">
            <h5 className="mb-0 d-flex align-items-center">
              <span className="material-symbols-outlined me-2">inventory</span>
              Company's Core Requirement
            </h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-12 mb-4">
                <h6 className="text-primary d-flex align-items-center gap-2 mb-3">
                  <span className="material-symbols-outlined">
                    shopping_bag
                  </span>
                  Core Business Products
                </h6>
                <div className="d-flex flex-wrap gap-2 mb-3">
                  {results.companyCoreRequirement.coreProducts?.map(
                    (product, idx) => (
                      <span
                        key={idx}
                        className="badge bg-light text-dark border"
                      >
                        {product}
                      </span>
                    ),
                  )}
                </div>
              </div>
              <div className="col-md-6 mb-4">
                <h6 className="text-primary d-flex align-items-center gap-2 mb-3">
                  <span className="material-symbols-outlined">stars</span>
                  Key Offerings & Model
                </h6>
                <div className="p-3 border rounded bg-white small">
                  {results.companyCoreRequirement.keyOfferings}
                </div>
              </div>
              <div className="col-md-6 mb-4">
                <h6 className="text-primary d-flex align-items-center gap-2 mb-3">
                  <span className="material-symbols-outlined">
                    present_to_all
                  </span>
                  Presentation Insights
                </h6>
                <div className="p-3 border rounded bg-white small">
                  {results.companyCoreRequirement.businessPresentation}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {results.businessAnalysis?.potentialRisks &&
        results.businessAnalysis.potentialRisks.length > 0 && (
          <div
            className={`${styles.resultCard} card shadow-sm mb-4 border-danger`}
          >
            <div className="card-header bg-danger text-white">
              <h5 className="mb-0 d-flex align-items-center">
                <span className="material-symbols-outlined me-2">warning</span>
                Potential Sales Risks & Red Flags
              </h5>
            </div>
            <div className="card-body bg-danger-subtle">
              <div className="row">
                <div className="col-12">
                  <ul className="mb-0">
                    {results.businessAnalysis.potentialRisks.map(
                      (risk, idx) => (
                        <li key={idx} className="mb-2 text-dark">
                          <strong>Risk Indicator:</strong> {risk}
                        </li>
                      ),
                    )}
                  </ul>
                  <div className="mt-2 small text-muted">
                    <span
                      className="material-symbols-outlined align-middle me-1"
                      style={{ fontSize: "1rem" }}
                    >
                      info
                    </span>
                    These risks are deduced from discrepancies between the
                    stated requirement and public company data.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      {/* Financial & Strategic Roadmap Section */}
      {results.financialAudit && (
        <div className={`${styles.resultCard} card shadow-sm mb-4`}>
          <div className="card-header bg-secondary text-white">
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0 d-flex align-items-center">
                <span className="material-symbols-outlined me-2">
                  account_balance
                </span>
                Financial & Strategic Roadmap
              </h5>
              <span className="badge bg-light text-dark">
                {results.financialAudit.companyStatus}
              </span>
            </div>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6 mb-4">
                <h6 className="text-primary d-flex align-items-center gap-2 mb-3">
                  <span className="material-symbols-outlined">query_stats</span>
                  Financial Summary & Status
                </h6>
                <div className="p-3 border rounded bg-white small">
                  {results.financialAudit.financialSummary}
                  {results.financialAudit.listingDetails && (
                    <div className="mt-2 pt-2 border-top font-monospace">
                      {results.financialAudit.listingDetails}
                    </div>
                  )}
                </div>
              </div>
              <div className="col-md-6 mb-4">
                <h6 className="text-primary d-flex align-items-center gap-2 mb-3">
                  <span className="material-symbols-outlined">
                    event_upcoming
                  </span>
                  Future Plans (Next Year Roadmap)
                </h6>
                <div className="p-3 border rounded bg-white small">
                  {results.financialAudit.futurePlans}
                </div>
              </div>
              <div className="col-12">
                <div
                  className={`p-3 rounded border d-flex align-items-center gap-3 ${results.financialAudit.requirementMatch?.toLowerCase().includes("yes") || results.financialAudit.requirementMatch?.toLowerCase().includes("aligned") ? "bg-success-subtle border-success" : "bg-warning-subtle border-warning"}`}
                >
                  <span className="material-symbols-outlined">Target</span>
                  <div>
                    <strong className="d-block">
                      Requirement Strategic Match Analysis
                    </strong>
                    <p className="mb-0 small">
                      {results.financialAudit.requirementMatch}
                    </p>
                  </div>
                </div>
              </div>
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
                <span className="material-symbols-outlined me-2">business</span>
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
                {results.companyProfile.description && (
                  <div className="col-12 mb-3">
                    <strong>Company Description:</strong>
                    <p className="mt-2">{results.companyProfile.description}</p>
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
          <div className={`${styles.resultCard} card shadow-sm mb-4`}>
            <div className="card-header bg-info text-white">
              <h5 className="mb-0">
                <span className="material-symbols-outlined me-2">info</span>
                Additional Information
              </h5>
            </div>
            <div className="card-body">
              {Object.entries(results.additionalInfo).map(([key, value]) => (
                <p key={key}>
                  <strong>
                    {key.charAt(0).toUpperCase() +
                      key.slice(1).replace(/([A-Z])/g, " $1")}
                    :
                  </strong>{" "}
                  {value}
                </p>
              ))}
            </div>
          </div>
        )}

      {/* User Profile Section */}
      {results.userProfile && Object.keys(results.userProfile).length > 0 && (
        <div className={`${styles.resultCard} card shadow-sm mb-4`}>
          <div className="card-header bg-primary text-white">
            <h5 className="mb-0">
              <span className="material-symbols-outlined me-2">person</span>
              User Profile
            </h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-12 mb-3">
                {results.userProfile.isFound === false ? (
                  <div className="alert alert-warning d-flex align-items-center gap-2 mb-3 fw-bold">
                    <span className="material-symbols-outlined">
                      person_off
                    </span>
                    <div>
                      <strong>USER NOT FOUND:</strong> We could not find a
                      verified profile for this name on LinkedIn or public web.
                    </div>
                  </div>
                ) : results.userProfile.isCompanyMatch === false ? (
                  <div className="alert alert-danger d-flex align-items-center gap-2 mb-3">
                    <span className="material-symbols-outlined">warning</span>
                    <div>
                      <span className="badge bg-danger mb-2">MISMATCH</span>
                      <br />
                      <strong>Company Mismatch:</strong>{" "}
                      {results.userProfile.claimedCompanyMatchAnalysis}
                    </div>
                  </div>
                ) : (
                  results.userProfile.claimedCompanyMatchAnalysis && (
                    <div className="alert alert-success d-flex align-items-center gap-2 mb-3">
                      <span className="material-symbols-outlined">
                        verified
                      </span>
                      <div>
                        <strong>Company Association Verified:</strong>{" "}
                        {results.userProfile.claimedCompanyMatchAnalysis}
                      </div>
                    </div>
                  )
                )}
              </div>
              <div className="col-md-6 mb-3">
                <strong>Full Name:</strong>{" "}
                {results.userProfile.fullName || "N/A"}
              </div>
              <div className="col-md-6 mb-3">
                <strong>Current Company:</strong>{" "}
                <span
                  className={
                    results.userProfile.isCompanyMatch === false ||
                    results.userProfile.isFound === false
                      ? "text-danger fw-bold"
                      : "text-success"
                  }
                >
                  {results.userProfile.currentCompany || "N/A"}
                </span>
              </div>
              <div className="col-md-12 mb-3">
                <strong>Current Role:</strong>{" "}
                {results.userProfile.currentRole || "N/A"}
              </div>
              {results.userProfile.summary && (
                <div className="col-12 mb-3">
                  <strong>Summary:</strong>
                  <p className="mt-2">{results.userProfile.summary}</p>
                </div>
              )}
              {results.userProfile.experience &&
                results.userProfile.experience.length > 0 && (
                  <div className="col-12">
                    <strong>Experience:</strong>
                    <div className="mt-2">
                      {results.userProfile.experience.map((exp, idx) => (
                        <div key={idx} className="mb-3 p-3 bg-light rounded">
                          <h6>{exp.title}</h6>
                          <p className="mb-0 small text-muted">
                            {exp.company} • {exp.duration}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
