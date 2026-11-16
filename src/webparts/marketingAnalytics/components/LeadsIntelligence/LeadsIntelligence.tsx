import * as React from "react";
import { useEffect, useState, useMemo } from "react";

import styles from "./LeadsIntelligence.module.scss";
import DateRangePicker, { DateRange } from "../DatePicker/DatePicker";
import { Chart } from "primereact/chart";

// ─── Exported interfaces (consumed by MainComponent) ─────────────────────────

export interface ILead {
  id: number;
  date: Date | null;
  leadName: string;
  phoneNumber: string;
  companyName: string;
  email: string;
  enquiry: string;
  source: string;
  campaign: string;
  country: string;
  notes: string;
  status: string;
}

// ─── Props interface ──────────────────────────────────────────────────────────

export interface ILeadsIntelligenceProps {
  leadData: ILead[];
  loading: boolean;
  onRefresh: () => void;
}

// ─── Internal constants ───────────────────────────────────────────────────────

function defaultRange(): DateRange {
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);

  const end = new Date();
  end.setHours(23, 59, 59, 999);

  return {
    startDate: start,
    endDate: end,
    label: "This Month",
  };
}

const SOURCE_META_LIST: Array<{
  key: string;
  icon: string;
  iconBg: string;
  meta: string;
  countColor: string;
}> = [
  {
    key: "Google Ads",
    icon: "🔍",
    iconBg: "#ffe4e6",
    meta: "Search campaigns",
    countColor: "#e11d48",
  },
  {
    key: "Organic",
    icon: "🌐",
    iconBg: "#e0f5fa",
    meta: "Contact form · SEO",
    countColor: "#0891b2",
  },
  {
    key: "Email",
    icon: "✉️",
    iconBg: "#d1fae5",
    meta: "Campaign emails",
    countColor: "#059669",
  },
  {
    key: "LinkedIn Ads",
    icon: "💼",
    iconBg: "#e8f0fe",
    meta: "Sponsored + InMail",
    countColor: "#1a6ef5",
  },
];

const PILL_MAP: Record<string, { source: string; status: string }> = {
  "Google Ads":   { source: styles.pillBlue,   status: "" },
  "LinkedIn Ads": { source: styles.pillViolet, status: "" },
  Email:          { source: styles.pillGreen,  status: "" },
  Organic:        { source: styles.pillTeal,   status: "" },
  Qualified:      { source: "",                status: styles.pillGreen },
  Junk:           { source: "",                status: styles.pillRose },
  Review:         { source: "",                status: styles.pillAmber },
};

// ─── Chart sub-components ─────────────────────────────────────────────────────

const LeadSourceChart: React.FC<{ data: Record<string, number> }> = ({ data }) => {
  const labels = ["Google Ads", "Website/SEO", "Email", "LinkedIn Ads"];

  const chartData = {
    labels,
    datasets: [
      {
        label: "Leads",
        backgroundColor: ["#e11d48", "#0891b2", "#059669", "#2563eb"],
        borderRadius: 8,
        barThickness: 36,
        data: [
          data["Google Ads"]    ?? 0,
          data["Organic"]       ?? 0,
          data["Email"]         ?? 0,
          data["LinkedIn Ads"]  ?? 0,
        ],
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: "#64748b", font: { size: 11 } },
      },
      y: {
        beginAtZero: true,
        ticks: { color: "#94a3b8", font: { size: 11 } },
        grid: { color: "#e5e7eb", drawBorder: false },
      },
    },
  };

  return (
    <div className={styles.chartWrapper}>
      <Chart type="bar" data={chartData} options={options} />
    </div>
  );
};

