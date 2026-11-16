import * as React from "react";
import { useState, useEffect, useRef } from "react";
import styles from "./LinkedIn.module.scss";
import DateRangePicker from "../DatePicker/DatePicker";
import { Chart } from 'primereact/chart';

interface ILinkedIn {
  date: Date;
  totalFollowers: number;
  followersGained: number;
  postsPublished: number;
  profileVisits: number;
  linkClicks: number;
  reactions: number;
}
interface IPost {
  date: Date;
  topic: string;
  type: "Article" | "Video" | "Infographic" | "Carousel" | "Image" | "Poll";
  typeColor: "blue" | "violet" | "green" | "teal" | "amber" | "orange" | "rose";
  impressions: number;
  reactions: number;
  comments: number;
  reposts: number;
  clicks: number;
}
interface IWeek { label: string; weekStart: Date; weekEnd: Date; }
interface IWeekAggregate {
  label: string; weekStart: Date; weekEnd: Date;
  totalFollowers: number; followersGained: number; postsPublished: number;
  profileVisits: number; linkClicks: number; reactions: number;
  impressions: number; engagement: number;
}
interface DateRange { startDate: Date; endDate: Date; label: string; }
interface IKpi {
  icon: string; iconBg: string; label: string; value: string;
  sub: string; delta: string; deltaType: "up" | "dn" | "flat"; accent: string;
}
const LINKEDIN_DATA: ILinkedIn[] = [
  { date: new Date(2026, 0, 26), totalFollowers: 12020, followersGained: 12, postsPublished: 1, profileVisits: 260, linkClicks: 300, reactions: 150 },
  { date: new Date(2026, 0, 27), totalFollowers: 12032, followersGained: 12, postsPublished: 0, profileVisits: 250, linkClicks: 290, reactions: 145 },
  { date: new Date(2026, 0, 28), totalFollowers: 12045, followersGained: 13, postsPublished: 1, profileVisits: 255, linkClicks: 295, reactions: 148 },
  { date: new Date(2026, 0, 29), totalFollowers: 12058, followersGained: 13, postsPublished: 0, profileVisits: 270, linkClicks: 310, reactions: 155 },
  { date: new Date(2026, 0, 30), totalFollowers: 12071, followersGained: 13, postsPublished: 1, profileVisits: 265, linkClicks: 305, reactions: 152 },
  { date: new Date(2026, 1, 2), totalFollowers: 12090, followersGained: 19, postsPublished: 1, profileVisits: 275, linkClicks: 315, reactions: 160 },
  { date: new Date(2026, 1, 3), totalFollowers: 12108, followersGained: 18, postsPublished: 1, profileVisits: 280, linkClicks: 325, reactions: 165 },
  { date: new Date(2026, 1, 4), totalFollowers: 12120, followersGained: 12, postsPublished: 0, profileVisits: 270, linkClicks: 310, reactions: 155 },
  { date: new Date(2026, 1, 5), totalFollowers: 12135, followersGained: 15, postsPublished: 1, profileVisits: 285, linkClicks: 330, reactions: 168 },
  { date: new Date(2026, 1, 6), totalFollowers: 12114, followersGained: 30, postsPublished: 1, profileVisits: 330, linkClicks: 330, reactions: 172 },
  { date: new Date(2026, 1, 9), totalFollowers: 12145, followersGained: 20, postsPublished: 1, profileVisits: 270, linkClicks: 315, reactions: 157 },
  { date: new Date(2026, 1, 10), totalFollowers: 12162, followersGained: 17, postsPublished: 0, profileVisits: 265, linkClicks: 308, reactions: 153 },
  { date: new Date(2026, 1, 11), totalFollowers: 12178, followersGained: 16, postsPublished: 1, profileVisits: 272, linkClicks: 318, reactions: 159 },
  { date: new Date(2026, 1, 12), totalFollowers: 12194, followersGained: 16, postsPublished: 0, profileVisits: 268, linkClicks: 312, reactions: 156 },
  { date: new Date(2026, 1, 13), totalFollowers: 12202, followersGained: 19, postsPublished: 1, profileVisits: 295, linkClicks: 337, reactions: 165 },
  { date: new Date(2026, 1, 16), totalFollowers: 12225, followersGained: 23, postsPublished: 1, profileVisits: 300, linkClicks: 370, reactions: 183 },
  { date: new Date(2026, 1, 17), totalFollowers: 12248, followersGained: 23, postsPublished: 1, profileVisits: 302, linkClicks: 373, reactions: 184 },
  { date: new Date(2026, 1, 18), totalFollowers: 12272, followersGained: 24, postsPublished: 0, profileVisits: 310, linkClicks: 380, reactions: 188 },
  { date: new Date(2026, 1, 19), totalFollowers: 12295, followersGained: 23, postsPublished: 1, profileVisits: 298, linkClicks: 368, reactions: 182 },
  { date: new Date(2026, 1, 20), totalFollowers: 12312, followersGained: 17, postsPublished: 1, profileVisits: 290, linkClicks: 409, reactions: 183 },
  { date: new Date(2026, 1, 23), totalFollowers: 12332, followersGained: 20, postsPublished: 1, profileVisits: 292, linkClicks: 352, reactions: 170 },
  { date: new Date(2026, 1, 24), totalFollowers: 12351, followersGained: 19, postsPublished: 0, profileVisits: 285, linkClicks: 345, reactions: 167 },
  { date: new Date(2026, 1, 25), totalFollowers: 12372, followersGained: 21, postsPublished: 1, profileVisits: 295, linkClicks: 358, reactions: 173 },
  { date: new Date(2026, 1, 26), totalFollowers: 12391, followersGained: 19, postsPublished: 1, profileVisits: 288, linkClicks: 350, reactions: 169 },
  { date: new Date(2026, 1, 27), totalFollowers: 12414, followersGained: 23, postsPublished: 0, profileVisits: 300, linkClicks: 395, reactions: 171 },
  { date: new Date(2026, 2, 2), totalFollowers: 12440, followersGained: 26, postsPublished: 1, profileVisits: 320, linkClicks: 415, reactions: 208 },
  { date: new Date(2026, 2, 3), totalFollowers: 12466, followersGained: 26, postsPublished: 1, profileVisits: 322, linkClicks: 414, reactions: 207 },
  { date: new Date(2026, 2, 4), totalFollowers: 12490, followersGained: 24, postsPublished: 0, profileVisits: 315, linkClicks: 408, reactions: 203 },
  { date: new Date(2026, 2, 5), totalFollowers: 12516, followersGained: 26, postsPublished: 1, profileVisits: 323, linkClicks: 416, reactions: 208 },
  { date: new Date(2026, 2, 6), totalFollowers: 12542, followersGained: 26, postsPublished: 1, profileVisits: 460, linkClicks: 647, reactions: 224 },
  { date: new Date(2026, 2, 9), totalFollowers: 12564, followersGained: 22, postsPublished: 1, profileVisits: 312, linkClicks: 396, reactions: 197 },
  { date: new Date(2026, 2, 10), totalFollowers: 12586, followersGained: 22, postsPublished: 0, profileVisits: 308, linkClicks: 392, reactions: 195 },
  { date: new Date(2026, 2, 11), totalFollowers: 12608, followersGained: 22, postsPublished: 1, profileVisits: 314, linkClicks: 398, reactions: 198 },
  { date: new Date(2026, 2, 12), totalFollowers: 12630, followersGained: 22, postsPublished: 1, profileVisits: 310, linkClicks: 394, reactions: 196 },
  { date: new Date(2026, 2, 13), totalFollowers: 12658, followersGained: 28, postsPublished: 0, profileVisits: 336, linkClicks: 380, reactions: 174 },
  { date: new Date(2026, 2, 16), totalFollowers: 12680, followersGained: 22, postsPublished: 1, profileVisits: 330, linkClicks: 430, reactions: 230 },
  { date: new Date(2026, 2, 17), totalFollowers: 12703, followersGained: 23, postsPublished: 1, profileVisits: 332, linkClicks: 432, reactions: 231 },
  { date: new Date(2026, 2, 18), totalFollowers: 12728, followersGained: 25, postsPublished: 0, profileVisits: 338, linkClicks: 440, reactions: 235 },
  { date: new Date(2026, 2, 19), totalFollowers: 12754, followersGained: 26, postsPublished: 1, profileVisits: 342, linkClicks: 444, reactions: 237 },
  { date: new Date(2026, 2, 20), totalFollowers: 12840, followersGained: 44, postsPublished: 0, profileVisits: 558, linkClicks: 654, reactions: 267 },
];

