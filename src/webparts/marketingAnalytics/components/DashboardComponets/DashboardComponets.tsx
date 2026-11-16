import * as React from "react";
import { useState, useMemo, useEffect } from "react";
import Sidebar from "../SidNavComponets/SidNavComponets";
import "../../../ExternalRef/CSS/ReportsStyle.css";
import LinkedInAnalytics from "../LinkedIn/LinkedIn";
import EmailCampaignsDashboard from "../EmailCampaigns/EmailCampaigns";
import WebsiteAnalytics from "../WebsiteAnalytics/WebsiteAnalytics";
import SEOIntelligence from "../SEOIntelligence/SEOIntelligence";
import LeadsIntelligence from "../LeadsIntelligence/LeadsIntelligence";
import OverViewDashboard, {
  IOverviewDashboardProps,
  ISummaryBandItem,
  IKpiCard,
  IChannelScore,
  ITopCampaign,
  ILeadSourceStat,
  ILeadTrendData,
  ILeadSourcePieData,
  ITrafficDonutData,
} from "../OverViewDashboard/OverViewDashboard";
import PaidAdsPerformance from "../PaidAds/PaidAds";
import { sp } from "@pnp/sp";

import {
  ICampaign,
  DateRange as EmailDateRange,
} from "../EmailCampaigns/EmailCampaigns";

// Re-use the same DateRange shape for the overview panel
type OverviewDateRange = EmailDateRange;

import {
  IDailySummary,
  IMonthlyTrend,
  ITrafficSource,
  IPageDetails,
  ICountryDetails,
  IDeviceSessionMetrics,
  IDateRange as WebsiteDateRange,
  filterByDateRange,
} from "../WebsiteAnalytics/WebsiteAnalytics";

import {
  ICampaignRow,
  IAggRow,
  IGoogleAdsItem,
  IFacebookAdsItem,
  DateRange as PaidAdsDateRange,
  Platform,
  getCtrType,
  getStatus,
  filterByRange,
  aggregateCampaigns,
} from "../PaidAds/PaidAds";

import {
  IKeyword,
  ITopPage,
  IBacklinkSummary,
} from "../SEOIntelligence/SEOIntelligence";

import { ILead } from "../LeadsIntelligence/LeadsIntelligence";

/* ── Helpers ──────────────────────────────────────────────────── */

function toMidnight(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function defaultEmailRange(): EmailDateRange {
  const today = new Date();
  return {
    startDate: new Date(today.getFullYear(), today.getMonth(), 1),
    endDate: today,
    label: "This Month",
  };
}

function defaultWebsiteRange(): WebsiteDateRange {
  const today = toMidnight(new Date());
  return {
    startDate: new Date(today.getFullYear(), today.getMonth(), 1),
    endDate: today,
    label: "This Month",
  };
}

function defaultPaidAdsRange(): PaidAdsDateRange {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return {
    startDate: new Date(today.getFullYear(), today.getMonth(), 1),
    endDate: today,
    label: "This Month",
  };
}

function defaultOverviewRange(): OverviewDateRange {
  const today = new Date();
  return {
    startDate: new Date(today.getFullYear(), today.getMonth(), 1),
    endDate: today,
    label: "This Month",
  };
}

function parseSharePointDate(raw: string | null | undefined): Date | null {
  if (!raw) return null;
  try {
    const datePart = raw.split("T")[0];
    const [y, m, d] = datePart.split("-").map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d);
  } catch {
    return null;
  }
}

/** Format a number with K/M suffix */
function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

/** Format currency */
function fmtCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

/** Format a percentage */
function fmtPct(n: number): string {
  return `${n.toFixed(1)}%`;
}

/* ── buildOverviewProps ───────────────────────────────────────── */
/**
 * Transforms all raw SharePoint data into the typed prop shape that
 * OverViewDashboard expects. Keep all business logic here so the
 * dashboard component stays presentation-only.
 */
