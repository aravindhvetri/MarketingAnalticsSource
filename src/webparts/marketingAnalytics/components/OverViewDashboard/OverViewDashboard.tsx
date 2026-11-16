import * as React from "react";
import { useEffect, useRef } from "react";
import {
  Chart,
  BarController,
  LineController,
  DoughnutController,
  BarElement,
  LineElement,
  ArcElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Legend,
  Tooltip,
  Filler,
} from "chart.js";

import styles from "./OverViewDashboard.module.scss";
import DateRangePicker, { DateRange } from "../DatePicker/DatePicker";

Chart.register(
  BarController,
  LineController,
  DoughnutController,
  BarElement,
  LineElement,
  ArcElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Legend,
  Tooltip,
  Filler
);

Chart.defaults.font.family = "'Plus Jakarta Sans', 'Segoe UI', sans-serif";
Chart.defaults.font.size = 11;
Chart.defaults.color = "#8a9bbf";

/* ── Interfaces ────────────────────────────────────────────────── */

export interface ISummaryBandItem {
  id: string;
  value: string;
  label: string;
}

export interface IKpiCard {
  icon: string;
  iconBg: string;
  accentColor: string;
  deltaText: string;
  deltaType: "up" | "dn" | "flat";
  label: string;
  value: string;
  sub: string;
}

export interface IChannelScore {
  icon: string;
  label: string;
  score: number;
  color: string;
}

export interface ITopCampaign {
  icon: string;
  label: string;
  value: number;
}

export interface ILeadSourceStat {
  value: string;
  label: string;
  color: string;
}

export interface ILeadTrendDataset {
  label: string;
  data: number[];
  borderColor: string;
  backgroundColor: string;
}

export interface ILeadTrendData {
  labels: string[];
  datasets: ILeadTrendDataset[];
}

export interface ILeadSourcePieData {
  labels: string[];
  data: number[];
  backgroundColor: string[];
}

export interface ITrafficDonutData {
  labels: string[];
  data: number[];
  backgroundColor: string[];
}

export interface IOverviewDashboardProps {
  summaryBand?: ISummaryBandItem[];
  kpiCards?: IKpiCard[];
  channelScores?: IChannelScore[];
  topCampaigns?: ITopCampaign[];
  leadSourceStats?: ILeadSourceStat[];
  leadTrendData?: ILeadTrendData;
  leadSourcePieData?: ILeadSourcePieData;
  trafficDonutData?: ITrafficDonutData;
  companyName?: string;
  dateRangeLabel?: string;
  dateRange?: DateRange;
  onDateRangeChange?: (range: DateRange) => void;
  onRefresh?: () => void;
  onConnectSources?: () => void;
}

/* ── Chart Components ──────────────────────────────────────────── */

interface ILeadsTrendChartProps {
  data: ILeadTrendData;
}

const LeadsTrendChart: React.FC<ILeadsTrendChartProps> = ({ data }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    if (chartRef.current) {
      chartRef.current.destroy();
      chartRef.current = null;
    }

    const canvas = canvasRef.current;
    canvas.width = wrapperRef.current ? wrapperRef.current.clientWidth : 600;
    canvas.height = 220;

    chartRef.current = new Chart(canvas, {
      type: "line",
      data: {
        labels: data.labels,
        datasets: data.datasets.map((ds) => ({
          label: ds.label,
          data: ds.data,
          borderColor: ds.borderColor,
          backgroundColor: ds.backgroundColor,
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          borderWidth: 2,
        })),
      },
      options: {
        responsive: false,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: { boxWidth: 10, padding: 14, font: { size: 11 } },
          },
        },
        scales: {
          y: { grid: { color: "rgba(226,232,242,.8)" }, beginAtZero: true },
          x: { grid: { color: "rgba(226,232,242,.4)" } },
        },
      },
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [data]);

  return (
    <div ref={wrapperRef} className={styles.chartWrapper}>
      {data.labels.length === 0 ? (
        <div className={styles.emptyChart}>No trend data available</div>
      ) : (
        <canvas ref={canvasRef} />
      )}
    </div>
  );
};

interface ILeadSourcePieChartProps {
  data: ILeadSourcePieData;
}