const POST_DATA: IPost[] = [
  { date: new Date(2026, 1, 18), topic: "SharePoint EOL Checklist", type: "Article", typeColor: "blue", impressions: 18400, reactions: 342, comments: 48, reposts: 94, clicks: 620 },
  { date: new Date(2026, 2, 5), topic: "Copilot Studio Demo", type: "Video", typeColor: "violet", impressions: 14200, reactions: 281, comments: 34, reposts: 72, clicks: 480 },
  { date: new Date(2026, 1, 25), topic: "Power Platform ROI Stats", type: "Infographic", typeColor: "green", impressions: 11800, reactions: 198, comments: 27, reposts: 55, clicks: 340 },
  { date: new Date(2026, 2, 12), topic: "Healthcare Case Study", type: "Article", typeColor: "teal", impressions: 9400, reactions: 156, comments: 19, reposts: 38, clicks: 290 },
  { date: new Date(2026, 2, 3), topic: "Dynamics 365 Tips", type: "Carousel", typeColor: "amber", impressions: 8200, reactions: 134, comments: 15, reposts: 29, clicks: 220 },
  { date: new Date(2026, 2, 24), topic: "Azure Migration Guide", type: "Article", typeColor: "orange", impressions: 7100, reactions: 112, comments: 12, reposts: 24, clicks: 180 },
  { date: new Date(2026, 3, 10), topic: "Azure Migration Guide", type: "Article", typeColor: "orange", impressions: 7100, reactions: 112, comments: 12, reposts: 24, clicks: 180 },

  { date: new Date(2026, 1, 10), topic: "Azure Migration Guide", type: "Article", typeColor: "orange", impressions: 7100, reactions: 112, comments: 12, reposts: 24, clicks: 180 },
];