function buildOverviewProps(args: {
 campaignData: ICampaign[];
  filteredCampaigns: ICampaign[];
  filteredDaily: IDailySummary[];
  filteredTrafficSources: ITrafficSource[];
  filteredPaidAds: ICampaignRow[];
  campaignTable: IAggRow[];
  seoKeywordData: IKeyword[];
  leadsData: ILead[];
  dateRange: OverviewDateRange;
}): IOverviewDashboardProps {
  const {
    filteredCampaigns: rawCampaigns,
    filteredDaily: rawDaily,
    filteredTrafficSources: rawTrafficSources,
    filteredPaidAds: rawPaidAds,
    campaignTable,
    seoKeywordData,
    leadsData: rawLeads,
    dateRange,
  } = args;

  const { startDate, endDate } = dateRange;

  // Apply the overview date range to each data source
  const filteredCampaigns = rawCampaigns.filter(
    (c) => c.date >= startDate && c.date <= endDate,
  );

  const filteredDaily = rawDaily.filter((d) => {
    if (!d.Date) return false;
    const dt = new Date(d.Date);
    return dt >= startDate && dt <= endDate;
  });

  const filteredTrafficSources = rawTrafficSources.filter((t) => {
    if (!t.Date) return false;
    const dt = new Date(t.Date);
    return dt >= startDate && dt <= endDate;
  });

  const filteredPaidAds = rawPaidAds.filter(
    (r) => r.date >= startDate && r.date <= endDate,
  );

  const leadsData = rawLeads.filter((l) => {
    if (!l.date) return true; // keep leads with no date
    return l.date >= startDate && l.date <= endDate;
  });

  const dateRangeLabel = dateRange.label;

  /* ── Summary Band ── */
  const totalLeads = leadsData.length;

  const totalUsers = filteredDaily.reduce((s, d) => s + d.Users, 0);

  const totalAdSpend = filteredPaidAds.reduce((s, r) => s + r.spend, 0);

  const avgConversion =
    filteredDaily.length > 0
      ? filteredDaily.reduce((s, d) => s + d.Conversion, 0) /
        filteredDaily.length
      : 0;
const totalAdLeads = filteredPaidAds.reduce(
  (s, r) => s + (r.leads ?? 0),
  0
);

const totalSpend = filteredPaidAds.reduce(
  (s, r) => s + (r.spend ?? 0),
  0
);

const avgCpl =
  totalAdLeads > 0
    ? totalSpend / totalAdLeads
    : 0;

const qualifiedStatuses = ["qualified", "hot", "warm"];

const qualifiedLeads = leadsData.filter(
  (l) =>
    l.status &&
    qualifiedStatuses.indexOf(l.status.toLowerCase()) !== -1
).length;

  const summaryBand: ISummaryBandItem[] = [
    { id: "totalLeads", value: fmt(totalLeads), label: "Total Leads" },
    { id: "sessions", value: fmt(totalUsers), label: "Website Users" },
    { id: "adSpend", value: fmtCurrency(totalAdSpend), label: "Ad Spend" },
    {
      id: "convRate",
      value: fmtPct(avgConversion),
      label: "Conv. Rate",
    },
    {
      id: "cpl",
      value: avgCpl > 0 ? fmtCurrency(avgCpl) : "—",
      label: "Avg CPL",
    },
    { id: "qualLeads", value: fmt(qualifiedLeads), label: "Qualified Leads" },
  ];

  /* ── KPI Cards ── */

  // Email open rate
  const totalSent = filteredCampaigns.reduce((s, c) => s + c.sent, 0);
  const totalOpened = filteredCampaigns.reduce((s, c) => s + c.opened, 0);
  const openRate = totalSent > 0 ? (totalOpened / totalSent) * 100 : 0;

 // Ads leads from paid ads
const adsLeads = filteredPaidAds.reduce(
  (s, r) => s + (r.leads ?? 0),
  0
);

  // Average bounce rate across daily summaries
  const avgBounce =
    filteredDaily.length > 0
      ? filteredDaily.reduce((s, d) => s + d.Bounce, 0) / filteredDaily.length
      : 0;

  const kpiCards: IKpiCard[] = [
    {
      icon: "📧",
      iconBg: "#d1fae5",
      accentColor: "#059669",
      deltaText: totalSent > 0 ? `${fmt(totalSent)} sent` : "No data",
      deltaType: "flat",
      label: "Email Open Rate",
      value: fmtPct(openRate),
      sub: `${fmt(totalOpened)} opened`,
    },
    {
      icon: "🌐",
      iconBg: "#e0f5fa",
      accentColor: "#0891b2",
      deltaText: `${fmtPct(avgBounce)} bounce`,
      deltaType: avgBounce > 50 ? "dn" : "up",
      label: "Total Website Users",
      value: fmt(totalUsers),
      sub: `${filteredDaily.length} days tracked`,
    },
    {
      icon: "💰",
      iconBg: "#ffe4e6",
      accentColor: "#e11d48",
      deltaText:
        avgCpl > 0 ? `CPL ${fmtCurrency(avgCpl)}` : "No spend data",
      deltaType: "flat",
      label: "Ads Leads",
      value: fmt(adsLeads),
      sub: `Spend: ${fmtCurrency(totalAdSpend)}`,
    },
    {
      icon: "🔍",
      iconBg: "#e8f0fe",
      accentColor: "#1a6ef5",
      deltaText:
        seoKeywordData.length > 0
          ? `${seoKeywordData.length} keywords`
          : "No data",
      deltaType: "flat",
      label: "SEO Keywords Tracked",
      value: fmt(
        seoKeywordData.reduce((s, k) => s + k.Clicks, 0),
      ),
      sub: "Total organic clicks",
    },
  ];

  /* ── Channel Performance Scores ── */

  // Email score: open-rate normalised to 0-100 (industry avg ~25%)
  const emailScore = Math.min(100, Math.round((openRate / 40) * 100));

  // Website score: inverse bounce (lower bounce = better), normalised
  const websiteScore = Math.min(
    100,
    Math.round(Math.max(0, 100 - avgBounce)),
  );

  // Paid ads score: CTR-based, average across campaigns
  const avgCtr =
    filteredPaidAds.length > 0
      ? filteredPaidAds.reduce((s, r) => {
          const n = parseFloat(r.ctr.replace("%", "")) || 0;
          return s + n;
        }, 0) / filteredPaidAds.length
      : 0;
  const adsScore = Math.min(100, Math.round((avgCtr / 5) * 100)); // 5% CTR = 100

  // SEO score: average position normalised (lower is better, top 10 = 100)
  const avgPos =
    seoKeywordData.length > 0
      ? seoKeywordData.reduce((s, k) => s + k.AvgPosition, 0) /
        seoKeywordData.length
      : 0;
  const seoScore =
    avgPos > 0 ? Math.min(100, Math.round(Math.max(0, (11 - avgPos) * 10))) : 0;

  // Leads score: qualified lead ratio
  const leadsScore =
    totalLeads > 0
      ? Math.min(100, Math.round((qualifiedLeads / totalLeads) * 100))
      : 0;

  const channelScores: IChannelScore[] = [
    { icon: "📧", label: "Email Campaigns", score: emailScore, color: "#059669" },
    { icon: "🌐", label: "Website (Bounce)", score: websiteScore, color: "#0891b2" },
    { icon: "💰", label: "Paid Ads (CTR)", score: adsScore, color: "#d97706" },
    { icon: "🔍", label: "SEO / GSC", score: seoScore, color: "#1a6ef5" },
    { icon: "🎯", label: "Leads Quality", score: leadsScore, color: "#7c3aed" },
  ];

  /* ── Top Campaigns by leads ── */
  const topCampaigns: ITopCampaign[] = campaignTable
    .slice()
    .sort((a, b) => b.leads - a.leads)
    .slice(0, 5)
    .map((c) => ({
      icon: c.platform === "Google" ? "🔍" : c.platform === "Facebook" ? "📘" : "📣",
      label: c.campaignName,
      value: c.leads,
    }));

  /* ── Lead Source Stats ── */
 const adsLeadCount = filteredPaidAds.reduce(
  (s, r) => s + (r.leads ?? 0),
  0
);
  const emailLeadCount = filteredCampaigns.reduce((s, c) => s + c.leads, 0);
  const organicLeadCount = leadsData.filter(
    (l) =>
      l.source &&
      ["organic", "seo", "google", "search"].some((k) =>
        l.source.toLowerCase().includes(k),
      ),
  ).length;

  const leadSourceStats: ILeadSourceStat[] = [
    { value: fmt(adsLeadCount), label: "Ads", color: "#e11d48" },
    { value: fmt(emailLeadCount), label: "Email", color: "#059669" },
    { value: fmt(organicLeadCount), label: "Organic", color: "#0891b2" },
  ];

  /* ── Lead Trend Chart (last 6 months) ── */
  // Build month labels from leads data (or paid ads + email combined)
  const monthMap: Record<string, { ads: number; email: number; organic: number }> = {};

filteredPaidAds.forEach((r) => {
  const month =
    r.date.getMonth() + 1 < 10
      ? "0" + (r.date.getMonth() + 1)
      : String(r.date.getMonth() + 1);

  const key = `${r.date.getFullYear()}-${month}`;

  if (!monthMap[key]) {
    monthMap[key] = {
      ads: 0,
      email: 0,
      organic: 0,
    };
  }

  monthMap[key].ads += r.leads ?? 0;
});
 // Leads by month from email
filteredCampaigns.forEach((c) => {
  const month =
    c.date.getMonth() + 1 < 10
      ? "0" + (c.date.getMonth() + 1)
      : String(c.date.getMonth() + 1);

  const key = `${c.date.getFullYear()}-${month}`;

  if (!monthMap[key]) {
    monthMap[key] = {
      ads: 0,
      email: 0,
      organic: 0,
    };
  }

  monthMap[key].email += c.leads ?? 0;
});

  // Leads by month from leadsData (organic)
 leadsData.forEach((l) => {
  if (!l.date) return;

  const isOrganic =
    l.source &&
    ["organic", "seo", "google", "search"].some(
      (k) => l.source.toLowerCase().indexOf(k) !== -1
    );

  if (!isOrganic) return;

  const month =
    l.date.getMonth() + 1 < 10
      ? "0" + (l.date.getMonth() + 1)
      : String(l.date.getMonth() + 1);

  const key = `${l.date.getFullYear()}-${month}`;

  if (!monthMap[key]) {
    monthMap[key] = {
      ads: 0,
      email: 0,
      organic: 0,
    };
  }

  monthMap[key].organic += 1;
});

  const sortedKeys = Object.keys(monthMap).sort().slice(-6);

  const MONTH_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  const trendLabels = sortedKeys.map((k) => {
    const [, m] = k.split("-");
    return MONTH_SHORT[parseInt(m, 10) - 1];
  });

  const leadTrendData: ILeadTrendData = {
    labels: trendLabels,
    datasets:
      sortedKeys.length > 0
        ? [
            {
              label: "Paid Ads",
              data: sortedKeys.map((k) => monthMap[k]?.ads ?? 0),
              borderColor: "#e11d48",
              backgroundColor: "rgba(225,29,72,.08)",
            },
            {
              label: "Email",
              data: sortedKeys.map((k) => monthMap[k]?.email ?? 0),
              borderColor: "#059669",
              backgroundColor: "rgba(5,150,105,.08)",
            },
            {
              label: "Organic",
              data: sortedKeys.map((k) => monthMap[k]?.organic ?? 0),
              borderColor: "#0891b2",
              backgroundColor: "rgba(8,145,178,.08)",
            },
          ]
        : [],
  };

 /* ── Lead Source Pie ── */
const leadSourcePieData: ILeadSourcePieData = {
  labels: ["Paid Ads", "Email", "Organic"],
  data: [
    adsLeadCount ?? 0,
    emailLeadCount ?? 0,
    organicLeadCount ?? 0,
  ],
  backgroundColor: ["#e11d48", "#059669", "#0891b2"],
};

/* ── Traffic Donut (sessions by source) ── */
const sourceMap: Record<string, number> = {};

filteredTrafficSources.forEach((t) => {
  const src = (t.Source || "Other").trim();

  sourceMap[src] =
    (sourceMap[src] || 0) + (t.TotalUser ?? 0);
});

const SOURCE_COLORS: Record<string, string> = {
  Organic: "#1a6ef5",
  Direct: "#0891b2",
  Social: "#7c3aed",
  Referral: "#d97706",
  Paid: "#e11d48",
  Email: "#059669",
};

const FALLBACK_COLORS = [
  "#6366f1",
  "#14b8a6",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
];

/* ES5-compatible sorting */
const sourceEntries = Object.keys(sourceMap)
  .map((key) => [key, sourceMap[key]] as [string, number])
  .sort((a, b) => b[1] - a[1]);

const trafficDonutData: ITrafficDonutData = {
  labels: sourceEntries.map((item) => item[0]),

  data: sourceEntries.map((item) => item[1]),

  backgroundColor: sourceEntries.map((item, i) => {
    const key = item[0];

    return (
      SOURCE_COLORS[key] ||
      FALLBACK_COLORS[i % FALLBACK_COLORS.length]
    );
  }),
};

  return {
    summaryBand,
    kpiCards,
    channelScores,
    topCampaigns,
    leadSourceStats,
    leadTrendData,
    leadSourcePieData,
    trafficDonutData,
    dateRangeLabel,
  };
}

