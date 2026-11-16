import * as React from "react";
import { useMemo } from "react";
import styles from "./EmailCampaigns.module.scss";
import DateRangePicker, { DateRange } from "../DatePicker/DatePicker";
import { Chart } from "primereact/chart";

export interface ICampaign {
  id: number;
  name: string;
  date: Date;
  sent: number;
  opened: number;
  clicked: number;
  bounced: number;
  unsubscribed: number;
  leads: number;
}

export interface IEmailCampaign {
  ID: number;
  CampaignName: string;
  CampaignId: string;
  ReportDate: string | null;
  Date: string | null;
  Sent: number;
  Opened: number;
  Clicked: number;
  Bounced: number;
  UnSubscribed: number;
  Leads: number;
  OpenRate: number;
  CTR: number;
}

export { DateRange };

export interface IEmailCampaignsDashboardProps {
  campaignData: ICampaign[];

  filteredCampaigns: ICampaign[];
  loading: boolean;
  error: string | null;
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  onRefresh: () => void;
}

const pct = (n: number, d: number) =>
  d === 0 ? "0%" : `${((n / d) * 100).toFixed(1)}%`;

const fmt = (n: number) =>
  n >= 1000 ? (n / 1000).toFixed(1) + "K" : n.toString();

const EmailCampaignsDashboard: React.FC<IEmailCampaignsDashboardProps> = ({
  filteredCampaigns,
  loading,
  error,
  dateRange,
  onDateRangeChange,
  onRefresh,
}) => {
  const totals = useMemo(() => {
    return {
      sent: filteredCampaigns.reduce((a, b) => a + b.sent, 0),
      opened: filteredCampaigns.reduce((a, b) => a + b.opened, 0),
      clicked: filteredCampaigns.reduce((a, b) => a + b.clicked, 0),
      leads: filteredCampaigns.reduce((a, b) => a + b.leads, 0),
    };
  }, [filteredCampaigns]);

  const openRate = pct(totals.opened, totals.sent);
  const ctr = pct(totals.clicked, totals.sent);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: { padding: { top: 10, right: 10, bottom: 0, left: 0 } },
    plugins: {
      legend: {
        display: true,
        position: "top",
        align: "center",
        labels: {
          color: "#64748b",
          font: { size: 11, weight: "500" },
          usePointStyle: true,
          pointStyle: "rect",
          boxWidth: 8,
          padding: 16,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: "#94a3b8", font: { size: 10 } },
      },
      y: {
        beginAtZero: true,
        grid: { color: "#eef2f7", drawBorder: false },
        ticks: { color: "#94a3b8", font: { size: 10 }, stepSize: 10 },
      },
    },
  };

  const rateChart = {
    labels: filteredCampaigns.map((c) => c.name.split("—")[0]),
    datasets: [
      {
        label: "Open Rate %",
        data: filteredCampaigns.map((c) =>
          c.sent ? (c.opened / c.sent) * 100 : 0,
        ),
        backgroundColor: "#059669",
        borderRadius: 8,
        barThickness: 22,
        categoryPercentage: 0.5,
      },
      {
        label: "CTR %",
        data: filteredCampaigns.map((c) =>
          c.sent ? (c.clicked / c.sent) * 100 : 0,
        ),
        backgroundColor: "#0891b2",
        borderRadius: 8,
        barThickness: 22,
        categoryPercentage: 0.5,
      },
    ],
  };

  const funnelChart = {
    labels: filteredCampaigns.map((c) => c.name.split("—")[0]),
    datasets: [
      {
        label: "Sent",
        data: filteredCampaigns.map((c) => c.sent),
        backgroundColor: "#e5e7eb",
        borderRadius: 8,
        barThickness: 18,
      },
      {
        label: "Opened",
        data: filteredCampaigns.map((c) => c.opened),
        backgroundColor: "#2563eb",
        borderRadius: 8,
        barThickness: 18,
      },
      {
        label: "Clicked",
        data: filteredCampaigns.map((c) => c.clicked),
        backgroundColor: "#0891b2",
        borderRadius: 8,
        barThickness: 18,
      },
      {
        label: "Leads",
        data: filteredCampaigns.map((c) => c.leads),
        backgroundColor: "#059669",
        borderRadius: 8,
        barThickness: 18,
      },
    ],
  };

  return (
    <div className={styles.root}>
      <div className={styles.globalHeader}>
        <div>
          <div className={styles.globalTitle}>Email Campaigns</div>
          <div className={styles.globalSub}>Campaign metrics · Excel data</div>
        </div>

        <div className={styles.headerActions}>
          <DateRangePicker
            value={dateRange}
            onChange={onDateRangeChange}
            maxDate={new Date()}
          />

          <button className={styles["li-connect-btn"]}>
            🔗 Connect Sources
          </button>

          <button
            className={styles.primaryBtn}
            onClick={onRefresh}
            disabled={loading}
          >
            {loading ? "⏳ Loading…" : "🔄 Refresh"}
          </button>
        </div>
      </div>

      <div className={styles.topHeaderBar}>
        <div className={styles.headerContainer}>
          <div className={styles.leftSection}>
            <div className={styles.iconBox}>📧</div>
            <div>
              <div className={styles.title}>Email Campaigns</div>
              <div className={styles.subText}>
                Data from Excel upload · Manual entry
              </div>
            </div>
          </div>
          <div>
            <span className={styles.tag}>
              <span>📊</span>Excel Data
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div
          style={{
            margin: "0 28px 16px",
            padding: "12px 16px",
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: 8,
            color: "#dc2626",
            fontSize: 13,
          }}
        >
          ⚠️ {error}
        </div>
      )}

      <div className={styles.kpiGrid}>
        <div className={styles.kpi}>
          <div className={styles.kpiTop}>
            <div className={`${styles.kpiIcon} ${styles.blueBg}`}>📤</div>
          </div>
          <div className={styles.kpiLabel}>TOTAL EMAILS SENT</div>
          <div className={styles.kpiVal}>{fmt(totals.sent)}</div>
          <div className={styles.kpiSub}>Across campaigns</div>
          <div className={styles.kpiAccent} style={{ background: "#2563eb" }} />
        </div>

        <div className={styles.kpi}>
          <div className={styles.kpiTop}>
            <div className={`${styles.kpiIcon} ${styles.greenBg}`}>📊</div>
            <span className={styles.kpiBadge}>▲ 2x avg</span>
          </div>
          <div className={styles.kpiLabel}>AVG OPEN RATE</div>
          <div className={styles.kpiVal}>{openRate}</div>
          <div className={styles.kpiSub}>Industry avg 21.5%</div>
          <div className={styles.kpiAccent} style={{ background: "#059669" }} />
        </div>

        <div className={styles.kpi}>
          <div className={styles.kpiTop}>
            <div className={`${styles.kpiIcon} ${styles.blueSoft}`}>📈</div>
            <span className={styles.kpiBadge}>▲ Excellent</span>
          </div>
          <div className={styles.kpiLabel}>AVG CTR</div>
          <div className={styles.kpiVal}>{ctr}</div>
          <div className={styles.kpiSub}>Clicks / Sent</div>
          <div className={styles.kpiAccent} style={{ background: "#0891b2" }} />
        </div>

        <div className={styles.kpi}>
          <div className={styles.kpiTop}>
            <div className={`${styles.kpiIcon} ${styles.orangeBg}`}>🎯</div>
            <span className={styles.kpiBadge}>▲ 16%</span>
          </div>
          <div className={styles.kpiLabel}>LEADS FROM EMAIL</div>
          <div className={styles.kpiVal}>{totals.leads}</div>
          <div className={styles.kpiSub}>MQLs generated</div>
          <div className={styles.kpiAccent} style={{ background: "#f59e0b" }} />
        </div>
      </div>

      <div className={styles.chartsGrid}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitle}>Open Rate vs CTR by Campaign</div>
            <div className={styles.cardSub}>Performance comparison</div>
          </div>
          <Chart type="bar" data={rateChart} options={chartOptions} />
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitle}>Email Funnel</div>
            <div className={styles.cardSub}>
              Sent → Opened → Clicked → Leads
            </div>
          </div>
          <Chart type="bar" data={funnelChart} options={chartOptions} />
        </div>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableTitle}>Campaign Detail</div>

        <table className={styles.table}>
          <thead>
            <tr>
              <th>#</th>
              <th>Campaign</th>
              <th>Sent</th>
              <th>Opened</th>
              <th>Open Rate</th>
              <th>Clicked</th>
              <th>CTR</th>
              <th>Bounced</th>
              <th>Unsub</th>
              <th>Leads</th>
            </tr>
          </thead>
          <tbody>
            {filteredCampaigns.map((c, i) => (
              <tr key={c.id}>
                <td>{i + 1}</td>
                <td>{c.name}</td>
                <td>{fmt(c.sent)}</td>
                <td>{fmt(c.opened)}</td>
                <td>
                  <span className={`${styles.pill} ${styles.pillGreen}`}>
                    {pct(c.opened, c.sent)}
                  </span>
                </td>
                <td>{fmt(c.clicked)}</td>
                <td>
                  <span className={`${styles.pill} ${styles.pillBlue}`}>
                    {pct(c.clicked, c.sent)}
                  </span>
                </td>
                <td>
                  <span className={`${styles.pill} ${styles.pillAmber}`}>
                    {c.bounced}
                  </span>
                </td>
                <td>
                  <span className={`${styles.pill} ${styles.pillRed}`}>
                    {c.unsubscribed}
                  </span>
                </td>
                <td>{c.leads}</td>
              </tr>
            ))}

            {filteredCampaigns.length === 0 && !loading && (
              <tr>
                <td
                  colSpan={10}
                  style={{ textAlign: "center", color: "#94a3b8", padding: 24 }}
                >
                  No campaigns found for the selected date range.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className={styles.uploadHint}>📤 Add New Campaign Data</div>
      </div>
    </div>
  );
};

export default EmailCampaignsDashboard;
