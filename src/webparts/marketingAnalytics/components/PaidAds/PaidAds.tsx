import * as React from "react";
import { useMemo } from "react";
import { Chart } from "primereact/chart";
import styles from "./PaidAds.module.scss";
import DateRangePicker from "../DatePicker/DatePicker";

// ─── Exported Types ───────────────────────────────────────────────────────────

export type Platform = "Google" | "LinkedIn" | "Facebook";
export type CtrType = "good" | "mid" | "low";
export type Status = "Active" | "Paused" | "Brand";
export type PillColor =
  | "blue"
  | "indigo"
  | "violet"
  | "green"
  | "teal"
  | "amber"
  | "gray";

export interface ICampaignRow {
  platform: Platform;
  campaignName: string;
  date: Date;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: string;
  ctrType: CtrType;
  leads: number | null;
  cpl: number | null;
  status: Status;
}

export interface IAggRow {
  platform: Platform;
  campaignName: string;
  spend: number;
  impressions: number;
  clicks: number;
  leads: number;
  cpl: number | null;
  ctr: string;
  ctrType: CtrType;
  status: Status;
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
  label: string;
}

export interface IGoogleAdsItem {
  Id: number;
  Date: string;
  CampaignName: string;
  Impressions: number;
  Clicks: number;
  Spend: number;
  CTR: number;
  Leads: number;
  CPL: number;
  ctrType: string;
  Status: string;
}

export interface IFacebookAdsItem {
  Id: number;
  CampaignName: string;
  Spend: number;
  Impressions: number;
  Clicks: number;
  CTR: number;
  Leads: number;
  CPL: number;
  Date: string;
  Status: string;
  Created?: string;
  Modified?: string;
}

// ─── Exported Props ───────────────────────────────────────────────────────────

export interface IPaidAdsPerformanceProps {
  /* combined + filtered rows (already merged Google + Facebook) */
  filtered: ICampaignRow[];
  /* available platforms derived from filtered */
  availablePlatforms: Platform[];
  /* aggregated table rows (filtered by selectedPlatform) */
  campaignTable: IAggRow[];
  /* ui state */
  loading: boolean;
  dateRange: DateRange;
  selectedPlatform: string;
  onDateRangeChange: (range: DateRange) => void;
  onPlatformChange: (platform: string) => void;
  onRefresh: () => void;
}

// ─── Exported helpers (used in MainComponent) ─────────────────────────────────

export function getCtrType(ctr: number): CtrType {
  if (ctr > 3) return "good";
  if (ctr > 1) return "mid";
  return "low";
}

export function getStatus(status: string): Status {
  const upper = status?.toUpperCase();
  if (upper === "PAUSED") return "Paused";
  if (upper === "ACTIVE") return "Active";
  return "Brand";
}

export function filterByRange(
  rows: ICampaignRow[],
  range: DateRange
): ICampaignRow[] {
  const from = new Date(
    range.startDate.getFullYear(),
    range.startDate.getMonth(),
    range.startDate.getDate()
  ).getTime();
  const to = new Date(
    range.endDate.getFullYear(),
    range.endDate.getMonth(),
    range.endDate.getDate()
  ).getTime();
  const [lo, hi] = from <= to ? [from, to] : [to, from];

  return rows.filter((c) => {
    const t = new Date(
      c.date.getFullYear(),
      c.date.getMonth(),
      c.date.getDate()
    ).getTime();
    return t >= lo && t <= hi;
  });
}

