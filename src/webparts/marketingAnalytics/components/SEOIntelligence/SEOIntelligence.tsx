import * as React from "react";
import { useEffect, useState } from "react";
import styles from "./SEOIntelligence.module.scss";
import { Chart } from "primereact/chart";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";

// ─── Re-exported interfaces (consumed by MainComponent) ──────────────────────

export interface IKeyword {
  ID: number;
  Keyword: string;
  Clicks: number;
  Impressions: number;
  CTR: number;
  AvgPosition: number;
  Status: string;
  Date: string | null;
}

export interface ITopPage {
  ID: number;
  PageURL: string;
  Clicks: number;
  Impressions: number;
  CTR: number;
  AvgPosition: number;
  Date: string | null;
}

export interface IBacklinkSummary {
  ID: number;
  Metric: string;
  Value: string;
  Notes: string;
  Date: string | null;
}

// ─── Props interface ──────────────────────────────────────────────────────────

export interface ISEOIntelligenceProps {
  keywordData: IKeyword[];
  topPageData: ITopPage[];
  backlinkData: IBacklinkSummary[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

// ─── Internal interfaces ──────────────────────────────────────────────────────

interface YearMonth {
  year: number;
  month: number | null;
  label: string;
}

interface IBacklinkMetric {
  label: string;
  value: string;
  isDelta?: boolean;
  deltaUp?: boolean;
}

interface IKeywordRow {
  keyword: string;
  prevRank: string;
  currRank: string;
  change: number;
  volume: string;
  status: string;
}

interface IRankDist {
  top10: number;
  rank11_50: number;
  rank51_100: number;
  notRanked: number;
}

interface IRankDistMonth extends IRankDist {
  label: string;
}

interface IBacklinkTrendPoint {
  label: string;
  backlinks: number;
  domains: number;
}

interface IKwSummary {
  improved: number;
  declined: number;
  unchanged: number;
}

interface IAggregated {
  keywordsTop10: number;
  totalBacklinks: number;
  kwImproved: number;
  seoLeads: number;
  rankDist: IRankDist;
  rankDistMonths: IRankDistMonth[];
  backlinkTrend: IBacklinkTrendPoint[];
  backlinkMetrics: IBacklinkMetric[];
  kwSummary: IKwSummary;
  keywordRows: IKeywordRow[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function defaultYearMonth(): YearMonth {
  const now = new Date();
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    label: `${MONTHS[now.getMonth()]} ${now.getFullYear()}`,
  };
}

function filterByYearMonth<T extends { Date: string | null }>(
  items: T[],
  ym: YearMonth,
): T[] {
  return items.filter((item) => {
    if (!item.Date) return true;
    const d = new Date(item.Date);
    if (isNaN(d.getTime())) {
      console.warn("Invalid date:", item.Date);
      return true;
    }
    if (d.getFullYear() !== ym.year) return false;
    if (ym.month !== null && d.getMonth() + 1 !== ym.month) return false;
    return true;
  });
}

function getPreviousMonth(ym: YearMonth): YearMonth {
  let year = ym.year;
  let month = (ym.month || 1) - 1;
  if (month === 0) {
    month = 12;
    year -= 1;
  }
  return {
    year,
    month,
    label: `${MONTHS[month - 1]} ${year}`,
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const YearMonthPicker: React.FC<{
  value: YearMonth;
  onChange: (val: YearMonth) => void;
  minYear?: number;
}> = ({ value, onChange, minYear = 2020 }) => {
  const currentYear = new Date().getFullYear();
  const years = Array.from(
    { length: currentYear - minYear + 1 },
    (_, i) => currentYear - i,
  );

  const handleYear = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const year = Number(e.target.value);
    const label = value.month
      ? `${MONTHS[value.month - 1]} ${year}`
      : `Full Year ${year}`;
    onChange({ ...value, year, label });
  };

  const handleMonth = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const month = e.target.value === "0" ? null : Number(e.target.value);
    const label = month
      ? `${MONTHS[month - 1]} ${value.year}`
      : `Full Year ${value.year}`;
    onChange({ ...value, month, label });
  };

  const chevronSvg = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%2394a3b8' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`;

  const selectStyle: React.CSSProperties = {
    appearance: "none" as any,
    WebkitAppearance: "none" as any,
    border: "none",
    background: "transparent",
    fontSize: 13,
    fontWeight: 500,
    color: "#334155",
    cursor: "pointer",
    padding: "0 20px 0 2px",
    backgroundImage: chevronSvg,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 2px center",
    outline: "none",
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: 8,
        padding: "6px 10px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      }}
    >
      <span style={{ fontSize: 14 }}>📅</span>
      <select style={selectStyle} value={value.year} onChange={handleYear}>
        {years.map((y) => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>
      <span style={{ fontSize: 13, color: "#cbd5e1", userSelect: "none" }}>/</span>
      <select style={selectStyle} value={value.month ?? 0} onChange={handleMonth}>
        <option value={0}>All Months</option>
        {MONTHS.map((m, i) => (
          <option key={i + 1} value={i + 1}>{m}</option>
        ))}
      </select>
    </div>
  );
};

const KpiCard: React.FC<{
  icon: string;
  iconBg: string;
  accentColor: string;
  deltaText: string;
  deltaType: "up" | "dn" | "flat";
  label: string;
  value: string;
  sub: string;
}> = (p) => (
  <div className={styles.kpi}>
    <div className={styles.kpiTop}>
      <div className={styles.kpiIcon} style={{ background: p.iconBg }}>
        {p.icon}
      </div>
      <div
        className={`${styles.kpiDelta} ${
          p.deltaType === "up"
            ? styles.deltaUp
            : p.deltaType === "dn"
              ? styles.deltaDn
              : styles.deltaFlat
        }`}
      >
        {p.deltaText}
      </div>
    </div>
    <div className={styles.kpiLabel}>{p.label}</div>
    <div className={styles.kpiVal}>{p.value}</div>
    <div className={styles.kpiSub}>{p.sub}</div>
    <div className={styles.kpiAccent} style={{ background: p.accentColor }} />
  </div>
);

const RankDistChart: React.FC<{ data: IRankDistMonth[] }> = ({ data }) => {
  const chartData = {
    labels: data.map((d) => d.label),
    datasets: [
      { label: "Top 1-10",   data: data.map((d) => d.top10),      backgroundColor: "#059669" },
      { label: "11-50",      data: data.map((d) => d.rank11_50),  backgroundColor: "#0891b2" },
      { label: "51-100",     data: data.map((d) => d.rank51_100), backgroundColor: "#d97706" },
      { label: "Not Ranked", data: data.map((d) => d.notRanked),  backgroundColor: "#e11d48" },
    ],
  };
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: "bottom" as const } },
    scales: { x: { stacked: true }, y: { stacked: true } },
  };
  return (
    <div className={styles.chartWrapper}>
      {data.length === 0 ? (
        <div className={styles.emptyChart}>📭 No data</div>
      ) : (
        <Chart type="bar" data={chartData} options={options} />
      )}
    </div>
  );
};

const BacklinkGrowthChart: React.FC<{ data: IBacklinkTrendPoint[] }> = ({ data }) => {
  const chartData = {
    labels: data.map((d) => d.label),
    datasets: [
      {
        label: "Total Backlinks",
        data: data.map((d) => d.backlinks),
        borderColor: "#1a6ef5",
        backgroundColor: "rgba(26,110,245,0.1)",
        tension: 0.4,
        fill: true,
      },
      {
        label: "Referring Domains",
        data: data.map((d) => d.domains),
        borderColor: "#7c3aed",
        backgroundColor: "rgba(124,58,237,0.1)",
        tension: 0.4,
        fill: true,
      },
    ],
  };
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: "bottom" as const } },
  };
  return (
    <div className={styles.chartWrapper}>
      {data.length === 0 ? (
        <div className={styles.emptyChart}>📭 No data</div>
      ) : (
        <Chart type="line" data={chartData} options={options} />
      )}
    </div>
  );
};