const LeadSourcePieChart: React.FC<ILeadSourcePieChartProps> = ({ data }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const hasData = data.data.some((v) => v > 0);

  useEffect(() => {
    if (!canvasRef.current || !hasData) return;
    if (chartRef.current) {
      chartRef.current.destroy();
      chartRef.current = null;
    }

    const canvas = canvasRef.current;
    canvas.width = wrapperRef.current ? wrapperRef.current.clientWidth : 300;
    canvas.height = 190;

    chartRef.current = new Chart(canvas, {
      type: "doughnut",
      data: {
        labels: data.labels,
        datasets: [
          {
            data: data.data,
            backgroundColor: data.backgroundColor,
            borderWidth: 0,
            hoverOffset: 8,
          },
        ],
      },
      options: {
        responsive: false,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: { boxWidth: 10, padding: 12, font: { size: 10 } },
          },
        },
      },
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [data, hasData]);

  return (
    <div ref={wrapperRef} className={styles.chartWrapperSm}>
      {!hasData ? (
        <div className={styles.emptyChart}>No lead source data</div>
      ) : (
        <canvas ref={canvasRef} />
      )}
    </div>
  );
};

interface ITrafficDonutChartProps {
  data: ITrafficDonutData;
}

const TrafficDonutChart: React.FC<ITrafficDonutChartProps> = ({ data }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const hasData = data.data.some((v) => v > 0);

  useEffect(() => {
    if (!canvasRef.current || !hasData) return;
    if (chartRef.current) {
      chartRef.current.destroy();
      chartRef.current = null;
    }

    const canvas = canvasRef.current;
    canvas.width = wrapperRef.current ? wrapperRef.current.clientWidth : 300;
    canvas.height = 220;

    chartRef.current = new Chart(canvas, {
      type: "doughnut",
      data: {
        labels: data.labels,
        datasets: [
          {
            data: data.data,
            backgroundColor: data.backgroundColor,
            borderWidth: 0,
            hoverOffset: 6,
          },
        ],
      },
      options: {
        responsive: false,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "right",
            labels: { boxWidth: 10, font: { size: 10 } },
          },
        },
      },
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [data, hasData]);

  return (
    <div ref={wrapperRef} className={styles.chartWrapper}>
      {!hasData ? (
        <div className={styles.emptyChart}>No traffic source data</div>
      ) : (
        <canvas ref={canvasRef} />
      )}
    </div>
  );
};

/* ── Sub-components ────────────────────────────────────────────── */

const KpiCard: React.FC<IKpiCard> = (props) => {
  const deltaClass =
    props.deltaType === "up"
      ? styles.deltaUp
      : props.deltaType === "dn"
      ? styles.deltaDn
      : styles.deltaFlat;

  return (
    <div className={styles.kpi}>
      <div className={styles.kpiTop}>
        <div className={styles.kpiIcon} style={{ background: props.iconBg }}>
          {props.icon}
        </div>
        <div className={`${styles.kpiDelta} ${deltaClass}`}>
          {props.deltaText}
        </div>
      </div>
      <div className={styles.kpiLabel}>{props.label}</div>
      <div className={styles.kpiVal}>{props.value}</div>
      <div className={styles.kpiSub}>{props.sub}</div>
      <div
        className={styles.kpiAccent}
        style={{ background: props.accentColor }}
      />
    </div>
  );
};

interface ISummaryBandProps {
  items: ISummaryBandItem[];
}

const SummaryBand: React.FC<ISummaryBandProps> = ({ items }) => (
  <div className={styles.summaryBand}>
    {items.map((item, i) => (
      <React.Fragment key={item.id}>
        {i > 0 && <div className={styles.sbDiv} />}
        <div className={styles.sbItem}>
          <div className={styles.sbNum}>{item.value}</div>
          <div className={styles.sbLbl}>{item.label}</div>
        </div>
      </React.Fragment>
    ))}
  </div>
);

interface IChannelPerformanceProps {
  scores: IChannelScore[];
}

const ChannelPerformance: React.FC<IChannelPerformanceProps> = ({ scores }) => (
  <div className={styles.progList}>
    {scores.length === 0 ? (
      <div className={styles.miniM} style={{ color: "#8a9bbf", justifyContent: "center" }}>
        No channel data available
      </div>
    ) : (
      scores.map((ch, i) => (
        <div className={styles.progWrap} key={i}>
          <div className={styles.progRow}>
            <span className={styles.progLabel}>
              {ch.icon} {ch.label}
            </span>
            <span className={styles.progVal}>{ch.score}/100</span>
          </div>
          <div className={styles.progBar}>
            <div
              className={styles.progFill}
              style={{ width: `${ch.score}%`, background: ch.color }}
            />
          </div>
        </div>
      ))
    )}
  </div>
);

interface ITopCampaignsProps {
  campaigns: ITopCampaign[];
}

const TopCampaigns: React.FC<ITopCampaignsProps> = ({ campaigns }) => (
  <>
    {campaigns.length === 0 ? (
      <div
        className={styles.miniM}
        style={{ color: "#8a9bbf", justifyContent: "center" }}
      >
        No campaign data available
      </div>
    ) : (
      campaigns.map((c, i) => (
        <div className={styles.miniM} key={i}>
          <span className={styles.miniLabel}>
            {c.icon} {c.label}
          </span>
          <span className={styles.miniVal}>{c.value}</span>
        </div>
      ))
    )}
  </>
);

/* ── Main Component ────────────────────────────────────────────── */

const OverViewDashboard: React.FC<IOverviewDashboardProps> = ({
  summaryBand = [],
  kpiCards = [],
  channelScores = [],
  topCampaigns = [],
  leadSourceStats = [],
  leadTrendData = { labels: [], datasets: [] },
  leadSourcePieData = { labels: [], data: [], backgroundColor: [] },
  trafficDonutData = { labels: [], data: [], backgroundColor: [] },
  companyName = "",
  dateRangeLabel = "",
  dateRange,
  onDateRangeChange,
  onRefresh,
  onConnectSources,
}) => {
  return (
    <div className={styles.overviewDashboard}>

      {/* ── Section Header ── */}
      <div className={styles.secHeader}>
        <div className={styles.secTitleWrap}>
          <div className={styles.secIcon} style={{ background: "#e8f0fe" }}>
            ⬛
          </div>
          <div>
            <div className={styles.secTitle}>Marketing Overview</div>
            <div className={styles.secSub}>
              All channels{companyName ? ` · ${companyName}` : ""}
            </div>
          </div>
        </div>
        <div className={styles.secActions}>
          {dateRange && onDateRangeChange && (
            <DateRangePicker
              value={dateRange}
              onChange={onDateRangeChange}
              maxDate={new Date()}
            />
          )}
          {onConnectSources && (
            <button
              onClick={onConnectSources}
              style={{
                padding: "6px 14px",
                fontSize: 12,
                fontWeight: 500,
                border: "1px solid #d1d9ee",
                borderRadius: 6,
                background: "#fff",
                color: "#3d5a99",
                cursor: "pointer",
              }}
            >
              🔗 Connect Sources
            </button>
          )}
          {onRefresh && (
            <button
              onClick={onRefresh}
              style={{
                padding: "6px 14px",
                fontSize: 12,
                fontWeight: 600,
                border: "none",
                borderRadius: 6,
                background: "#1a6ef5",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              🔄 Refresh
            </button>
          )}
          <span className={`${styles.sourceBadge} ${styles.badgeGreen}`}>
            🟢 Live Dashboard
          </span>
        </div>
      </div>

      {/* ── Summary Band ── */}
      {summaryBand.length > 0 && <SummaryBand items={summaryBand} />}

      {/* ── KPI Strip ── */}
      {kpiCards.length > 0 && (
        <div className={`${styles.g4} ${styles.mt}`}>
          {kpiCards.map((kpi, i) => (
            <KpiCard key={i} {...kpi} />
          ))}
        </div>
      )}

      {/* ── Lead Trend + Source Pie ── */}
      <div className={`${styles.gWide} ${styles.mt}`}>
        <div className={styles.card}>
          <div className={styles.cardHead}>
            <div>
              <div className={styles.cardTitle}>
                Lead Generation — All Channels
              </div>
              <div className={styles.cardSub}>
                Monthly trend across all marketing sources
              </div>
            </div>
            <span className={`${styles.cardBadge} ${styles.pillBlue}`}>
              {leadTrendData.labels.length > 0
                ? `Last ${leadTrendData.labels.length} Months`
                : "No Data"}
            </span>
          </div>
          <LeadsTrendChart data={leadTrendData} />
        </div>

        <div className={styles.card}>
          <div className={styles.cardHead}>
            <div>
              <div className={styles.cardTitle}>Lead Source Mix</div>
              <div className={styles.cardSub}>This period</div>
            </div>
          </div>
          <LeadSourcePieChart data={leadSourcePieData} />
          {leadSourceStats.length > 0 && (
            <div className={styles.statRow}>
              {leadSourceStats.map((s, i) => (
                <div className={styles.statBox} key={i}>
                  <div className={styles.statVal} style={{ color: s.color }}>
                    {s.value}
                  </div>
                  <div className={styles.statLbl}>{s.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Channel Score + Traffic Donut + Top Campaigns ── */}
      <div className={`${styles.g3} ${styles.mt}`}>
        <div className={styles.card}>
          <div className={styles.cardHead}>
            <div>
              <div className={styles.cardTitle}>Channel Performance Score</div>
              <div className={styles.cardSub}>Relative effectiveness</div>
            </div>
          </div>
          <ChannelPerformance scores={channelScores} />
        </div>

        <div className={styles.card}>
          <div className={styles.cardHead}>
            <div>
              <div className={styles.cardTitle}>Website Traffic Sources</div>
              <div className={styles.cardSub}>Session share this period</div>
            </div>
          </div>
          <TrafficDonutChart data={trafficDonutData} />
        </div>

        <div className={styles.card}>
          <div className={styles.cardHead}>
            <div>
              <div className={styles.cardTitle}>Top Performing Campaigns</div>
              <div className={styles.cardSub}>By leads generated</div>
            </div>
          </div>
          <TopCampaigns campaigns={topCampaigns} />
        </div>
      </div>

    </div>
  );
};

export default OverViewDashboard;