const LeadQualityChart: React.FC<{
  qualified: number;
  review: number;
  junk: number;
}> = ({ qualified, review, junk }) => {
  const chartData = {
    labels: ["Qualified", "In Review", "Junk"],
    datasets: [
      {
        data: [qualified, review, junk],
        backgroundColor: ["#059669", "#d97706", "#e11d48"],
        borderWidth: 0,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "65%",
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          color: "#64748b",
          boxWidth: 14,
          padding: 20,
          font: { size: 11 },
        },
      },
    },
  };

  return (
    <div className={styles.chartWrapper}>
      <Chart type="doughnut" data={chartData} options={options} />
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const LeadsIntelligenceDashboard: React.FC<ILeadsIntelligenceProps> = ({
  leadData,
  loading,
  onRefresh,
}) => {
  const [dateRange, setDateRange] = useState<DateRange>(defaultRange());
  const [localLoading, setLocalLoading] = useState(false);

  // Simulate brief loading on date change (UI feedback only)
  useEffect(() => {
    setLocalLoading(true);
    const t = setTimeout(() => setLocalLoading(false), 300);
    return () => clearTimeout(t);
  }, [dateRange]);

  const isLoading = loading || localLoading;

  // ── Grouped source counts (all data, not date-filtered) ───────────────────

  const groupedLeadData = [
    {
      source: "Paid Ads",
      count: leadData.filter((item) =>
        ["Meta Ads", "Google Ads", "LinkedIn"].indexOf(item.source) !== -1,
      ).length,
    },
    {
      source: "Website / Organic SEO",
      count: leadData.filter((item) =>
        ["Website", "Organic SEO"].indexOf(item.source) !== -1,
      ).length,
    },
    {
      source: "Email Campaigns",
      count: leadData.filter((item) =>
        ["Email Campaigns"].indexOf(item.source) !== -1,
      ).length,
    },
    {
      source: "LinkedIn Organic",
      count: leadData.filter((item) =>
        ["LinkedIn Organic"].indexOf(item.source) !== -1,
      ).length,
    },
  ];

  // ── Filtered by selected date range ──────────────────────────────────────

  const filtered = useMemo(() => {
    const start = new Date(dateRange.startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(dateRange.endDate);
    end.setHours(23, 59, 59, 999);

    return leadData.filter((l) => {
      if (!l.date) return false;
      return l.date >= start && l.date <= end;
    });
  }, [leadData, dateRange]);

  // ── KPIs ──────────────────────────────────────────────────────────────────

  const kpis = useMemo(() => {
    const total     = filtered.length;
    const qualified = filtered.filter((l) => l.status.toLowerCase() === "qualified").length;
    const junk      = filtered.filter((l) => l.status.toLowerCase() === "junk").length;
    const review    = filtered.filter((l) => l.status.toLowerCase() === "review").length;
    const qualRate  = total > 0 ? ((qualified / total) * 100).toFixed(1) : "0";
    const junkRate  = total > 0 ? ((junk      / total) * 100).toFixed(1) : "0";
    return { total, qualified, junk, review, qualRate, junkRate };
  }, [filtered]);

  // ── Per-source counts ─────────────────────────────────────────────────────

  const sourceCounts = useMemo(() => {
    const counts: Record<string, number> = {
      "Google Ads":   0,
      Organic:        0,
      Email:          0,
      "LinkedIn Ads": 0,
    };
    filtered.forEach((l) => {
      if (l.source in counts) counts[l.source] += 1;
    });
    return counts;
  }, [filtered]);

  // ── Static card config ────────────────────────────────────────────────────

  const KPI_CARDS = [
    {
      icon: "📥", iconBg: "#e8f0fe", accentColor: "#1a6ef5",
      deltaText: "▲ 21%", deltaType: "up" as const,
      label: "Total Leads",
      value: String(kpis.total),
      sub: "All sources this period",
    },
    {
      icon: "✅", iconBg: "#d1fae5", accentColor: "#059669",
      deltaText: "▲ 18%", deltaType: "up" as const,
      label: "Qualified Leads",
      value: String(kpis.qualified),
      sub: `${kpis.qualRate}% qualification rate`,
    },
    {
      icon: "🗑️", iconBg: "#ffe4e6", accentColor: "#e11d48",
      deltaText: "—", deltaType: "flat" as const,
      label: "Junk Leads",
      value: String(kpis.junk),
      sub: `${kpis.junkRate}% junk rate`,
    },
    {
      icon: "⏳", iconBg: "#fef3c7", accentColor: "#d97706",
      deltaText: "—", deltaType: "flat" as const,
      label: "In Review",
      value: String(kpis.review),
      sub: "Pending qualification",
    },
  ];

  const QUALITY_STATS = [
    { value: kpis.qualified, label: "Qualified", color: "#059669" },
    { value: kpis.junk,      label: "Junk",      color: "#e11d48" },
    { value: kpis.review,    label: "Review",    color: "#d97706" },
  ];

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className={styles.leadsDashboard}>
      {/* ── Section Header ── */}
      <div className={styles.secHeader}>
        <div className={styles.secTitleWrap}>
          <div>
            <div className={styles.secTitle}>Leads Intelligence</div>
            <div className={styles.secSub}>
              All lead sources · qualified vs junk · {dateRange.label}
            </div>
          </div>
        </div>
        <div className={styles.secActions}>
          <DateRangePicker value={dateRange} onChange={setDateRange} maxDate={new Date()} />
          <button className={styles.secondaryBtn}>Connect Sources</button>
          <button className={styles.primaryBtn} onClick={onRefresh}>
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* ── Section Sub-Header ── */}
      <div className={styles.secHeader}>
        <div className={styles.secTitleWrap}>
          <div className={styles.secIcon} style={{ background: "#ede9fe" }}>🎯</div>
          <div>
            <div className={styles.secTitle}>Leads Intelligence</div>
            <div className={styles.secSub}>
              All lead sources · qualified vs junk · {dateRange.label}
            </div>
          </div>
        </div>
        <span className={`${styles.sourceBadge} ${styles.badgeGreen}`}>
          📊 SharePoint Data
        </span>
      </div>

      {/* ── Loading bar ── */}
      {isLoading && (
        <div className={styles.loadingBar}>
          <div className={styles.loadingFill} />
        </div>
      )}

      {/* ── KPI Strip ── */}
      <div className={styles.g4}>
        {KPI_CARDS.map((kpi, i) => (
          <div className={styles.kpi} key={i}>
            <div className={styles.kpiTop}>
              <div className={styles.kpiIcon} style={{ background: kpi.iconBg }}>
                {kpi.icon}
              </div>
              <div
                className={`${styles.kpiDelta} ${
                  kpi.deltaType === "up" ? styles.deltaUp : styles.deltaFlat
                }`}
              >
                {kpi.deltaText}
              </div>
            </div>
            <div className={styles.kpiLabel}>{kpi.label}</div>
            <div className={styles.kpiVal}>{kpi.value}</div>
            <div className={styles.kpiSub}>{kpi.sub}</div>
            <div className={styles.kpiAccent} style={{ background: kpi.accentColor }} />
          </div>
        ))}
      </div>

      {/* ── Charts Row ── */}
      <div className={`${styles.g2} ${styles.mt}`}>
        <div className={styles.card}>
          <div className={styles.cardHead}>
            <div>
              <div className={styles.cardTitle}>Lead Volume by Source</div>
              <div className={styles.cardSub}>
                Where leads are coming from · {dateRange.label}
              </div>
            </div>
          </div>
          {filtered.length > 0 ? (
            <LeadSourceChart data={sourceCounts} />
          ) : (
            <div className={styles.emptyState}>📭 No leads found for selected range</div>
          )}
        </div>

        <div className={styles.card}>
          <div className={styles.cardHead}>
            <div>
              <div className={styles.cardTitle}>Lead Quality Breakdown</div>
              <div className={styles.cardSub}>
                Qualified vs Junk vs In Review · {dateRange.label}
              </div>
            </div>
          </div>
          {filtered.length > 0 ? (
            <>
              <LeadQualityChart
                qualified={kpis.qualified}
                review={kpis.review}
                junk={kpis.junk}
              />
              <div className={styles.statRow}>
                {QUALITY_STATS.map((s, i) => (
                  <div className={styles.statBox} key={i}>
                    <div className={styles.statVal} style={{ color: s.color }}>{s.value}</div>
                    <div className={styles.statLbl}>{s.label}</div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className={styles.emptyState}>📭 No leads found for selected range</div>
          )}
        </div>
      </div>

      {/* ── Detail Row ── */}
      <div className={`${styles.g2} ${styles.mt}`}>
        {/* Lead Source Breakdown */}
        <div className={styles.card}>
          <div className={styles.cardHead}>
            <div>
              <div className={styles.cardTitle}>Lead Source Breakdown</div>
              <div className={styles.cardSub}>
                Incoming by channel · {dateRange.label}
              </div>
            </div>
          </div>

          {groupedLeadData.map((item, index) => {
            const sourceMeta = SOURCE_META_LIST.find((s) => s.key === item.source);
            return (
              <div className={styles.leadStat} key={index}>
                <div
                  className={styles.leadIcon}
                  style={{ background: sourceMeta?.iconBg || "#eee" }}
                >
                  {sourceMeta?.icon || "📊"}
                </div>
                <div className={styles.leadInfo}>
                  <div className={styles.leadName}>{sourceMeta?.key || item.source}</div>
                  <div className={styles.leadMeta}>{sourceMeta?.meta || "Lead Source"}</div>
                </div>
                <div
                  className={styles.leadCount}
                  style={{ color: sourceMeta?.countColor || "#000" }}
                >
                  {item.count > 0 ? item.count : "—"}
                </div>
              </div>
            );
          })}
        </div>

        {/* Lead Detail Table */}
        <div className={styles.card}>
          <div className={styles.cardHead}>
            <div>
              <div className={styles.cardTitle}>Lead Detail Table</div>
              <div className={styles.cardSub}>
                {filtered.length} lead{filtered.length !== 1 ? "s" : ""} · {dateRange.label}
              </div>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className={styles.emptyState}>
              📭 No leads found for the selected date range.
            </div>
          ) : (
            <>
              <table className={styles.tbl}>
                <thead>
                  <tr>
                    <th>Lead Name</th>
                    <th>Source</th>
                    <th>Service Interest</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, 10).map((row, i) => (
                    <tr key={i}>
                      <td><strong>{row.leadName}</strong></td>
                      <td>
                        <span className={`${styles.pill} ${PILL_MAP[row.source]?.source ?? ""}`}>
                          {row.source}
                        </span>
                      </td>
                      <td>{row.enquiry}</td>
                      <td>
                        <span className={`${styles.pill} ${PILL_MAP[row.status]?.status ?? ""}`}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length > 10 && (
                <div className={styles.uploadNote}>
                  +{filtered.length - 10} more leads in this period
                </div>
              )}
            </>
          )}
          <div className={styles.uploadNote}>
            📤 Data sourced from SharePoint · Fields: Name · Source · Enquiry · Status
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadsIntelligenceDashboard;