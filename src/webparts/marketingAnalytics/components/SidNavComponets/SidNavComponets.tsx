import * as React from 'react';
import styles from './Sidebar.module.scss';
import "../../../ExternalRef/CSS/ReportsStyle.css"

const SECTIONS_META: Record<string, { title: string; sub: string }> = {
  overview: { title: 'Marketing Overview', sub: 'All channels · TechnoRUCS' },
  linkedin: { title: 'LinkedIn Analytics', sub: 'Organic performance · API Connected' },
  email: { title: 'Email Campaigns', sub: 'Campaign metrics · Excel data' },
  website: { title: 'Website Analytics', sub: 'GA4 Connected · technorucs.com' },
  ads: { title: 'Paid Ads Performance', sub: 'Google · LinkedIn · Facebook · Excel data' },
  seo: { title: 'SEO Intelligence', sub: 'GSC + Excel · Keyword & backlink data' },
  leads: { title: 'Leads Intelligence', sub: 'All sources · qualified vs junk · Excel' },
};

export interface ISidebarProps {
  activeSection: string;
  onNav: (id: string, title: string, sub: string) => void;
}

const Sidebar = ({ activeSection, onNav }: ISidebarProps) => {
  const [liveDate, setLiveDate] = React.useState('');
  const [liveTime, setLiveTime] = React.useState('');

  React.useEffect(() => {
    const tick = () => {
      const n = new Date();
      setLiveDate(
        n.toLocaleDateString('en-IN', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        })
      );
      setLiveTime(
        n.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit'
        })
      );
    };

    tick();
    const timerId = setInterval(tick, 1000);
    return () => clearInterval(timerId);
  }, []);

  const handleNav = (id: string) => {
    const info = SECTIONS_META[id];
    onNav(id, info.title, info.sub);
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sbLogo}>
        <div className={styles.sbLogoMark}>
          Techno<em>RUCS</em>
        </div>
        <div className={styles.sbLogoSub}>Marketing Analytics</div>
      </div>

      <div className={styles.sbLive}>
        <div className={styles.liveDot}></div>
        LIVE DASHBOARD
      </div>

      <nav className={styles.sbNav}>
        <div className={styles.sbSection}>Overview</div>
        <a
          className={`${styles.sbItem} ${activeSection === 'overview' ? styles.active : ''}`}
          onClick={() => handleNav('overview')}
        >
          <span className={styles.sbIcon}>⬛</span>
          Overview
        </a>

        <div className={styles.sbSection}>Channels</div>

        <a
          className={`${styles.sbItem} ${activeSection === 'linkedin' ? styles.active : ''}`}
          onClick={() => handleNav('linkedin')}
        >
          <span className={styles.sbIcon}>💼</span>
          LinkedIn
          <span className={styles.sbBadge}>Live</span>
        </a>

        <a
          className={`${styles.sbItem} ${activeSection === 'email' ? styles.active : ''}`}
          onClick={() => handleNav('email')}
        >
          <span className={styles.sbIcon}>✉️</span>
          Email Campaigns
        </a>

        <a
          className={`${styles.sbItem} ${activeSection === 'website' ? styles.active : ''}`}
          onClick={() => handleNav('website')}
        >
          <span className={styles.sbIcon}>🌐</span>
          Website Analytics
          <span className={styles.sbBadge}>GA4</span>
        </a>

        <a
          className={`${styles.sbItem} ${activeSection === 'ads' ? styles.active : ''}`}
          onClick={() => handleNav('ads')}
        >
          <span className={styles.sbIcon}>💰</span>
          Paid Ads
        </a>

        <div className={styles.sbSection}>Organic</div>

        <a
          className={`${styles.sbItem} ${activeSection === 'seo' ? styles.active : ''}`}
          onClick={() => handleNav('seo')}
        >
          <span className={styles.sbIcon}>🔍</span>
          SEO
          <span className={styles.sbBadge}>GSC</span>
        </a>

        <div className={styles.sbSection}>Pipeline</div>

        <a
          className={`${styles.sbItem} ${activeSection === 'leads' ? styles.active : ''}`}
          onClick={() => handleNav('leads')}
        >
          <span className={styles.sbIcon}>🎯</span>
          Leads
        </a>
      </nav>

      <div className={styles.sbDate}>
        <strong>{liveDate || 'Loading...'}</strong>
        <span>{liveTime || '--:--'}</span> IST · Auto-refresh 5m
      </div>
    </aside>
  );
};

export default Sidebar;
export { SECTIONS_META };