// ─── Main Dashboard Component ─────────────────────────────────────────────────

const SeoIntelligenceDashboard: React.FC<ISEOIntelligenceProps> = ({
  keywordData,
  topPageData,
  backlinkData,
  loading,
  error,
  onRefresh,
}) => {
  const [yearMonth, setYearMonth] = useState<YearMonth>(defaultYearMonth());
  const [aggregated, setAggregated] = useState<IAggregated | null>(null);
  const [rangeLabel, setRangeLabel] = useState("");

  // ── Derive filtered slices from props ─────────────────────────────────────

  const prevYM = getPreviousMonth(yearMonth);

  const currentKeywords  = filterByYearMonth(keywordData, yearMonth);
  const previousKeywords = filterByYearMonth(keywordData, prevYM);

  const prevMap = new Map<string, number>();
  previousKeywords.forEach((k) => prevMap.set(k.Keyword, k.AvgPosition));

  // ── Aggregation ───────────────────────────────────────────────────────────

  function aggregateFromSPData(
    keywords: IKeyword[],
    backlinks: IBacklinkSummary[],
    _topPages: ITopPage[],
  ): IAggregated | null {
    if (!keywords.length && !backlinks.length) return null;

    const keywordsTop10 = keywords.filter((k) => k.AvgPosition <= 10).length;

    const totalBacklinksObj = backlinks.find(
      (k) => k.Metric?.trim() === "Total Backlinks",
    );
    const totalBacklinks = totalBacklinksObj
      ? Number((totalBacklinksObj.Value || "0").replace(/,/g, ""))
      : 0;

    const kwImprovedObj = backlinks.find(
      (k) => k.Metric?.trim() === "KW Rank Improved",
    );
    const kwImproved = kwImprovedObj
      ? Number((kwImprovedObj.Value || "0").replace(/,/g, ""))
      : 0;

    const kwDeclinedObj = backlinks.find(
      (k) => k.Metric?.trim() === "KW Rank Declined",
    );
    const kwDeclined = kwDeclinedObj
      ? Number((kwDeclinedObj.Value || "0").replace(/,/g, ""))
      : 0;

    const seoLeads = keywords.reduce((sum, k) => sum + k.Clicks, 0);

    const rankDist: IRankDist = {
      top10:      keywords.filter((k) => k.AvgPosition <= 10).length,
      rank11_50:  keywords.filter((k) => k.AvgPosition > 10  && k.AvgPosition <= 50).length,
      rank51_100: keywords.filter((k) => k.AvgPosition > 50  && k.AvgPosition <= 100).length,
      notRanked:  keywords.filter((k) => k.AvgPosition > 100).length,
    };

    const keywordRows: IKeywordRow[] = currentKeywords.map((k) => {
      const prev    = prevMap.get(k.Keyword);
      const prevRank = prev ? `#${Math.round(prev)}` : "—";
      const currRank = `#${Math.round(k.AvgPosition)}`;
      const change   = prev ? Math.round(prev - k.AvgPosition) : 0;
      return {
        keyword: k.Keyword,
        prevRank,
        currRank,
        change,
        volume: k.Impressions.toLocaleString(),
        status: change > 0 ? "Improved" : change < 0 ? "Declined" : "Unchanged",
      };
    });

    const backlinkMetrics: IBacklinkMetric[] = backlinks.map((b) => ({
      label:    b.Metric,
      value:    String(b.Value),
      isDelta:  false,
      deltaUp:  false,
    }));

    const rankDistMonths: IRankDistMonth[] = [{ label: "Current", ...rankDist }];

    const backlinkTrend: IBacklinkTrendPoint[] = [
      { label: "Current", backlinks: totalBacklinks, domains: 0 },
    ];

    const kwSummary: IKwSummary = {
      improved:  kwImproved,
      declined:  kwDeclined,
      unchanged: Math.max(0, keywords.length - kwImproved - kwDeclined),
    };

    return {
      keywordsTop10,
      totalBacklinks,
      kwImproved,
      seoLeads,
      rankDist,
      rankDistMonths,
      backlinkTrend,
      backlinkMetrics,
      kwSummary,
      keywordRows,
    };
  }

  // ── Re-aggregate whenever yearMonth or incoming data changes ─────────────

  useEffect(() => {
    const timer = setTimeout(() => {
      const filteredKeywords  = filterByYearMonth(keywordData, yearMonth);
      const filteredBacklinks = filterByYearMonth(backlinkData, yearMonth);
      const filteredTopPages  = filterByYearMonth(topPageData,  yearMonth);

      const agg = aggregateFromSPData(filteredKeywords, filteredBacklinks, filteredTopPages);
      setAggregated(agg);
      setRangeLabel(yearMonth.label);
    }, 250);
    return () => clearTimeout(timer);
  }, [yearMonth, keywordData, backlinkData, topPageData]);

  const noData = !aggregated;

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className={styles.seoDashboard}>
      {/* ── TOP HEADER ── */}
      <div className={styles.topHeader}>
        <div>
          <div className={styles.topTitle}>SEO Intelligence</div>
          <div className={styles.topSub}>GSC + Excel · Keyword &amp; backlink data</div>
        </div>
        <div className={styles.topRight}>
          <div className={styles.secActions}>
            <YearMonthPicker value={yearMonth} onChange={setYearMonth} minYear={2020} />
            <span className={`${styles.sourceBadge} ${styles.badgeBlue}`}>
              🔗 GSC Connected
            </span>
            <button className={styles.topBtnPrimary} onClick={onRefresh}>
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* ── SECTION HEADER ── */}
      <div className={styles.secHeader}>
        <div className={styles.secTitleWrap}>
          <div className={styles.secIcon} style={{ background: "#fef3c7" }}>🔍</div>
          <div>
            <div className={styles.secTitle}>SEO Performance</div>
            <div className={styles.secSub}>Google Search Console · {rangeLabel}</div>
          </div>
        </div>
        <span className={`${styles.sourceBadge} ${styles.badgeGreen}`}>📊 Excel</span>
      </div>

      {error && <div>⚠️ {error}</div>}

      {loading && (
        <div className={styles.loadingBar}>
          <div className={styles.loadingFill} />
        </div>
      )}

      {/* ── KPI Cards ── */}
      <div className={styles.g4}>
        <KpiCard
          icon="📈" iconBg="#d1fae5" accentColor="#059669"
          deltaText={noData ? "—" : `▲ ${aggregated!.keywordsTop10} keywords`}
          deltaType={noData ? "flat" : "up"}
          label="Keywords Top-10"
          value={noData ? "—" : String(aggregated!.keywordsTop10)}
          sub="Ranking page 1"
        />
        <KpiCard
          icon="🔗" iconBg="#e8f0fe" accentColor="#1a6ef5"
          deltaText={noData ? "—" : `▲ Latest ${aggregated!.totalBacklinks.toLocaleString()}`}
          deltaType={noData ? "flat" : "up"}
          label="Total Backlinks"
          value={noData ? "—" : aggregated!.totalBacklinks.toLocaleString()}
          sub="Acquired in range"
        />
        <KpiCard
          icon="⬆️" iconBg="#fef3c7" accentColor="#d97706"
          deltaText={noData ? "—" : `▲ ${aggregated!.kwImproved} improved`}
          deltaType={noData ? "flat" : "up"}
          label="Kw Rank Improved"
          value={noData ? "—" : String(aggregated!.kwImproved)}
          sub="vs previous period"
        />
        <KpiCard
          icon="🎯" iconBg="#e0f5fa" accentColor="#0891b2"
          deltaText={noData ? "—" : `▲ ${aggregated!.seoLeads} leads`}
          deltaType={noData ? "flat" : "up"}
          label="SEO Leads"
          value={noData ? "—" : aggregated!.seoLeads.toLocaleString()}
          sub="Organic conversions"
        />
      </div>

      {/* ── Charts Row ── */}
      <div className={`${styles.g2} ${styles.mt}`}>
        <div className={styles.card}>
          <div className={styles.cardHead}>
            <div>
              <div className={styles.cardTitle}>Keyword Rank Distribution</div>
              <div className={styles.cardSub}>
                How keywords are spread across positions · {yearMonth.label}
              </div>
            </div>
          </div>
          <RankDistChart data={noData ? [] : aggregated!.rankDistMonths} />
        </div>

        <div className={styles.card}>
          <div className={styles.cardHead}>
            <div>
              <div className={styles.cardTitle}>Backlink Growth</div>
              <div className={styles.cardSub}>
                Total backlinks vs referring domains · {yearMonth.label}
              </div>
            </div>
          </div>
          <BacklinkGrowthChart data={noData ? [] : aggregated!.backlinkTrend} />
        </div>
      </div>

      <div className={`${styles.g2} ${styles.mt}`}>
        <div className={styles.card}>
          <div className={styles.cardHead}>
            <div>
              <div className={styles.cardTitle}>Keyword Rankings Detail</div>
              <div className={styles.cardSub}>
                Top commercial-intent keywords · {yearMonth.label}
              </div>
            </div>
          </div>
          {noData ? (
            <div className={styles.emptyState}>📭 No data found for selected period.</div>
          ) : (
            <DataTable value={aggregated?.keywordRows || []} paginator rows={10}>
              <Column field="keyword"  header="Keyword" />
              <Column field="prevRank" header="Prev Rank" />
              <Column field="currRank" header="Curr Rank" />
              <Column
                field="change"
                header="Change"
                body={(rowData) => {
                  const isUp = rowData.change > 0;
                  return (
                    <span
                      className={`${styles.delta} ${
                        isUp ? styles.deltaUp : rowData.change < 0 ? styles.deltaDn : styles.deltaFlat
                      }`}
                    >
                      {isUp
                        ? `▲+${rowData.change}`
                        : rowData.change < 0
                          ? `▼${rowData.change}`
                          : "—"}
                    </span>
                  );
                }}
              />
              <Column field="volume" header="Volume" />
              <Column
                field="status"
                header="Status"
                body={(rowData) => {
                  const statusClass =
                    rowData.status === "Improved"
                      ? styles.pillGreen
                      : rowData.status === "Declined"
                        ? styles.pillRose
                        : styles.pillGray;
                  return (
                    <span className={`${styles.pill} ${statusClass}`}>
                      {rowData.status}
                    </span>
                  );
                }}
              />
            </DataTable>
          )}
        </div>

        <div className={styles.card}>
          <div className={styles.cardHead}>
            <div>
              <div className={styles.cardTitle}>Backlinks — Selected Period</div>
              <div className={styles.cardSub}>
                Quality &amp; growth metrics · {yearMonth.label}
              </div>
            </div>
          </div>
          {noData ? (
            <div className={styles.emptyState}>📭 No data found for selected period.</div>
          ) : (
            <>
              {aggregated!.backlinkMetrics.map((m, i) => (
                <div className={styles.miniM} key={i}>
                  <span className={styles.miniLabel}>{m.label}</span>
                  <span
                    className={`${styles.miniVal} ${
                      m.isDelta ? (m.deltaUp ? styles.deltaUp : styles.deltaDn) : ""
                    }`}
                  >
                    {m.value}
                  </span>
                </div>
              ))}
              <div className={styles.divider} />
              <div className={styles.cardHead} style={{ marginBottom: 8 }}>
                <div className={styles.cardTitle}>Keywords Improved vs Declined</div>
              </div>
              <div className={styles.kwSummaryRow}>
                <div className={`${styles.kwSummaryBox} ${styles.kwSummaryGreen}`}>
                  <div className={styles.kwSummaryNum} style={{ color: "#059669" }}>
                    {aggregated!.kwSummary.improved}
                  </div>
                  <div className={styles.kwSummaryLbl} style={{ color: "#059669" }}>
                    Keywords ▲ Improved
                  </div>
                </div>
                <div className={`${styles.kwSummaryBox} ${styles.kwSummaryRose}`}>
                  <div className={styles.kwSummaryNum} style={{ color: "#e11d48" }}>
                    {aggregated!.kwSummary.declined}
                  </div>
                  <div className={styles.kwSummaryLbl} style={{ color: "#e11d48" }}>
                    Keywords ▼ Declined
                  </div>
                </div>
                <div className={`${styles.kwSummaryBox} ${styles.kwSummaryGray}`}>
                  <div className={styles.kwSummaryNum} style={{ color: "#4a5a7a" }}>
                    {aggregated!.kwSummary.unchanged}
                  </div>
                  <div className={styles.kwSummaryLbl} style={{ color: "#8a9bbf" }}>
                    Unchanged
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SeoIntelligenceDashboard;