const C = { blue: "#1a6ef5", teal: "#0891b2", green: "#059669", amber: "#d97706", rose: "#e11d48", violet: "#7c3aed", orange: "#ea580c", navy: "#1e3a5f" };

function getMondayOf(d: Date): Date {
  const copy = new Date(d); copy.setHours(0, 0, 0, 0);
  const day = copy.getDay(); copy.setDate(copy.getDate() + (day === 0 ? -6 : 1 - day));
  return copy;
}
function generateWeeks(startDate: Date, endDate: Date): IWeek[] {
  const weeks: IWeek[] = []; let cursor = getMondayOf(startDate); let n = 1;
  while (cursor <= endDate) {
    const end = new Date(cursor); end.setDate(end.getDate() + 6);
    weeks.push({ label: `W${n}`, weekStart: new Date(cursor), weekEnd: end });
    cursor.setDate(cursor.getDate() + 7); n++;
  }
  return weeks;
}
function aggregateLinkedIn(liRows: ILinkedIn[], pRows: IPost[], weeks: IWeek[]): IWeekAggregate[] {
  return weeks.map(week => {
    const lr = liRows.filter(r => r.date >= week.weekStart && r.date <= week.weekEnd);
    const pr = pRows.filter(p => p.date >= week.weekStart && p.date <= week.weekEnd);
    return {
      label: week.label, weekStart: week.weekStart, weekEnd: week.weekEnd,
      totalFollowers: lr.length > 0 ? lr[lr.length - 1].totalFollowers : 0,
      followersGained: lr.reduce((s, r) => s + r.followersGained, 0),
      postsPublished: lr.reduce((s, r) => s + r.postsPublished, 0),
      profileVisits: lr.reduce((s, r) => s + r.profileVisits, 0),
      linkClicks: lr.reduce((s, r) => s + r.linkClicks, 0),
      reactions: lr.reduce((s, r) => s + r.reactions, 0),
      impressions: pr.reduce((s, p) => s + p.impressions, 0),
      engagement: pr.reduce((s, p) => s + p.reactions + p.comments + p.reposts, 0),
    };
  });
}
function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return n.toLocaleString("en-IN");
}
function buildKpis(weeks: IWeekAggregate[]): IKpi[] {
  const BASE = [
    { icon: "👥", iconBg: "#e8f0fe", label: "Total Followers", accent: C.blue },
    { icon: "📝", iconBg: "#ede9fe", label: "Posts Published", accent: C.violet },
    { icon: "👁", iconBg: "#e0f5fa", label: "Profile Visits", accent: C.teal },
    { icon: "🖱", iconBg: "#d1fae5", label: "Link Clicks", accent: C.green },
    { icon: "❤️", iconBg: "#fef3c7", label: "Reactions & Likes", accent: C.amber },
  ];
  if (weeks.length === 0) return BASE.map(b => ({ ...b, value: "—", sub: "No data", delta: "—", deltaType: "flat" as const }));
  const totalFollowers = weeks[weeks.length - 1].totalFollowers;
  const followersGained = weeks.reduce((s, w) => s + w.followersGained, 0);
  const firstFollowers = weeks[0].totalFollowers;
  const followerPct = firstFollowers > 0 ? (((totalFollowers - firstFollowers) / firstFollowers) * 100).toFixed(1) : "0";
  return [
    { ...BASE[0], value: totalFollowers.toLocaleString("en-IN"), sub: `+${fmt(followersGained)} gained`, delta: `▲ ${followerPct}%`, deltaType: "up" },
    { ...BASE[1], value: weeks.reduce((s, w) => s + w.postsPublished, 0).toString(), sub: `Across ${weeks.length} week${weeks.length > 1 ? "s" : ""}`, delta: "▲ 25%", deltaType: "up" },
    { ...BASE[2], value: fmt(weeks.reduce((s, w) => s + w.profileVisits, 0)), sub: "Unique visitors", delta: "▲ 18%", deltaType: "up" },
    { ...BASE[3], value: fmt(weeks.reduce((s, w) => s + w.linkClicks, 0)), sub: "Post + profile clicks", delta: "▲ 12%", deltaType: "up" },
    { ...BASE[4], value: fmt(weeks.reduce((s, w) => s + w.reactions, 0)), sub: "Across all posts", delta: "▲ 34%", deltaType: "up" },
  ];
}

