import * as React from "react";
import { useMemo } from "react";

import { Chart } from "primereact/chart";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Card } from "primereact/card";
import { ProgressBar } from "primereact/progressbar";
import { Skeleton } from "primereact/skeleton";

import DateRangePicker from "../DatePicker/DatePicker";
import styles from "./WebsiteAnalytics.module.scss";

/* ══════════════════════════════════════════════════════════════════
   EXPORTED TYPES  (MainComponent imports these)
══════════════════════════════════════════════════════════════════ */
export interface IDateRange {
  startDate: Date;
  endDate: Date;
  label: string;
}

export interface IDailySummary {
  ID: number;
  Date: string;
  Users: number;
  Sessions: number;
  Bounce: number;
  Conversion: number;
  NewUsers: number;
}

export interface IMonthlyTrend {
  ID: number;
  Date: string;
  Sessions: number;
  Users: number;
}

export interface ITrafficSource {
  ID: number;
  Date: Date;
  TotalUser: number;
  Source: string;
}

export interface IPageDetails {
  ID: number;
  Date: Date | null;
  Page: string;
  Session: number;
  Bounce: number;
  AvgTime: number;
  totalUsers: number;
}

export interface ICountryDetails {
  ID: number;
  Date: Date | null;
  Country: string;
  CountryCode: string;
  TotalUser: number;
}

export interface IDeviceSessionMetrics {
  ID: number;
  Date: Date | null;
  Device: string;
  ReturningUsers: number;
  NewUsers: number;
  TotalUsers: number;
}

/* ── Exported helper so MainComponent can filter ────────────────── */
export function filterByDateRange<T extends { Date: string | Date | null }>(
  items: T[],
  startDate: Date,
  endDate: Date
): T[] {
  const from = new Date(
    startDate.getFullYear(),
    startDate.getMonth(),
    startDate.getDate()
  ).getTime();
  const to = new Date(
    endDate.getFullYear(),
    endDate.getMonth(),
    endDate.getDate()
  ).getTime();
  const [normalFrom, normalTo] = from <= to ? [from, to] : [to, from];

  return items.filter((item) => {
    if (!item.Date) return false;
    let itemTime: number;

    if (item.Date instanceof Date) {
      itemTime = new Date(
        item.Date.getFullYear(),
        item.Date.getMonth(),
        item.Date.getDate()
      ).getTime();
    } else {
      const datePart = (item.Date as string).split("T")[0];
      const [y, m, d] = datePart.split("-").map(Number);
      if (!y || !m || !d) return false;
      itemTime = new Date(y, m - 1, d).getTime();
    }

    return itemTime >= normalFrom && itemTime <= normalTo;
  });
}

/* ══════════════════════════════════════════════════════════════════
   PROPS
══════════════════════════════════════════════════════════════════ */
export interface IWebsiteAnalyticsProps {
  /* raw lists */
  dailySummaryData: IDailySummary[];
  monthlyTrendData: IMonthlyTrend[];
  /* pre-filtered lists */
  filteredDaily: IDailySummary[];
  filteredTrafficSources: ITrafficSource[];
  filteredPageDetails: IPageDetails[];
  filteredCountryDetails: ICountryDetails[];
  filteredDeviceMetrics: IDeviceSessionMetrics[];
  /* ui state */
  loading: boolean;
  dateRange: IDateRange;
  onDateRangeChange: (range: IDateRange) => void;
  onRefresh: () => void;
}

/* ══════════════════════════════════════════════════════════════════
   HELPERS (local, no fetch)
══════════════════════════════════════════════════════════════════ */
function fmtNum(n: number | undefined | null): string {
  if (n === undefined || n === null || isNaN(n)) return "0";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return n.toLocaleString("en-IN");
}

function formatDuration(seconds: number): string {
  return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
}

/* ── Chart options ───────────────────────────────────────────────── */
const doughnutOpts = (unit = "") => ({
  responsive: true,
  maintainAspectRatio: false,
  cutout: "45%",
  plugins: {
    legend: {
      position: "right" as const,
      labels: { usePointStyle: true, font: { size: 11 } },
    },
    tooltip: {
      callbacks: {
        label: (ctx: any) => {
          const value = Number(ctx.raw ?? 0);
          return ` ${ctx.label}: ${unit ? value + unit : fmtNum(value)}`;
        },
      },
    },
  },
});