export function aggregateCampaigns(rows: ICampaignRow[]): IAggRow[] {
  const map = new Map<string, IAggRow>();

  rows.forEach((c) => {
    const normalizedCampaign = c.campaignName?.trim().toLowerCase();
    const key = `${c.platform}__${normalizedCampaign}`;

    const spend = Number(c.spend) || 0;
    const impressions = Number(c.impressions) || 0;
    const clicks = Number(c.clicks) || 0;
    const leads = Number(c.leads) || 0;

    if (!map.has(key)) {
      map.set(key, {
        platform: c.platform,
        campaignName: c.campaignName,
        spend,
        impressions,
        clicks,
        leads,
        cpl: null,
        status: c.status,
        ctr: "0.00%",
        ctrType: "low",
      });
    } else {
      const ex = map.get(key)!;
      ex.spend += spend;
      ex.impressions += impressions;
      ex.clicks += clicks;
      ex.leads += leads;
    }
  });

  map.forEach((row) => {
    const ctrVal =
      row.impressions > 0
        ? parseFloat(((row.clicks / row.impressions) * 100).toFixed(2))
        : 0;
    row.ctr = `${ctrVal.toFixed(2)}%`;
    row.ctrType = getCtrType(ctrVal);
  });

  return Array.from(map.values());
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PLATFORM_META: Record<
  Platform,
  { color: string; icon: string; pillColor: PillColor }
> = {
  Google: { color: "#e11d48", icon: "🔍", pillColor: "blue" },
  LinkedIn: { color: "#1a6ef5", icon: "💼", pillColor: "indigo" },
  Facebook: { color: "#7c3aed", icon: "📘", pillColor: "violet" },
};

// ─── Local helpers ────────────────────────────────────────────────────────────

function fmt(n: number): string {
  if (n >= 1_000_000)
    return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return n.toLocaleString("en-IN");
}

function sumKey(arr: ICampaignRow[], key: keyof ICampaignRow): number {
  return arr.reduce((acc, item) => {
    const val = item[key];
    if (val === null || val === undefined) return acc;
    const num = parseFloat(String(val));
    return acc + (isNaN(num) ? 0 : num);
  }, 0);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const Pill: React.FC<{ children: React.ReactNode; color: PillColor }> = ({
  children,
  color,
}) => (
  <span className={`${styles.pill} ${styles[`pill--${color}`]}`}>
    {children}
  </span>
);

interface KpiCardProps {
  icon: string;
  label: string;
  value: string;
  sub: string;
  delta: string | null;
  deltaUp: boolean;
  accentColor: string;
  iconBg: string;
}

const KpiCard: React.FC<KpiCardProps> = ({
  icon,
  label,
  value,
  sub,
  delta,
  deltaUp,
  accentColor,
  iconBg,
}) => (
  <div className={styles.kpiCard}>
    <div className={styles.kpiCard__top}>
      <div className={styles.kpiCard__icon} style={{ background: iconBg }}>
        {icon}
      </div>
      {delta === null ? (
        <span className={styles.kpiCard__menu}>—</span>
      ) : (
        <span
          className={`${styles.kpiCard__delta} ${
            deltaUp
              ? styles["kpiCard__delta--up"]
              : styles["kpiCard__delta--flat"]
          }`}
        >
          {delta}
        </span>
      )}
    </div>
    <div className={styles.kpiCard__label}>{label}</div>
    <div className={styles.kpiCard__value}>{value}</div>
    <div className={styles.kpiCard__sub}>{sub}</div>
    <div className={styles.kpiCard__bar} style={{ background: accentColor }} />
  </div>
);

// ══════════════════════════════════════════════════════════════════════════════
//  COMPONENT
// ══════════════════════════════════════════════════════════════════════════════

export const PaidAdsPerformance: React.FC<IPaidAdsPerformanceProps> = ({
  filtered,
  availablePlatforms,
  campaignTable,
  loading,
  dateRange,
  selectedPlatform,
  onDateRangeChange,
  onPlatformChange,
  onRefresh,
}) => {
  /* ── KPIs ───────────────────────────────────────────────────── */
  const kpis = useMemo(() => {
    const totalSpend = filtered.reduce((s, c) => s + c.spend, 0);
    const totalImpressions = filtered.reduce((s, c) => s + c.impressions, 0);
    const totalLeads = filtered.reduce((s, c) => s + (c.leads ?? 0), 0);
    const avgCpl = totalLeads > 0 ? Math.round(totalSpend / totalLeads) : 0;
    return { totalSpend, totalImpressions, totalLeads, avgCpl };
  }, [filtered]);

  /* ── Spend vs Leads chart ───────────────────────────────────── */
  const spendLeadsData = useMemo(() => {
    const platforms: Platform[] = ["Google", "Facebook"];
    const spendByPlatform = platforms.map((p) =>
      Number(
        sumKey(
          filtered.filter((x) => x.platform === p),
          "spend"
        ).toFixed(2)
      )
    );
    const leadsByPlatform = platforms.map((p) =>
      Number(
        sumKey(
          filtered.filter((x) => x.platform === p),
          "leads"
        ).toFixed(2)
      )
    );
    return {
      labels: ["Google Ads", "Facebook Ads"],
      datasets: [
        {
          label: "Ad Spend (₹)",
          backgroundColor: ["#e11d48", "#7c3aed"],
          data: spendByPlatform,
          yAxisID: "y",
        },
        {
          label: "Leads",
          backgroundColor: "#6ee7b7",
          data: leadsByPlatform,
          yAxisID: "y1",
        },
      ],
    };
  }, [filtered]);

  const spendLeadsOptions = {
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          usePointStyle: true,
          pointStyle: "rect",
          padding: 20,
          color: "#64748b",
          font: { size: 12, weight: 500 },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: "#64748b", font: { size: 12 } },
      },
      y: {
        position: "left",
        beginAtZero: true,
        grid: { color: "#e2e8f0" },
        ticks: {
          callback: (value: number) => `₹${value / 1000}K`,
          color: "#64748b",
        },
      },
      y1: {
        position: "right",
        beginAtZero: true,
        grid: { drawOnChartArea: false },
        ticks: { color: "#64748b" },
      },
    },
  };

  /* ── CPL trend chart ────────────────────────────────────────── */
  const cplTrendData = useMemo(() => {
    const grouped: Record<
      string,
      { date: Date; Google: number[]; Facebook: number[] }
    > = {};

    filtered.forEach((item) => {
      const d = new Date(item.date);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (!grouped[key]) {
        grouped[key] = {
          date: new Date(d.getFullYear(), d.getMonth(), 1),
          Google: [],
          Facebook: [],
        };
      }
      const cplVal = Number(item.cpl);
      if (!isNaN(cplVal) && cplVal > 0) {
        if (item.platform === "Google") grouped[key].Google.push(cplVal);
        else if (item.platform === "Facebook")
          grouped[key].Facebook.push(cplVal);
      }
    });

    const sortedKeys = Object.keys(grouped).sort(
      (a, b) => grouped[a].date.getTime() - grouped[b].date.getTime()
    );

    const labels = sortedKeys.map((k) =>
      grouped[k].date.toLocaleString("en-US", {
        month: "short",
        year: "2-digit",
      })
    );

    const sumArr = (arr: number[]): number =>
      Number(arr.reduce((t, v) => t + v, 0).toFixed(2));

    const googleData = sortedKeys.map((k) => sumArr(grouped[k].Google));
    const facebookData = sortedKeys.map((k) => sumArr(grouped[k].Facebook));

    if (labels.length === 1) {
      labels.push(labels[0]);
      googleData.push(googleData[0]);
      facebookData.push(facebookData[0]);
    }

    return {
      labels,
      datasets: [
        {
          label: "Google CPL (₹)",
          data: googleData,
          borderColor: "#e11d48",
          backgroundColor: "rgba(225,29,72,0.08)",
          fill: false,
          tension: 0.3,
          borderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7,
          spanGaps: true,
        },
        {
          label: "Facebook CPL (₹)",
          data: facebookData,
          borderColor: "#7c3aed",
          backgroundColor: "rgba(124,58,237,0.08)",
          fill: false,
          tension: 0.3,
          borderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7,
          spanGaps: true,
        },
      ],
    };
  }, [filtered]);

  const cplTrendOptions = {
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          usePointStyle: true,
          pointStyle: "circle",
          padding: 20,
          color: "#64748b",
          font: { size: 12, weight: 500 },
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const value = context.raw;
            if (value === null || value === undefined) return "No data";
            return `₹${value}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: "#64748b" },
      },
      y: {
        beginAtZero: true,
        grid: { color: "#e2e8f0" },
        ticks: {
          color: "#64748b",
          callback: (value: number) => `₹${value}`,
        },
      },
    },
  };

  /* ── Range label ────────────────────────────────────────────── */
  const rangeLabel = useMemo(() => {
    const { startDate, endDate } = dateRange;
    if (!startDate || !endDate) return "All time";
    const f = (d: Date) =>
      d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    return `${f(startDate)} – ${f(endDate)}`;
  }, [dateRange]);

  /* ── KPI card definitions ───────────────────────────────────── */
  const KPI_CARDS: KpiCardProps[] = [
    {
      icon: "💸",
      label: "Total Ad Spend",
      value: `₹${fmt(kpis.totalSpend)}`,
      sub: "All platforms combined",
      delta: null,
      deltaUp: false,
      accentColor: "#e11d48",
      iconBg: "#fff0f3",
    },
    {
      icon: "👁",
      label: "Total Impressions",
      value: fmt(kpis.totalImpressions),
      sub: "All campaigns",
      delta: "▲ 14%",
      deltaUp: true,
      accentColor: "#1a6ef5",
      iconBg: "#e8f0fe",
    },
    {
      icon: "🎯",
      label: "Leads from Ads",
      value: String(kpis.totalLeads),
      sub: "Google + LinkedIn + FB",
      delta: "▲ 18%",
      deltaUp: true,
      accentColor: "#059669",
      iconBg: "#d1fae5",
    },
    {
      icon: "📉",
      label: "Avg Cost Per Lead",
      value: kpis.avgCpl > 0 ? `₹${kpis.avgCpl}` : "—",
      sub: "Blended across platforms",
      delta: "▼ improving",
      deltaUp: true,
      accentColor: "#d97706",
      iconBg: "#fef3c7",
    },
  ];

  /* ── Render ─────────────────────────────────────────────────── */
  return (
    <div className={styles.paidAds}>
      {/* Top Bar */}
      <div className={styles.topBar}>
        <div className={styles.topBar__left}>
          <span className={styles.topBar__title}>Paid Ads Performance</span>
          <span className={styles.topBar__sep}>·</span>
          <span className={styles.topBar__subs}>
            Google · LinkedIn · Facebook · Excel data
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <DateRangePicker
            value={dateRange}
            onChange={(range: DateRange) => onDateRangeChange(range)}
            maxDate={new Date()}
          />
          <button
            className={styles.btnExcel}
            onClick={onRefresh}
            disabled={loading}
          >
            {loading ? "⏳ Loading…" : "🔄 Refresh"}
          </button>
        </div>
      </div>

      {/* Inner Header */}
      <div className={styles.innerHeader}>
        <div className={styles.innerHeader__left}>
          <div className={styles.innerHeader__icon}>💰</div>
          <div>
            <div className={styles.innerHeader__title}>
              Paid Ads Performance
            </div>
            <div className={styles.innerHeader__sub}>
              Google Ads · LinkedIn Ads · Facebook Ads · Data from Excel ·{" "}
              {rangeLabel}
            </div>
          </div>
        </div>
        <button className={styles.btnExcel}>📊 Excel Data</button>
      </div>

      {/* KPI Strip */}
      <section className={styles.kpiStrip}>
        {KPI_CARDS.map((c, i) => (
          <KpiCard key={i} {...c} />
        ))}
      </section>

      {/* Charts */}
      <section className={styles.chartsRow}>
        <div className={styles.chartCard}>
          <div className={styles.chartCard__title}>
            Spend vs Leads by Platform
          </div>
          <div className={styles.chartCard__sub}>{rangeLabel}</div>
          <div className={styles.chartCard__canvas}>
            {filtered.length > 0 ? (
              <Chart
                type="bar"
                data={spendLeadsData}
                options={spendLeadsOptions}
                style={{ height: "220px" }}
              />
            ) : (
              <div className={styles.chartCard__empty}>
                No data for selected range
              </div>
            )}
          </div>
        </div>

        <div className={styles.chartCard}>
          <div className={styles.chartCard__title}>CPL Trend — Monthly</div>
          <div className={styles.chartCard__sub}>
            Cost Per Lead improving over time
          </div>
          <div className={styles.chartCard__canvas}>
            {filtered.length > 0 ? (
              <Chart
                type="line"
                data={cplTrendData}
                options={cplTrendOptions}
                style={{ height: "220px" }}
              />
            ) : (
              <div className={styles.chartCard__empty}>
                No data for selected range
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Campaign Table */}
      <section className={styles.campaignTable}>
        <div className={styles.campaignTable__header}>
          <div>
            <div className={styles.campaignTable__title}>
              Campaign-Level Breakdown
            </div>
            <div className={styles.campaignTable__sub}>
              All active campaigns · {rangeLabel} · upload Excel to update
            </div>
          </div>

          <div className={styles.filterActions}>
            <select
              value={selectedPlatform}
              onChange={(e) => onPlatformChange(e.target.value)}
              className={styles.platformFilter}
            >
              <option value="All">All Platforms</option>
              {availablePlatforms.map((platform) => (
                <option key={platform} value={platform}>
                  {platform}
                </option>
              ))}
            </select>
            <button
              className={styles.resetBtn}
              onClick={() => onPlatformChange("All")}
            >
              Reset
            </button>
          </div>
        </div>

        {campaignTable.length === 0 ? (
          <div className={styles.campaignTable__empty}>
            📭 No campaigns found for the selected date range.
          </div>
        ) : (
          <div className={styles.campaignTable__scroll}>
            <table className={styles.tbl}>
              <thead>
                <tr>
                  {[
                    "Platform",
                    "Campaign Name",
                    "Spend (₹)",
                    "Impressions",
                    "Clicks",
                    "CTR",
                    "Leads",
                    "CPL (₹)",
                    "Status",
                  ].map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {campaignTable.map((r, i) => (
                  <tr key={i}>
                    <td>
                      <Pill color={PLATFORM_META[r.platform].pillColor}>
                        {r.platform}
                      </Pill>
                    </td>
                    <td className={styles["cell--name"]}>{r.campaignName}</td>
                    <td className={styles["cell--num"]}>₹{fmt(r.spend)}</td>
                    <td className={styles["cell--num"]}>
                      {fmt(r.impressions)}
                    </td>
                    <td className={styles["cell--num"]}>{fmt(r.clicks)}</td>
                    <td>
                      <Pill
                        color={
                          r.ctrType === "good"
                            ? "teal"
                            : r.ctrType === "mid"
                            ? "amber"
                            : "gray"
                        }
                      >
                        {r.ctr}
                      </Pill>
                    </td>
                    <td className={styles["cell--leads"]}>
                      {r.leads > 0 ? (
                        r.leads
                      ) : (
                        <span className={styles["cell--muted"]}>—</span>
                      )}
                    </td>
                    <td>
                      {r.cpl !== null ? (
                        <Pill
                          color={
                            r.cpl < 300
                              ? "green"
                              : r.cpl < 450
                              ? "amber"
                              : "gray"
                          }
                        >
                          ₹{r.cpl}
                        </Pill>
                      ) : (
                        <span className={styles["cell--muted"]}>—</span>
                      )}
                    </td>
                    <td>
                      <Pill
                        color={
                          r.status === "Active"
                            ? "green"
                            : r.status === "Paused"
                            ? "amber"
                            : "gray"
                        }
                      >
                        {r.status}
                      </Pill>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className={styles.uploadFooter}>
          <span>📎</span>
          <span>
            Upload ads Excel to add/update campaigns · Fields: Platform ·
            Campaign · Spend · Impressions · Clicks · Leads
          </span>
        </div>
      </section>
    </div>
  );
};

export default PaidAdsPerformance;