/* ── MainComponent ────────────────────────────────────────────── */

const MainComponent = (props: any) => {
  const [activeSection, setActiveSection] = useState("overview");

  /* Overview date filter — shared across all data sources on the overview tab */
  const [overviewDateRange, setOverviewDateRange] =
    useState<OverviewDateRange>(defaultOverviewRange());

  /* Email campaigns */
  const [campaignData, setCampaignData] = useState<ICampaign[]>([]);
  const [campaignLoading, setCampaignLoading] = useState(false);
  const [campaignError, setCampaignError] = useState<string | null>(null);
  const [emailDateRange, setEmailDateRange] =
    useState<EmailDateRange>(defaultEmailRange());

  const fetchCampaignData = async () => {
    setCampaignLoading(true);
    setCampaignError(null);
    try {
      const response = await sp.web.lists
        .getByTitle("WebsiteAnalyticsEmailCampaign")
        .items.select(
          "ID","CampaignName","Date","Sent","Opened","Clicked","Bounced","UnSubscribed","Leads",
        )
        .orderBy("Date", false)
        .getAll();

      const formatted: ICampaign[] = response.map((item: any) => ({
        id: item.ID,
        name: item.CampaignName,
        date: item.Date ? new Date(item.Date) : new Date(),
        sent: Number(item.Sent || 0),
        opened: Number(item.Opened || 0),
        clicked: Number(item.Clicked || 0),
        bounced: Number(item.Bounced || 0),
        unsubscribed: Number(item.UnSubscribed || 0),
        leads: Number(item.Leads || 0),
      }));
      setCampaignData(formatted);
    } catch (err: any) {
      console.error(err);
      setCampaignError("Failed to load campaign data.");
    } finally {
      setCampaignLoading(false);
    }
  };

  const filteredCampaigns = useMemo(
    () =>
      campaignData.filter(
        (c) =>
          c.date >= emailDateRange.startDate &&
          c.date <= emailDateRange.endDate,
      ),
    [campaignData, emailDateRange],
  );

  /* Website analytics */
  const [websiteLoading, setWebsiteLoading] = useState(false);
  const [websiteDateRange, setWebsiteDateRange] =
    useState<WebsiteDateRange>(defaultWebsiteRange());

  const [dailySummaryData, setDailySummaryData] = useState<IDailySummary[]>([]);
  const [monthlyTrendData, setMonthlyTrendData] = useState<IMonthlyTrend[]>([]);
  const [trafficSources, setTrafficSources] = useState<ITrafficSource[]>([]);
  const [pageDetails, setPageDetails] = useState<IPageDetails[]>([]);
  const [countryDetails, setCountryDetails] = useState<ICountryDetails[]>([]);
  const [deviceSessionMetrics, setDeviceSessionMetrics] = useState<IDeviceSessionMetrics[]>([]);

  const fetchDailySummary = async () => {
    const response = await sp.web.lists
      .getByTitle("WebsiteAnalyticsDailySummary")
      .items.select("*").orderBy("Date", false).getAll();
    setDailySummaryData(
      response.map((item: any) => ({
        ID: item.ID, Date: item.Date || null,
        Users: Number(item.Users || 0), Sessions: Number(item.Sessions || 0),
        Bounce: Number(item.Bounce || 0), Conversion: Number(item.Conversion || 0),
        NewUsers: Number(item.NewUsers || 0),
      })),
    );
  };

  const fetchMonthlyTrend = async () => {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const fromISO = new Date(
      sixMonthsAgo.getFullYear(), sixMonthsAgo.getMonth(), sixMonthsAgo.getDate(), 0, 0, 0,
    ).toISOString();
    const response = await sp.web.lists
      .getByTitle("WebsiteAnalyticsMonthlyTrend")
      .items.select("*")
      .filter(`Date ge datetime'${fromISO}'`)
      .orderBy("Date", true).getAll();
    setMonthlyTrendData(
      response.map((item: any) => ({
        ID: item.ID, Date: item.Date || null,
        Sessions: Number(item.Sessions || 0), Users: Number(item.Users || 0),
      })),
    );
  };

  const fetchTrafficSources = async () => {
    const response = await sp.web.lists
      .getByTitle("WebsiteAnalyticsTrafficSources")
      .items.select("*").orderBy("Date", false).getAll();
    setTrafficSources(
      response.map((item: any) => ({
        ID: item.ID, Date: item.Date || null,
        TotalUser: Number(item.Sessions || 0), Source: item.Source || "Unknown",
      })),
    );
  };

  const fetchPageDetails = async () => {
    const response = await sp.web.lists
      .getByTitle("WebsiteAnalyticsPagesDetails")
      .items.select("ID","Date","Page","Sessions","Bounce","AvgTime","TotalUser")
      .orderBy("Date", false).getAll();
    setPageDetails(
      response.map((item: any) => ({
        ID: item.ID, Date: item.Date ? new Date(item.Date) : null,
        Page: item.Page || "", Session: Number(item.Sessions ?? 0),
        Bounce: Number(item.Bounce ?? 0), AvgTime: Number(item.AvgTime ?? 0),
        totalUsers: Number(item.TotalUser ?? 0),
      })),
    );
  };

  const fetchCountryDetails = async () => {
    const response = await sp.web.lists
      .getByTitle("WebsiteAnalyticsCountry")
      .items.select("ID","Date","Country","CountryCode","TotalUsers")
      .orderBy("Date", false).getAll();
    setCountryDetails(
      response.map((item: any) => ({
        ID: item.ID, Date: item.Date ? new Date(item.Date) : null,
        Country: item.Country ?? "", CountryCode: item.CountryCode ?? "",
        TotalUser: Number(item.TotalUsers ?? 0),
      })),
    );
  };

  const fetchDeviceSessionMetrics = async () => {
    const response = await sp.web.lists
      .getByTitle("WebsiteAnalyticsDeviceSessionMetrics")
      .items.select("ID","Date","Device","ReturningUsers","NewUsers","TotalUsers")
      .orderBy("Date", false).getAll();
    setDeviceSessionMetrics(
      response.map((item: any) => {
        const rawDevice = (item.Device || "").toLowerCase();
        const valid = ["desktop", "mobile", "tablet"];
        const device =
          valid.indexOf(rawDevice) !== -1
            ? rawDevice.charAt(0).toUpperCase() + rawDevice.slice(1)
            : "Desktop";
        return {
          ID: item.ID, Date: item.Date ? new Date(item.Date) : null,
          Device: device, ReturningUsers: Number(item.ReturningUsers ?? 0),
          NewUsers: Number(item.NewUsers ?? 0), TotalUsers: Number(item.TotalUsers ?? 0),
        };
      }),
    );
  };

  const fetchAllWebsiteData = async () => {
    setWebsiteLoading(true);
    setWebsiteDateRange(defaultWebsiteRange());
    try {
      await Promise.all([
        fetchDailySummary(), fetchMonthlyTrend(), fetchTrafficSources(),
        fetchPageDetails(), fetchCountryDetails(), fetchDeviceSessionMetrics(),
      ]);
    } catch (err) {
      console.error("WebsiteAnalytics fetch error:", err);
    } finally {
      setWebsiteLoading(false);
    }
  };

  const { startDate: wsStart, endDate: wsEnd } = websiteDateRange;

  const filteredDaily = useMemo<IDailySummary[]>(
    () =>
      wsStart && wsEnd && dailySummaryData.length
        ? filterByDateRange(dailySummaryData, wsStart, wsEnd)
        : dailySummaryData,
    [websiteDateRange, dailySummaryData],
  );
  const filteredTrafficSources = useMemo<ITrafficSource[]>(
    () =>
      wsStart && wsEnd && trafficSources.length
        ? filterByDateRange(trafficSources, wsStart, wsEnd)
        : trafficSources,
    [websiteDateRange, trafficSources],
  );
  const filteredPageDetails = useMemo<IPageDetails[]>(
    () =>
      wsStart && wsEnd && pageDetails.length
        ? filterByDateRange(pageDetails, wsStart, wsEnd)
        : pageDetails,
    [websiteDateRange, pageDetails],
  );
  const filteredCountryDetails = useMemo<ICountryDetails[]>(
    () =>
      wsStart && wsEnd && countryDetails.length
        ? filterByDateRange(countryDetails, wsStart, wsEnd)
        : countryDetails,
    [websiteDateRange, countryDetails],
  );
  const filteredDeviceMetrics = useMemo<IDeviceSessionMetrics[]>(
    () =>
      wsStart && wsEnd && deviceSessionMetrics.length
        ? filterByDateRange(deviceSessionMetrics, wsStart, wsEnd)
        : deviceSessionMetrics,
    [websiteDateRange, deviceSessionMetrics],
  );

  /* Paid ads */
  const [googleAdsData, setGoogleAdsData] = useState<IGoogleAdsItem[]>([]);
  const [facebookAdsData, setFacebookAdsData] = useState<IFacebookAdsItem[]>([]);
  const [paidAdsLoading, setPaidAdsLoading] = useState(false);
  const [paidAdsDateRange, setPaidAdsDateRange] =
    useState<PaidAdsDateRange>(defaultPaidAdsRange());
  const [selectedPlatform, setSelectedPlatform] = useState<string>("All");

  const fetchGoogleAdsData = async () => {
    const response: IGoogleAdsItem[] = await sp.web.lists
      .getByTitle("GoogleAds")
      .items.select("Id","Date","CampaignName","CPL","Impressions","Clicks","Spend","CTR","Status","Leads")
      .orderBy("Date", false).getAll();
    setGoogleAdsData(response);
  };

  const fetchFacebookAdsData = async () => {
    const response: IFacebookAdsItem[] = await sp.web.lists
      .getByTitle("FacebookAds")
      .items.select("Id","CampaignName","Spend","Impressions","Clicks","CTR","Leads","CPL","Date","Status","Created","Modified")
      .orderBy("Date", false).getAll();
    setFacebookAdsData(response);
  };

  const fetchAllPaidAdsData = async () => {
    setPaidAdsLoading(true);
    setPaidAdsDateRange(defaultPaidAdsRange());
    setSelectedPlatform("All");
    try {
      await Promise.all([fetchGoogleAdsData(), fetchFacebookAdsData()]);
    } catch (err) {
      console.error("PaidAds fetch error:", err);
    } finally {
      setPaidAdsLoading(false);
    }
  };

  const combinedPaidAds = useMemo((): ICampaignRow[] => {
    const google: ICampaignRow[] = googleAdsData.map((item) => ({
      platform: "Google" as Platform,
      campaignName: item.CampaignName,
      date: new Date(item.Date),
      spend: Number(item.Spend ?? 0),
      impressions: Number(item.Impressions ?? 0),
      clicks: Number(item.Clicks ?? 0),
      ctr: `${Number(item.CTR ?? 0).toFixed(2)}%`,
      ctrType: getCtrType(Number(item.CTR ?? 0)),
      leads: Number(item.Leads ?? 0),
      cpl: Number(item.CPL ?? 0),
      status: getStatus(item.Status),
    }));

    const facebook: ICampaignRow[] = facebookAdsData.map((item) => ({
      platform: "Facebook" as Platform,
      campaignName: item.CampaignName,
      date: new Date(item.Date),
      spend: Number(item.Spend ?? 0),
      impressions: Number(item.Impressions ?? 0),
      clicks: Number(item.Clicks ?? 0),
      ctr: `${Number(item.CTR ?? 0).toFixed(2)}%`,
      ctrType: getCtrType(Number(item.CTR ?? 0)),
      leads: Number(item.Leads ?? 0),
      cpl: Number(item.CPL ?? 0),
      status: getStatus(item.Status),
    }));

    return [...google, ...facebook];
  }, [googleAdsData, facebookAdsData]);

  const filteredPaidAds = useMemo(
    () => filterByRange(combinedPaidAds, paidAdsDateRange),
    [combinedPaidAds, paidAdsDateRange],
  );

  const availablePlatforms = useMemo((): Platform[] => {
    const seen: Record<string, boolean> = {};
    const result: Platform[] = [];
    filteredPaidAds.forEach((item) => {
      if (!seen[item.platform]) {
        seen[item.platform] = true;
        result.push(item.platform);
      }
    });
    return result;
  }, [filteredPaidAds]);

  const campaignTable = useMemo((): IAggRow[] => {
    const platformFiltered =
      selectedPlatform === "All"
        ? filteredPaidAds
        : filteredPaidAds.filter((item) => item.platform === selectedPlatform);
    return aggregateCampaigns(platformFiltered);
  }, [filteredPaidAds, selectedPlatform]);

  /* SEO */
  const [seoKeywordData, setSeoKeywordData] = useState<IKeyword[]>([]);
  const [seoTopPageData, setSeoTopPageData] = useState<ITopPage[]>([]);
  const [seoBacklinkData, setSeoBacklinkData] = useState<IBacklinkSummary[]>([]);
  const [seoLoading, setSeoLoading] = useState(false);
  const [seoError, setSeoError] = useState<string | null>(null);

  const fetchSeoKeywordData = async () => {
    const res = await sp.web.lists
      .getByTitle("SEOIntelligence-KeywordRankings")
      .items.select("ID","Keyword","Clicks","Impressions","CTR","AvgPosition","Status","Date")
      .orderBy("Date", false).getAll();
    setSeoKeywordData(
      res.map((item: any) => ({
        ID: item.ID, Keyword: item.Keyword,
        Clicks: Number(item.Clicks || 0), Impressions: Number(item.Impressions || 0),
        CTR: Number(item.CTR || 0), AvgPosition: Number(item.AvgPosition || 0),
        Status: item.Status, Date: item.Date || null,
      })),
    );
  };

  const fetchSeoTopPageData = async () => {
    const res = await sp.web.lists
      .getByTitle("SEOIntelligence-TopPagesDetails(GSC)")
      .items.select("ID","PageURL","Clicks","Impressions","CTR","AvgPosition","Date")
      .orderBy("Date", false).getAll();
    setSeoTopPageData(
      res.map((item: any) => ({
        ID: item.ID, PageURL: item.PageURL,
        Clicks: Number(item.Clicks || 0), Impressions: Number(item.Impressions || 0),
        CTR: Number(item.CTR || 0), AvgPosition: Number(item.AvgPosition || 0),
        Date: item.Date || null,
      })),
    );
  };

  const fetchSeoBacklinkData = async () => {
    const res = await sp.web.lists
      .getByTitle("SEOIntelligence-BacklinkSummary")
      .items.select("ID","Metric","Value","Notes","Date")
      .orderBy("Date", false).getAll();
    setSeoBacklinkData(
      res.map((item: any) => ({
        ID: item.ID, Metric: item.Metric,
        Value: item.Value || "0", Notes: item.Notes, Date: item.Date || null,
      })),
    );
  };

  const fetchAllSeoData = async () => {
    setSeoLoading(true);
    setSeoError(null);
    try {
      await Promise.all([fetchSeoKeywordData(), fetchSeoTopPageData(), fetchSeoBacklinkData()]);
    } catch (err) {
      console.error("SEO fetch error:", err);
      setSeoError("Failed to load SEO data.");
    } finally {
      setSeoLoading(false);
    }
  };

  /* Leads */
  const [leadsData, setLeadsData] = useState<ILead[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(false);

  const fetchLeadsData = async () => {
    setLeadsLoading(true);
    try {
      const response = await sp.web.lists
        .getByTitle("MarketingAnalytics-LeadsIntelligenceDetails")
        .items.select(
          "ID","Date","LeadName","PhoneNumber","CompanyName","EmailId","Enquiry","Source","Campaign","Country","Notes","Status",
        )
        .orderBy("Date", false).getAll();

      const formatted: ILead[] = response.map((item: any) => ({
        id: item.ID,
        date: parseSharePointDate(item.Date),
        leadName: item.LeadName || "",
        phoneNumber: item.PhoneNumber || "",
        companyName: item.CompanyName || "",
        email: item.EmailId || "",
        enquiry: item.Enquiry || "",
        source: item.Source || "",
        campaign: item.Campaign || "",
        country: item.Country || "",
        notes: item.Notes || "",
        status: item.Status || "",
      }));
      setLeadsData(formatted);
    } catch (err) {
      console.error("Leads fetch error:", err);
    } finally {
      setLeadsLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaignData();
    fetchAllWebsiteData();
    fetchAllPaidAdsData();
    fetchAllSeoData();
    fetchLeadsData();
  }, []);

  /* ── Build overview props from live data ── */
  const overviewProps = useMemo<IOverviewDashboardProps>(
    () =>
      buildOverviewProps({
        campaignData,
        filteredCampaigns,
        filteredDaily,
        filteredTrafficSources,
        filteredPaidAds,
        campaignTable,
        seoKeywordData,
        leadsData,
        dateRange: overviewDateRange,
      }),
    [
      campaignData,
      filteredCampaigns,
      filteredDaily,
      filteredTrafficSources,
      filteredPaidAds,
      campaignTable,
      seoKeywordData,
      leadsData,
      overviewDateRange,
    ],
  );

  const handleNav = (id: string, _title: string, _sub: string) => {
    setActiveSection(id);
  };

  const handleRefreshAll = () => {
    fetchCampaignData();
    fetchAllWebsiteData();
    fetchAllPaidAdsData();
    fetchAllSeoData();
    fetchLeadsData();
  };

  const renderSection = () => {
    switch (activeSection) {
      case "overview":
        return (
          <div style={{ padding: "24px 28px" }}>
            <OverViewDashboard
              {...overviewProps}
              companyName="TechnoRUCS"
              dateRange={overviewDateRange}
              onDateRangeChange={setOverviewDateRange}
              onRefresh={handleRefreshAll}
            />
          </div>
        );

      case "linkedin":
        return <LinkedInAnalytics />;

      case "email":
        return (
          <EmailCampaignsDashboard
            campaignData={campaignData}
            filteredCampaigns={filteredCampaigns}
            loading={campaignLoading}
            error={campaignError}
            dateRange={emailDateRange}
            onDateRangeChange={setEmailDateRange}
            onRefresh={fetchCampaignData}
          />
        );

      case "website":
        return (
          <WebsiteAnalytics
            dailySummaryData={dailySummaryData}
            monthlyTrendData={monthlyTrendData}
            filteredDaily={filteredDaily}
            filteredTrafficSources={filteredTrafficSources}
            filteredPageDetails={filteredPageDetails}
            filteredCountryDetails={filteredCountryDetails}
            filteredDeviceMetrics={filteredDeviceMetrics}
            loading={websiteLoading}
            dateRange={websiteDateRange}
            onDateRangeChange={setWebsiteDateRange}
            onRefresh={fetchAllWebsiteData}
          />
        );

      case "ads":
        return (
          <PaidAdsPerformance
            filtered={filteredPaidAds}
            availablePlatforms={availablePlatforms}
            campaignTable={campaignTable}
            loading={paidAdsLoading}
            dateRange={paidAdsDateRange}
            selectedPlatform={selectedPlatform}
            onDateRangeChange={setPaidAdsDateRange}
            onPlatformChange={setSelectedPlatform}
            onRefresh={fetchAllPaidAdsData}
          />
        );

      case "seo":
        return (
          <SEOIntelligence
            keywordData={seoKeywordData}
            topPageData={seoTopPageData}
            backlinkData={seoBacklinkData}
            loading={seoLoading}
            error={seoError}
            onRefresh={fetchAllSeoData}
          />
        );

      case "leads":
        return (
          <LeadsIntelligence
            leadData={leadsData}
            loading={leadsLoading}
            onRefresh={fetchLeadsData}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f4f6fb" }}>
      <Sidebar activeSection={activeSection} onNav={handleNav} />
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div style={{ flex: 1, overflowY: "auto" }}>{renderSection()}</div>
      </div>
    </div>
  );
};

export default MainComponent;