const trendChartOpts = {
  responsive: true,
  maintainAspectRatio: false,
  spanGaps: true,
  elements: {
    line: { tension: 0.4 },
    point: { radius: 4, hoverRadius: 6 },
  },
  plugins: {
    legend: { position: "bottom" as const },
    tooltip: { mode: "index" as const, intersect: false },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: "#4d8ef8" },
    },
    y: {
      beginAtZero: true,
      ticks: { color: "#0891b2" },
      grid: { color: "#E5E7EB" },
    },
  },
};

const NoData = () => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "100%",
      minHeight: "120px",
      color: "#9CA3AF",
      gap: "8px",
    }}
  >
    <span style={{ fontSize: "28px" }}>📭</span>
    <span style={{ fontSize: "13px", fontWeight: 500 }}>No data found</span>
  </div>
);

/* ══════════════════════════════════════════════════════════════════
   COMPONENT
══════════════════════════════════════════════════════════════════ */
const WebsiteAnalytics: React.FC<IWebsiteAnalyticsProps> = ({
  dailySummaryData,
  monthlyTrendData,
  filteredDaily,
  filteredTrafficSources,
  filteredPageDetails,
  filteredCountryDetails,
  filteredDeviceMetrics,
  loading,
  dateRange,
  onDateRangeChange,
  onRefresh,
}) => {
  const { startDate, endDate } = dateRange;

  /* ── KPI derivations ──────────────────────────────────────────── */
  const totalUsers = useMemo(
    () => filteredDaily.reduce((s, i) => s + i.Users, 0),
    [filteredDaily]
  );

  const totalSessions = useMemo(
    () => filteredDaily.reduce((s, i) => s + i.Sessions, 0),
    [filteredDaily]
  );

  const bounceTotal = useMemo(() => {
    const total = filteredDaily.reduce(
      (sum, item) => sum + Number(item.Bounce || 0),
      0
    );
    return total.toFixed(2) + "%";
  }, [filteredDaily]);

  const convRate = useMemo(() => {
    if (!filteredDaily.length) return "—";
    const total = filteredDaily.reduce(
      (s, i) => s + Number(i.Conversion || 0),
      0
    );
    return total.toFixed(2) + "%";
  }, [filteredDaily]);

  /* ── Traffic source totals ────────────────────────────────────── */
  const sourceTotals = useMemo(() => {
    const totals = { Organic: 0, Direct: 0, Social: 0, Referral: 0, Paid: 0 };
    filteredTrafficSources.forEach(({ Source, TotalUser }) => {
      const src = Source?.toLowerCase() ?? "";
      if (src.includes("organic search")) totals.Organic += TotalUser;
      else if (src.includes("organic social")) totals.Social += TotalUser;
      else if (src.includes("direct")) totals.Direct += TotalUser;
      else if (src.includes("referral")) totals.Referral += TotalUser;
      else if (src.includes("paid")) totals.Paid += TotalUser;
    });
    return totals;
  }, [filteredTrafficSources]);

  /* ── Device stats ─────────────────────────────────────────────── */
  const deviceStats = useMemo(() => {
    const grouped = { Desktop: 0, Mobile: 0, Tablet: 0 };
    filteredDeviceMetrics.forEach(({ Device, TotalUsers }) => {
      grouped[Device as keyof typeof grouped] =
        (grouped[Device as keyof typeof grouped] || 0) + TotalUsers;
    });
    return grouped;
  }, [filteredDeviceMetrics]);

  const newVsReturning = useMemo(() => {
    if (!filteredDeviceMetrics.length) return "— / —";
    const totalNew = filteredDeviceMetrics.reduce((s, i) => s + i.NewUsers, 0);
    const totalReturning = filteredDeviceMetrics.reduce(
      (s, i) => s + i.ReturningUsers,
      0
    );
    const totalAllUsers = filteredDeviceMetrics.reduce(
      (s, i) => s + i.TotalUsers,
      0
    );
    const newPct = totalAllUsers
      ? Math.round((totalNew / totalAllUsers) * 100)
      : 0;
    const returningPct = totalAllUsers
      ? Math.round((totalReturning / totalAllUsers) * 100)
      : 0;
    return `${newPct}% / ${returningPct}%`;
  }, [filteredDeviceMetrics]);

  /* ── Country stats ────────────────────────────────────────────── */
  const countryStats = useMemo(() => {
    if (!filteredCountryDetails.length) return [];

    const grouped: Record<
      string,
      { name: string; code: string; totaluser: number }
    > = {};

    filteredCountryDetails.forEach(({ Country, CountryCode, TotalUser }) => {
      const key = Country?.trim() || "Unknown";
      if (!grouped[key]) {
        grouped[key] = { name: key, code: CountryCode || "XX", totaluser: 0 };
      }
      grouped[key].totaluser += Number(TotalUser) || 0;
    });

    const result = Object.keys(grouped).map((k) => grouped[k]);
    const total = result.reduce((s, r) => s + r.totaluser, 0);
    const max = Math.max(...result.map((r) => r.totaluser), 1);

    return result
      .map((r) => ({
        ...r,
        pct: total > 0 ? Math.round((r.totaluser / total) * 100) : 0,
        progress: Math.round((r.totaluser / max) * 100),
      }))
      .sort((a, b) => b.totaluser - a.totaluser);
  }, [filteredCountryDetails]);

  /* ── Top pages ────────────────────────────────────────────────── */
  const topPagesData = useMemo(() => {
    const map: Record<string, any> = {};

    filteredPageDetails.forEach((item) => {
      const key = item.Page || "Unknown";
      if (!map[key]) {
        map[key] = {
          page: key,
          sessions: 0,
          totalBounce: 0,
          totalTime: 0,
          totalUsers: 0,
          count: 0,
        };
      }
      map[key].sessions += item.Session || 0;
      map[key].totalBounce += item.Bounce || 0;
      map[key].totalTime += item.AvgTime || 0;
      map[key].count += 1;
      map[key].totalUsers += item.totalUsers || 0;
    });

    return Object.keys(map).map((k) => map[k])
      .map((item: any) => ({
        page: item.page,
        sessions: item.sessions,
        totalUsers: item.totalUsers,
        bounce: `${(item.totalBounce / item.count).toFixed(1)}%`,
        avgTime: formatDuration(item.totalTime / item.count),
      }))
      .sort((a: any, b: any) => b.sessions - a.sessions);
  }, [filteredPageDetails]);

  /* ── Trend chart (uses raw monthlyTrendData, not filtered) ───── */
  const trendChartData = useMemo(() => {
    const grouped: Record<
      string,
      { Sessions: number; Users: number }
    > = {};

    (monthlyTrendData || []).forEach((item) => {
      const d = new Date(item.Date);
      const month = d.getMonth() + 1;
      const key = `${d.getFullYear()}-${month < 10 ? "0" : ""}${month}`;
      if (!grouped[key]) grouped[key] = { Sessions: 0, Users: 0 };
      grouped[key].Sessions += item.Sessions;
      grouped[key].Users += item.Users;
    });

    const today = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const month = d.getMonth() + 1;
      const key = `${d.getFullYear()}-${month < 10 ? "0" : ""}${month}`;
      const label = d.toLocaleDateString("en-IN", {
        month: "short",
        year: "2-digit",
      });
      months.push({
        label,
        Sessions: grouped[key]?.Sessions || 0,
        Users: grouped[key]?.Users || 0,
      });
    }

    return {
      labels: months.map((m) => m.label),
      datasets: [
        {
          label: "Sessions",
          data: months.map((m) => m.Sessions),
          borderColor: "#4F46E5",
          backgroundColor: "rgba(79,70,229,0.15)",
          tension: 0.4,
          fill: true,
        },
        {
          label: "Users",
          data: months.map((m) => m.Users),
          borderColor: "#06B6D4",
          backgroundColor: "rgba(6,182,212,0.15)",
          tension: 0.4,
          fill: true,
        },
      ],
    };
  }, [monthlyTrendData]);

  /* ── Doughnut charts ──────────────────────────────────────────── */
  const sourceChartData = useMemo(
    () => ({
      labels: ["Organic Search", "Direct", "Social", "Referral", "Paid"],
      datasets: [
        {
          data: [
            sourceTotals.Organic,
            sourceTotals.Direct,
            sourceTotals.Social,
            sourceTotals.Referral,
            sourceTotals.Paid,
          ],
          backgroundColor: [
            "#1a6ef5",
            "#0891b2",
            "#7c3aed",
            "#d97706",
            "#e11d48",
          ],
          hoverOffset: 6,
          borderWidth: 2,
          borderColor: "#fff",
        },
      ],
    }),
    [sourceTotals]
  );

  const deviceChartData = useMemo(
    () => ({
      labels: ["Desktop", "Mobile", "Tablet"],
      datasets: [
        {
          data: [deviceStats.Desktop, deviceStats.Mobile, deviceStats.Tablet],
          backgroundColor: ["#1e3a5f", "#1a6ef5", "#0891b2"],
          borderWidth: 2,
          borderColor: "#fff",
        },
      ],
    }),
    [deviceStats]
  );

  /* ── Range label ──────────────────────────────────────────────── */
  const rangeLabel = useMemo(() => {
    if (!startDate || !endDate) return "All time";
    const fmt = (d: Date) =>
      d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    return `${fmt(startDate)} – ${fmt(endDate)}`;
  }, [dateRange]);

  /* ── KPI definitions ──────────────────────────────────────────── */
  const kpis = [
    {
      iconBg: "#e8f0fe",
      icon: "👤",
      label: "Total Users",
      value: filteredDaily.length === 0 ? "—" : fmtNum(totalUsers),
      sub: "Unique visitors",
      accent: "#1a6ef5",
    },
    {
      iconBg: "#e0f5fa",
      icon: "📊",
      label: "Sessions",
      value: filteredDaily.length === 0 ? "—" : fmtNum(totalSessions),
      sub: "Total sessions",
      accent: "#0891b2",
    },
    {
      iconBg: "#ffe4e6",
      icon: "↩",
      label: "Bounce Rate",
      value: String(bounceTotal),
      sub: "Lower is better",
      accent: "#e11d48",
    },
    {
      iconBg: "#d1fae5",
      icon: "🎯",
      label: "Conversion Rate",
      value: convRate,
      sub: "Goal completions",
      accent: "#059669",
    },
  ];

  /* ── Column templates ─────────────────────────────────────────── */
  const pageTemplate = (rowData: any) => <span>{rowData.page}</span>;
  const sessionsTemplate = (rowData: any) =>
    rowData.sessions.toLocaleString();
  const totalUserTemplate = (rowData: any) =>
    rowData.totalUsers.toLocaleString();
  const bounceTemplate = (rowData: any) => {
    const value = parseFloat(rowData.bounce || "0");
    const severity = value > 60 ? "high" : value > 40 ? "medium" : "low";
    return <span className={`badge ${severity}`}>{rowData.bounce}</span>;
  };

  /* ══════════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════════ */
  return (
    <div className={styles.root}>
      {/* ── Top Bar ─────────────────────────────────────────── */}
      <div className={styles.wrapper}>
        <div className={styles.topHeader}>
          <div className={styles.topLeft}>
            <div className={styles.mainTitle}>Website Analytics</div>
            <div className={styles.mainSub}>GA4 Connected · technorucs.com</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <DateRangePicker
              value={dateRange}
              onChange={(range: IDateRange) => onDateRangeChange(range)}
              maxDate={new Date()}
            />
            <button className={styles.connectBtn}>🔗 Connect Sources</button>
            <button
              className={styles.refreshBtn}
              onClick={onRefresh}
              disabled={loading}
            >
              {loading ? "⏳ Loading…" : "↻ Refresh"}
            </button>
          </div>
        </div>

        {/* Section Sub-Header */}
        <div className={styles.secHeader}>
          <div className={styles.secLeft}>
            <div className={styles.secIcon}>🌐</div>
            <div>
              <div className={styles.secTitle}>Website Analytics</div>
              <div className={styles.secSub}>
                Connected via Google Analytics 4 · {rangeLabel}
              </div>
            </div>
          </div>
          <div className={styles.secRight}>
            <span className={styles.sourceBadge}>🔗 GA4 Connected</span>
          </div>
        </div>
      </div>

      {/* ── Loading bar ──────────────────────────────────────── */}
      {loading && (
        <div className={styles.loadingBar}>
          <ProgressBar mode="indeterminate" style={{ height: "4px" }} />
        </div>
      )}

      {/* ── KPI Strip ────────────────────────────────────────── */}
      <div className={styles.g4}>
        {kpis.map((k, i) => (
          <div key={i} className={styles.kpiCard}>
            <div className={styles.kpiTop}>
              <div
                className={styles.kpiIconBox}
                style={{ background: k.iconBg }}
              >
                {k.icon}
              </div>
            </div>
            <div className={styles.kpiLabel}>{k.label}</div>
            {loading ? (
              <Skeleton height="28px" className={styles.kpiVal} />
            ) : (
              <div className={styles.kpiVal}>{k.value}</div>
            )}
            <div className={styles.kpiSub}>{k.sub}</div>
            <div
              className={styles.kpiAccent}
              style={{ background: k.accent }}
            />
          </div>
        ))}
      </div>

      {/* ── Sessions Trend + Traffic Sources ─────────────────── */}
      <div className={styles.gridTwo}>
        <Card
          header={
            <div className={styles.cardHdr}>
              <div className={styles.cardTitle}>Sessions &amp; Users Trend</div>
            </div>
          }
          className={styles.card}
        >
          <div style={{ height: "260px" }}>
            {loading ? (
              <Skeleton height="260px" />
            ) : monthlyTrendData.length === 0 ? (
              <NoData />
            ) : (
              <Chart
                type="line"
                data={trendChartData}
                options={trendChartOpts}
                style={{ height: "100%" }}
              />
            )}
          </div>
        </Card>

        <Card
          header={
            <div className={styles.cardHdr}>
              <div className={styles.cardTitle}>Traffic Sources</div>
              <div className={styles.cardSub}>{rangeLabel}</div>
            </div>
          }
          className={styles.card}
        >
          <div style={{ height: "200px" }}>
            {loading ? (
              <Skeleton height="200px" />
            ) : filteredTrafficSources.length === 0 ? (
              <NoData />
            ) : (
              <Chart
                type="doughnut"
                data={sourceChartData}
                options={doughnutOpts()}
                style={{ height: "100%" }}
              />
            )}
          </div>
        </Card>
      </div>

      {/* ── Top Pages · Country · Device ─────────────────────── */}
      <div className={styles.gW3}>
        <Card
          header={
            <div className={styles.cardHdr}>
              <div className={styles.cardTitle}>Top Pages</div>
              <div className={styles.cardSub}>By sessions · {rangeLabel}</div>
            </div>
          }
          className={styles.card}
        >
          {loading ? (
            <Skeleton height="200px" />
          ) : topPagesData.length === 0 ? (
            <NoData />
          ) : (
            <DataTable
              value={topPagesData}
              size="small"
              className="top-pages-table"
              stripedRows
              paginator={topPagesData.length > 0}
              rows={6}
            >
              <Column
                field="page"
                header="PAGE"
                style={{ width: "44%" }}
                body={pageTemplate}
              />
              <Column
                field="totalUsers"
                style={{ width: "14%" }}
                header="USERS"
                body={totalUserTemplate}
                headerClassName="left"
                bodyClassName="left"
              />
              <Column
                field="sessions"
                style={{ width: "14%" }}
                header="SESSIONS"
                body={sessionsTemplate}
                headerClassName="left"
                bodyClassName="left"
              />
              <Column
                field="bounce"
                style={{ width: "14%" }}
                header="BOUNCE"
                body={bounceTemplate}
                headerClassName="left"
                bodyClassName="left"
              />
              <Column
                field="avgTime"
                style={{ width: "14%" }}
                header="AVG TIME"
                headerClassName="left"
                bodyClassName="left"
              />
            </DataTable>
          )}
        </Card>

        <Card
          header={
            <div className={styles.cardHdr}>
              <div className={styles.cardTitle}>Visitors by Country</div>
              <div className={styles.cardSub}>Session share</div>
            </div>
          }
          className={styles.card}
        >
          <div className={styles.geoPadding}>
            {loading ? (
              <Skeleton height="200px" />
            ) : countryStats.length === 0 ? (
              <NoData />
            ) : (
              <DataTable
                value={countryStats}
                paginator={countryStats.length > 0}
                rows={5}
                showGridlines={false}
                className="custom-country-table"
              >
                <Column
                  body={(rowData) => (
                    <div className={styles.geoRow}>
                      <div className={styles.geoLeft}>
                        <span className={styles.geoCode}>{rowData.code}</span>
                        <span className={styles.geoName}>{rowData.name}</span>
                      </div>
                      <div className={styles.geoBarWrap}>
                        <div className={styles.geoBar}>
                          <div
                            className={styles.geoFill}
                            style={{ width: `${rowData.progress}%` }}
                          />
                        </div>
                      </div>
                      <div className={styles.geoRight}>
                        <span className={styles.geoSess}>
                          {fmtNum(rowData.totaluser)}
                        </span>
                        <span className={styles.geoPct}>{rowData.pct}%</span>
                      </div>
                    </div>
                  )}
                />
              </DataTable>
            )}
          </div>
        </Card>

        <Card
          header={
            <div className={styles.cardHdr}>
              <div className={styles.cardTitle}>
                Device &amp; Session Metrics
              </div>
            </div>
          }
          className={styles.card}
        >
          <div className={styles.chartWrapSm}>
            {loading ? (
              <Skeleton height="180px" />
            ) : filteredDeviceMetrics.length === 0 ? (
              <NoData />
            ) : (
              <Chart
                type="doughnut"
                data={deviceChartData}
                options={doughnutOpts()}
                style={{ height: "100%" }}
              />
            )}
          </div>
          <div className={styles.divider} />
          <div className={styles.miniSection}>
            <div className={styles.miniM}>
              <span className={styles.miniLabel}>New vs Returning</span>
              <span className={styles.miniVal}>{newVsReturning}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default WebsiteAnalytics;