function defaultRange(): DateRange {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return {
    startDate: new Date(today.getFullYear(), today.getMonth(), 1),
    endDate: today,
    label: "This Month",
  };
}

export default function LinkedInAnalytics(): JSX.Element {
  const [activeNav, setActiveNav] = useState("linkedin");
  const [kpis, setKpis] = useState<IKpi[]>([]);
  const [trendData, setTrendData] = useState<any>(null);
  const [followersData, setFollowersData] = useState<any>(null);
  const [postTypeData, setPostTypeData] = useState<any>(null);
  const [filteredPosts, setFilteredPosts] = useState<IPost[]>([]);
  const [topPost, setTopPost] = useState<IPost | null>(null);
  const [loading, setLoading] = useState(false);
  const [liveTime, setLiveTime] = useState<string>("");
  const [liveDate, setLiveDate] = useState<string>("");
  const [dateRange, setDateRange] = useState<DateRange>(defaultRange());

const postTypeOpt = {
  responsive: true,
  maintainAspectRatio: false, // 🔥 IMPORTANT
  cutout: "65%", // nice donut like first image
  plugins: {
    legend: {
      position: "right",
      labels: {
        usePointStyle: true,
        boxWidth: 8,
        padding: 12,
        font: { size: 11 }
      }
    }
  },
};
  // Live clock
  useEffect(() => {
    function tick() {
      const now = new Date();
      setLiveTime(now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }));
      setLiveDate(now.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" }));
    }
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      const weeks = generateWeeks(dateRange.startDate, dateRange.endDate);
      const aggregated = aggregateLinkedIn(LINKEDIN_DATA, POST_DATA, weeks);
      const posts = POST_DATA
        .filter(p => p.date >= dateRange.startDate && p.date <= dateRange.endDate)
        .sort((a, b) => b.impressions - a.impressions);

      setKpis(buildKpis(aggregated));
      setFilteredPosts(posts);
      setTopPost(posts[0] ?? null);

      const labels = aggregated.map(w => w.label);

     setTrendData({
  labels,
  datasets: [
    {
      label: "Impressions",
      data: aggregated.map(w => w.impressions),
      backgroundColor: "rgba(26,110,245,0.15)",
      borderColor: "#1a6ef5",
      borderWidth: 2,
      borderRadius: 6,
      barThickness: 26,
      categoryPercentage: 0.6,
      barPercentage: 0.8,
      yAxisID: "y",
    },
    {
      label: "Engagement",
      data: aggregated.map(w => w.engagement),
      backgroundColor: "#059669",
      borderRadius: 6,
      barThickness: 26,
      categoryPercentage: 0.6,
      barPercentage: 0.8,
      yAxisID: "y1",
    },
  ],
});
      setFollowersData({
        labels,
        datasets: [{ label: "Followers Gained", data: aggregated.map(w => w.followersGained), backgroundColor: C.blue, borderRadius: 6 }],

      });

      const typeCounts: Record<string, number> = {};
      posts.forEach(p => { typeCounts[p.type] = (typeCounts[p.type] || 0) + 1; });
      const typeLabels = Object.keys(typeCounts);
      setPostTypeData({
        labels: typeLabels.length ? typeLabels : ["No Data"],
        datasets: [{
          data: typeLabels.length ? typeLabels.map(l => typeCounts[l]) : [1],
          backgroundColor: [C.blue, C.violet, C.rose, C.amber, C.teal, C.orange].slice(0, Math.max(typeLabels.length, 1)),
          borderWidth: 0, hoverOffset: 6,
        }],
        
      });
      console.log(trendData, "tren")
      setLoading(false);
    }, 250);
    return () => clearTimeout(timer);
  }, [dateRange]);

 const trendOpt = {
  responsive: true,
  maintainAspectRatio: false,

  plugins: {
    legend: {
      position: "top",
      labels: {
        usePointStyle: true,
        boxWidth: 8,
        padding: 12,
        font: {
          size: 11,
          weight: "500",
        },
      },
    },
  },

  scales: {
    x: {
      grid: {
        display: false,
      },
      ticks: {
        color: "#64748b",
        font: { size: 11 },
      },
    },

    y: {
      position: "left",
      grid: {
        color: "rgba(226,232,240,0.7)",
      },
      ticks: {
        color: "#64748b",
        font: { size: 11 },
      },
    },

    y1: {
      position: "right",
      grid: {
        drawOnChartArea: false,
      },
      ticks: {
        color: "#64748b",
        font: { size: 11 },
      },
    },
  },
};
  const followersOpt = {
    responsive: true, maintainAspectRatio: true,
    plugins: { legend: { display: false } },
    scales: { y: { grid: { color: "rgba(226,232,242,.8)" } }, x: { grid: { display: false } } },
    maxBarThickness: 40,
  };



  // Page title map
  const PAGE_TITLES: Record<string, { title: string; sub: string }> = {
    overview: { title: "Marketing Overview", sub: "All channels · TechnoRUCS" },
    linkedin: { title: "LinkedIn Analytics", sub: "Organic performance · TechnoRUCS" },
    email: { title: "Email Campaigns", sub: "Campaign performance · TechnoRUCS" },
    website: { title: "Website Analytics", sub: "GA4 data · TechnoRUCS" },
    ads: { title: "Paid Ads", sub: "Ad performance · TechnoRUCS" },
    seo: { title: "SEO", sub: "Search Console data · TechnoRUCS" },
    leads: { title: "Leads", sub: "Pipeline · TechnoRUCS" },
  };
  const { title: pageTitle, sub: pageSub } = PAGE_TITLES[activeNav] || PAGE_TITLES.linkedin;

  return (
    <>

      <main className={styles['li-main']}>

        <header className={styles['li-topbar']}>
          <div className={styles['li-topbar-left']}>
            <div>
              <div className={styles['li-page-title']}>{pageTitle}</div>
              <div className={styles['li-page-sub']}>{pageSub}</div>
            </div>
          </div>
          <div className={styles['li-topbar-right']}>
            <DateRangePicker value={dateRange} onChange={setDateRange} maxDate={new Date()} />
            <button className={styles['li-connect-btn']}>🔗 Connect Sources</button>
            <button className={styles['li-refresh-btn']} onClick={() => setDateRange(r => ({ ...r }))}>↻ Refresh</button>
          </div>
        </header>

        {/* Content */}
        <div className={styles['li-content']}>

          {/* Section header */}
          <div className={styles['li-sec-header']}>
            <div className={styles['li-sec-title-wrap']}>
              <div className={styles['li-sec-icon']} style={{ background: "var(--blue-lt)" }}>💼</div>
              <div>
                <div className={styles['li-sec-title']}>LinkedIn Analytics</div>
                <div className={styles['li-sec-sub']}>Organic performance · Connected via LinkedIn API</div>
              </div>
            </div>
            <div className={styles['li-sec-actions']}>
              <span className={styles['li-source-badge']}>🔗 LinkedIn Connected</span>
            </div>
          </div>

          {/* Loading bar */}
          {loading && (
            <div className={styles['li-loading-bar']}>
              <div className={styles['li-loading-fill']} />
            </div>
          )}


          <div className={styles["li-g5"]}>
            {kpis.map(k => (
              <div key={k.label} className={styles["li-kpi"]}>

                <div className={styles["li-kpi-top"]}>
                  <div
                    className={styles["li-kpi-icon"]}
                    style={{ background: k.iconBg }}
                  >
                    {k.icon}
                  </div>

                  <div className={`${styles["li-kpi-delta"]} ${styles[k.deltaType]}`}>
                    {k.delta}
                  </div>
                </div>

                <div className={styles["li-kpi-label"]}>{k.label}</div>

                <div className={styles["li-kpi-val"]}>{k.value}</div>

                <div className={styles["li-kpi-sub"]}>{k.sub}</div>

                <div
                  className={styles["li-kpi-accent"]}
                  style={{ background: k.accent }}
                />
              </div>
            ))}
          </div>


          {/* Charts */}
          {trendData && followersData && (
            <div className={`${styles["li-g-wide"]} ${styles["li-mt"]}`}>

              <div className={styles["li-card"]}>
                <div className={styles["li-card-head"]}>
                  <div>
                    <div className={styles["li-card-title"]}>
                      Impressions & Engagement Trend
                    </div>
                    <div className={styles["li-card-sub"]}>
                      Weekly LinkedIn organic performance
                    </div>
                  </div>
                </div>
                <Chart
                  type="bar"
                  data={trendData}
                  options={trendOpt}
                  style={{ height: "220px" }}
                />

                {/* <BarLineChart data={trendData} options={trendOpt} /> */}
              </div>

              <div className={styles["li-card"]}>
                <div className={styles["li-card-head"]}>
                  <div>
                    <div className={styles["li-card-title"]}>Follower Growth</div>
                    <div className={styles["li-card-sub"]}>
                      Net new followers weekly
                    </div>
                  </div>
                </div>
                <Chart
                  type="bar"
                  data={followersData}
                  options={followersOpt}
                  style={{ height: "220px" }}
                />
              </div>

            </div>
          )}
          <div className={`${styles["li-g2"]} ${styles["li-mt"]}`}>
            <div>
              <div className={styles["li-top-post"]}>

                {topPost ? (
                  <>
                    <div className={styles["li-post-label"]}>
                      🏆 Top Post This Period
                    </div>

                    <div className={styles["li-post-title"]}>
                      "{topPost.topic}"
                    </div>

                   <div className={styles["li-post-stats"]}>
  <span>👁 {fmt(topPost.impressions)} impressions</span>
  <span>❤️ {topPost.reactions} reactions</span>
  <span>💬 {topPost.comments} comments</span>
  <span>🔁 {topPost.reposts} reposts</span>
</div>
                  </>
                ) : (
                  <>
                    <div className={styles["li-post-label"]}>🏆 Top Post</div>
                    <div className={styles["li-post-title"]}>
                      No posts in selected range
                    </div>
                  </>
                )}
              </div>

              {postTypeData && (
                <div className={`${styles["li-card"]} ${styles["li-mt"]}`}>

                  <div className={styles["li-card-head"]}>
                    <div>
                      <div className={styles["li-card-title"]}>
                        Post Type Performance
                      </div>

                      <div className={styles["li-card-sub"]}>
                        Engagement by content type
                      </div>
                    </div>
                  </div>

                  <div className={styles["li-donut-wrap"]}>
  <Chart
    type="doughnut"
    data={postTypeData}
    options={postTypeOpt}
  />
</div>

                </div>
              )}
            </div>
            <div className={styles["li-card"]}>

              <div className={styles["li-card-head"]}>
                <div>
                  <div className={styles["li-card-title"]}>
                    Post Performance Detail
                  </div>

                  <div className={styles["li-card-sub"]}>
                    {filteredPosts.length} post
                    {filteredPosts.length !== 1 ? "s" : ""} · sorted by reach
                  </div>
                </div>
              </div>
              {filteredPosts.length > 0 ? (

                <table className={styles["li-tbl"]}>

                  <thead>
                    <tr>
                      <th>Post Topic</th>
                      <th>Type</th>
                      <th>Impressions</th>
                      <th>Reactions</th>
                      <th>Clicks</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredPosts.map((p, i) => (

                      <tr key={i}>
                        <td>
                          <strong>{p.topic}</strong>
                        </td>

                        <td>
                          <span
                            className={`${styles["li-pill"]} ${styles[`li-pill-${p.typeColor}`]}`}
                          >
                            {p.type}
                          </span>
                        </td>

                        <td>{fmt(p.impressions)}</td>

                        <td>{p.reactions}</td>

                        <td>{p.clicks}</td>
                      </tr>

                    ))}
                  </tbody>

                </table>

              ) : (

                <div className={styles["li-empty-state"]}>
                  📭 No posts found for the selected date range.
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}