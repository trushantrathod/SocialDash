import React, { useEffect, useMemo, useRef, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Line, Doughnut, Bar, Radar } from 'react-chartjs-2';
import 'chart.js/auto';
import toast, { Toaster } from 'react-hot-toast';
import { db } from './firebase';
import { useUserAuth } from './context/AuthContext';
import './App.css';

/* -------------------------------------------------------------------------- */
/*                               ICON LIBRARY                                 */
/* -------------------------------------------------------------------------- */

const Icon = {
  Play: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5.14v13.72a1 1 0 0 0 1.54.84l10.06-6.86a1 1 0 0 0 0-1.68L9.54 4.3A1 1 0 0 0 8 5.14Z" />
    </svg>
  ),
  ArrowRight: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" /><path d="m13 6 6 6-6 6" />
    </svg>
  ),
  ArrowUpRight: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 17 17 7" /><path d="M7 7h10v10" />
    </svg>
  ),
  Menu: ({ size = 22 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M4 6h16" /><path d="M4 12h16" /><path d="M4 18h16" />
    </svg>
  ),
  X: ({ size = 22 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="m6 6 12 12" /><path d="m18 6-12 12" />
    </svg>
  ),
  Youtube: ({ size = 22, fill = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill}>
      <path d="M23.5 6.19a3.01 3.01 0 0 0-2.12-2.13C19.51 3.56 12 3.56 12 3.56s-7.51 0-9.38.5A3.01 3.01 0 0 0 .5 6.19C0 8.07 0 12 0 12s0 3.93.5 5.81a3.01 3.01 0 0 0 2.12 2.13c1.87.5 9.38.5 9.38.5s7.51 0 9.38-.5a3.01 3.01 0 0 0 2.12-2.13C24 15.93 24 12 24 12s0-3.93-.5-5.81Z" />
      <path d="m9.55 15.57 6.27-3.57-6.27-3.57v7.14Z" fill="#fff" />
    </svg>
  ),
  Instagram: ({ size = 22 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="2.5" y="2.5" width="19" height="19" rx="5" />
      <circle cx="12" cy="12" r="4.3" />
      <circle cx="17.3" cy="6.8" r="1" fill="currentColor" stroke="none" />
    </svg>
  ),
  Facebook: ({ size = 22 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07c0 6.02 4.39 11 10.13 11.93v-8.44H7.08v-3.49h3.05V9.72c0-3.03 1.79-4.7 4.53-4.7 1.31 0 2.68.24 2.68.24v2.96h-1.51c-1.49 0-1.96.93-1.96 1.88v2.27h3.34l-.53 3.49h-2.81V24C19.61 23.07 24 18.09 24 12.07Z" />
    </svg>
  ),
  Grid: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
      <rect x="3" y="3" width="7" height="7" rx="1.4" /><rect x="14" y="3" width="7" height="7" rx="1.4" /><rect x="3" y="14" width="7" height="7" rx="1.4" /><rect x="14" y="14" width="7" height="7" rx="1.4" />
    </svg>
  ),
  Brain: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
      <path d="M9.5 3A2.5 2.5 0 0 0 7 5.5v.4A3.2 3.2 0 0 0 4.2 9a3 3 0 0 0 1.1 5.75A3 3 0 0 0 8.6 19a2.4 2.4 0 0 0 2.4 2V6a3 3 0 0 0-1.5-3Z" />
      <path d="M14.5 3A2.5 2.5 0 0 1 17 5.5v.4A3.2 3.2 0 0 1 19.8 9a3 3 0 0 1-1.1 5.75A3 3 0 0 1 15.4 19a2.4 2.4 0 0 1-2.4 2V6a3 3 0 0 1 1.5-3Z" />
      <path d="M8.2 9.3h2.4M13.4 9.3h2.4M8.8 13.1h1.8M13.4 13.1h1.8" />
    </svg>
  ),
  Dollar: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round">
      <path d="M12 1v22" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  Zap: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m13 2-9 12h7l-1 8 9-12h-7l1-8Z" />
    </svg>
  ),
  Settings: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .32 1.81l.06.06-2.83 2.83-.06-.06A1.65 1.65 0 0 0 15 19.4a1.65 1.65 0 0 0-1 .6 1.65 1.65 0 0 0-.51 1.2V21h-4v-.09A1.65 1.65 0 0 0 8.5 19.4a1.65 1.65 0 0 0-1.81.32l-.06.06-2.83-2.83.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-.6-1H4a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.32-1.81l-.06-.06 2.83-2.83.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-.6A1.65 1.65 0 0 0 10.5 2.8V2h4v.8A1.65 1.65 0 0 0 15 4.6a1.65 1.65 0 0 0 1.81-.32l.06-.06 2.83 2.83-.06.06A1.65 1.65 0 0 0 19.4 9c.17.62.73 1 1.4 1h.2v4h-.2c-.67 0-1.23.38-1.4 1Z" />
    </svg>
  ),
  LogOut: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  Users: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M16 20v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 20v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  Eye: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M1.5 12S5.5 4 12 4s10.5 8 10.5 8S18.5 20 12 20 1.5 12 1.5 12Z" /><circle cx="12" cy="12" r="3" />
    </svg>
  ),
  Video: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" />
    </svg>
  ),
  Globe: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z" />
    </svg>
  ),
  Star: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.86L12 17.77l-6.18 3.23L7 14.14l-5-4.87 6.91-1.01L12 2Z" /></svg>
  ),
  ChevronRight: ({ size = 15 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="9 18 15 12 9 6" /></svg>
  ),
  Switch: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
    </svg>
  ),
  Lock: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  ),
  Check: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m5 12 4 4L19 6" />
    </svg>
  ),
  EyeOn: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" />
    </svg>
  ),
  EyeOff: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="m3 3 18 18" /><path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" /><path d="M9.9 5.2A10.6 10.6 0 0 1 12 5c6.5 0 10 7 10 7a18 18 0 0 1-3.1 4.2" /><path d="M6.1 6.2C3.5 8.2 2 12 2 12s3.5 7 10 7c1.7 0 3.2-.4 4.5-1.1" />
    </svg>
  ),
  Spark: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="m12 2 1.2 5.2L18 9l-4.8 1.8L12 16l-1.2-5.2L6 9l4.8-1.8L12 2Z" /><path d="m19 14 .7 2.3L22 17l-2.3.7L19 20l-.7-2.3L16 17l2.3-.7L19 14Z" />
    </svg>
  ),
};

/* -------------------------------------------------------------------------- */
/*                              HELPER COMPONENTS                             */
/* -------------------------------------------------------------------------- */

function AnimatedNumber({ value = 0, prefix = '', suffix = '', duration = 1200 }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const numericValue = Number(value) || 0;
    let frame = 0;
    const start = performance.now();
    const animate = (time) => {
      const progress = Math.min((time - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setDisplay(Math.round(numericValue * eased));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);

  return <>{prefix}{display.toLocaleString()}{suffix}</>;
}

function AppLogo({ compact = false }) {
  return (
    <div className={`app-logo ${compact ? 'compact' : ''}`}>
      <div className="app-logo-mark" aria-hidden="true">
        <svg
          className="logo-orbit-svg"
          width={compact ? 18 : 22}
          height={compact ? 18 : 22}
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle className="logo-core" cx="12" cy="12" r="3.1" fill="currentColor" />
          <ellipse className="logo-orbit logo-orbit-a" cx="12" cy="12" rx="8.7" ry="4.2" stroke="currentColor" strokeWidth="1.5" />
          <ellipse className="logo-orbit logo-orbit-b" cx="12" cy="12" rx="8.7" ry="4.2" stroke="currentColor" strokeWidth="1.5" transform="rotate(60 12 12)" />
          <circle className="logo-node node-a" cx="19.1" cy="10.3" r="1.35" fill="currentColor" />
          <circle className="logo-node node-b" cx="7.1" cy="5.7" r="1.35" fill="currentColor" />
          <circle className="logo-node node-c" cx="10.5" cy="18.8" r="1.35" fill="currentColor" />
        </svg>
      </div>
      <span>Social<span>Dash</span></span>
    </div>
  );
}

function BackgroundFX({ landing = false }) {
  return (
    <div className={`background-fx ${landing ? 'landing-fx' : ''}`} aria-hidden="true">
      <div className="fx-orb fx-orb-a" />
      <div className="fx-orb fx-orb-b" />
      <div className="fx-orb fx-orb-c" />
      <div className="fx-grid" />
      <div className="fx-noise" />
    </div>
  );
}

function FeatureCard({ icon, eyebrow, title, text, index }) {
  const visuals = [
    <div className="feature-visual analytics-visual" aria-hidden="true">
      <div className="feature-stat-row">
        <div><small>Subscribers</small><strong>128.4K</strong><b>+3.2%</b></div>
        <div><small>Views</small><strong>4.82M</strong><b>+8.7%</b></div>
        <div><small>Reach</small><strong>6.12M</strong><b>+5.1%</b></div>
      </div>
      <svg className="feature-sparkline" viewBox="0 0 680 130" preserveAspectRatio="none">
        <defs>
          <linearGradient id="featureLineFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ff2d1b" stopOpacity=".28" />
            <stop offset="1" stopColor="#ff2d1b" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M0 108 C65 100 80 88 130 92 S220 83 260 68 S338 74 385 55 S470 54 520 39 S615 31 680 12 V130 H0Z" fill="url(#featureLineFill)" />
        <path d="M0 108 C65 100 80 88 130 92 S220 83 260 68 S338 74 385 55 S470 54 520 39 S615 31 680 12" fill="none" stroke="#ff2d1b" strokeWidth="3.2" strokeLinecap="round" />
      </svg>
    </div>,

    <div className="feature-visual audience-visual" aria-hidden="true">
      <div className="audience-bars">
        <div><span>Creator tools</span><b>72%</b><i><em style={{ width: '72%' }} /></i></div>
        <div><span>Editing workflow</span><b>58%</b><i><em style={{ width: '58%' }} /></i></div>
        <div><span>New uploads</span><b>49%</b><i><em style={{ width: '49%' }} /></i></div>
        <div><span>Gear & setup</span><b>35%</b><i><em style={{ width: '35%' }} /></i></div>
      </div>
    </div>,

    <div className="feature-visual money-mini-visual" aria-hidden="true">
      <small>ESTIMATED INTEGRATION</small>
      <strong>$24,800</strong>
      <span>based on historical viewership signals</span>
      <div className="money-mini-bars">
        <i style={{ height: '36%' }} /><i style={{ height: '55%' }} /><i style={{ height: '47%' }} /><i style={{ height: '70%' }} /><i style={{ height: '62%' }} /><i style={{ height: '87%' }} /><i style={{ height: '100%' }} />
      </div>
    </div>
  ];

  return (
    <article className={`feature-card feature-card-${index + 1} reveal-card`} style={{ '--delay': `${index * 70}ms` }}>
      <div className="feature-card-head">
        <div className="feature-icon">{icon}</div>
        <div className="feature-eyebrow">{eyebrow}</div>
      </div>
      <h3>{title}</h3>
      <p>{text}</p>
      {visuals[index] || null}
      {index === 3 && (
        <div className="command-tabs" aria-hidden="true">
          <span>Overview</span>
          <span>Audience AI</span>
          <span>Monetization</span>
        </div>
      )}
      <div className="feature-line" />
    </article>
  );
}

function MiniDashboardPreview() {
  const bars = [52, 68, 44, 79, 62, 91, 73, 97, 84, 100];
  return (
    <div className="hero-dashboard-shell">
      <div className="preview-glow" />
      <div className="preview-window">
        <div className="preview-topbar">
          <div className="preview-brand">
            <div className="tiny-dot red" />
            <div className="tiny-dot amber" />
            <div className="tiny-dot green" />
            <span>Creator HQ</span>
          </div>
          <div className="preview-live"><span /> LIVE SYNC</div>
        </div>

        <div className="preview-body">
          <div className="preview-sidebar">
            <div className="preview-sidebar-logo"><Icon.Play size={11} /></div>
            <div className="preview-side-line active" />
            <div className="preview-side-line" />
            <div className="preview-side-line" />
            <div className="preview-side-line" />
            <div className="preview-side-line short" />
          </div>

          <div className="preview-main">
            <div className="preview-heading-row">
              <div>
                <div className="preview-kicker">YOUTUBE ANALYTICS</div>
                <div className="preview-title">Creator Performance</div>
              </div>
              <div className="preview-sync">Updated just now</div>
            </div>

            <div className="preview-stats">
              {[
                ['Subscribers', '128,420', '+3.2%'],
                ['Views', '4.82M', '+8.7%'],
                ['Published', '214', '+1.4%'],
                ['Reach', '6.12M', '+5.1%'],
              ].map(([label, value, delta]) => (
                <div className="preview-stat" key={label}>
                  <div className="preview-stat-label">{label}</div>
                  <div className="preview-stat-value">{value}</div>
                  <div className="preview-stat-delta">{delta}</div>
                </div>
              ))}
            </div>

            <div className="preview-grid">
              <div className="preview-panel preview-chart-panel">
                <div className="preview-panel-header">
                  <div>
                    <strong>Live Velocity</strong>
                    <small>Subscriber trajectory</small>
                  </div>
                  <span className="preview-chip">REAL-TIME</span>
                </div>
                <div className="preview-chart">
                  <svg viewBox="0 0 700 220" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="previewFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0" stopColor="#ff2d1b" stopOpacity="0.34" />
                        <stop offset="1" stopColor="#ff2d1b" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d="M0 196 C70 184 98 164 142 170 S220 152 268 142 S346 120 390 132 S462 92 505 102 S588 58 700 28 V220 H0Z" fill="url(#previewFill)" />
                    <path d="M0 196 C70 184 98 164 142 170 S220 152 268 142 S346 120 390 132 S462 92 505 102 S588 58 700 28" fill="none" stroke="#ff2d1b" strokeWidth="4" strokeLinecap="round" />
                  </svg>
                  <div className="preview-chart-bars">
                    {bars.map((height, i) => <span key={i} style={{ height: `${height}%` }} />)}
                  </div>
                </div>
              </div>

              <div className="preview-panel">
                <div className="preview-panel-header">
                  <div>
                    <strong>Audience AI</strong>
                    <small>Comment intelligence</small>
                  </div>
                  <Icon.Brain size={15} />
                </div>
                <div className="ai-score">
                  <div className="ai-score-ring"><span>82</span></div>
                  <div>
                    <div className="ai-score-title">Channel Health</div>
                    <div className="ai-score-copy">High audience momentum</div>
                  </div>
                </div>
                <div className="sentiment-mini">
                  <div><span>Positive</span><b>71%</b></div>
                  <div className="sentiment-track"><i style={{ width: '71%' }} /></div>
                  <div><span>Neutral</span><b>20%</b></div>
                  <div className="sentiment-track"><i style={{ width: '20%' }} /></div>
                  <div><span>Negative</span><b>9%</b></div>
                  <div className="sentiment-track"><i style={{ width: '9%' }} /></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LandingPage({ onLogin, onGetStarted }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setMobileOpen(false);
  };

  return (
    <div className="public-page">
      <BackgroundFX landing />

      <header className="public-nav">
        <div className="public-nav-inner">
          <button className="nav-logo-button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <AppLogo />
          </button>

          <nav className={`public-links ${mobileOpen ? 'open' : ''}`}>
            <button onClick={() => scrollTo('features')}>Features</button>
            <button onClick={() => scrollTo('intelligence')}>Audience AI</button>
            <button onClick={() => scrollTo('monetization')}>Monetization</button>
            <button onClick={() => scrollTo('workflow')}>How it works</button>
            <div className="mobile-nav-actions">
              <button className="nav-login" onClick={onLogin}>Login</button>
              <button className="nav-cta" onClick={onGetStarted}>Get Started <Icon.ArrowRight size={16} /></button>
            </div>
          </nav>

          <div className="desktop-nav-actions">
            <button className="nav-login" onClick={onLogin}>Login</button>
            <button className="nav-cta" onClick={onGetStarted}>Get Started <Icon.ArrowRight size={16} /></button>
          </div>

          <button
            className="mobile-menu"
            onClick={() => setMobileOpen(v => !v)}
            aria-label="Toggle menu"
            type="button"
          >
            <span className="mobile-menu-icon">
              {mobileOpen ? <Icon.X size={22} /> : <Icon.Menu size={22} />}
            </span>
          </button>
        </div>
      </header>

      <main>
        <section className="hero-section">
          <div className="hero-copy">
            <div className="hero-badge">
              <span className="badge-pulse" />
              BUILT FOR THE NEXT GENERATION OF CREATORS
            </div>

            <h1>
              Turn your content
              <span> into a growth system.</span>
            </h1>

            <p className="hero-description">
              SocialDash brings live social media analytics, audience intelligence,
              content insights and monetization estimates into one beautifully
              designed creator workspace.
            </p>

            <div className="hero-actions">
              <button className="hero-primary" onClick={onGetStarted}>
                Start building your advantage
                <Icon.ArrowRight size={18} />
              </button>
              <button className="hero-secondary" onClick={() => scrollTo('features')}>
                <span className="play-circle"><Icon.Play size={12} /></span>
                Explore the platform
              </button>
            </div>

            <div className="hero-proof-row">
              <div className="proof-item"><span className="proof-check"><Icon.Check size={12} /></span>Live API analytics</div>
              <div className="proof-item"><span className="proof-check"><Icon.Check size={12} /></span>Audience AI</div>
              <div className="proof-item"><span className="proof-check"><Icon.Check size={12} /></span>Monetization</div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="floating-metric floating-left">
              <span className="metric-orb"><Icon.Users size={15} /></span>
              <div><small>Subscribers</small><strong>128.4K</strong><b>+3.2%</b></div>
            </div>

            <div className="floating-metric floating-right">
              <span className="metric-orb purple"><Icon.Brain size={15} /></span>
              <div><small>Audience AI</small><strong>82 / 100</strong><b>Healthy</b></div>
            </div>

            <MiniDashboardPreview />
          </div>
        </section>

        <section className="creator-strip">
          <div className="creator-strip-inner">
            <span>ONE WORKSPACE FOR</span>
            <div><Icon.Youtube size={17} /> YouTube</div>
            <div><Icon.Instagram size={17} /> Instagram</div>
            <div><Icon.Facebook size={17} /> Meta</div>
            <div className="strip-divider" />
            <span>LIVE DATA • AI • MONETIZATION</span>
          </div>
        </section>

        <section id="features" className="section-shell">
          <div className="section-intro">
            <div className="section-tag">WHAT'S INSIDE</div>
            <h2>Everything you need to understand what is happening behind your content.</h2>
            <p>
              SocialDash is more than a dashboard. It connects performance data,
              audience behavior and commercial insight into one continuous workflow.
            </p>
          </div>

          <div className="feature-grid">
            <FeatureCard
              index={0}
              icon={<Icon.Youtube size={20} />}
              eyebrow="01 • LIVE ANALYTICS"
              title="Live Creator Analytics"
              text="Track subscribers, views, published assets and projected reach with live API synchronization and historical trajectory data."
            />
            <FeatureCard
              index={1}
              icon={<Icon.Brain size={20} />}
              eyebrow="02 • AUDIENCE AI"
              title="Audience AI"
              text="Use DBSCAN topic clustering and VADER sentiment analysis to understand what your audience is actually saying."
            />
            <FeatureCard
              index={2}
              icon={<Icon.Dollar size={20} />}
              eyebrow="03 • MONETIZATION"
              title="Monetization Intelligence"
              text="Estimate sponsorship value from viewership signals and explore story, dedicated and series deal scenarios."
            />
            <FeatureCard
              index={3}
              icon={<Icon.Zap size={20} />}
              eyebrow="04 • CREATOR WORKSPACE"
              title="Creator Command Center"
              text="Switch between Overview, Audience AI and Monetization without losing context. Your connected workspace stays ready whenever you return."
            />
          </div>
        </section>

        <section id="intelligence" className="dark-section">
          <div className="section-shell intelligence-layout">
            <div className="intelligence-copy">
              <div className="section-tag red">AUDIENCE AI</div>
              <h2>Your comments are a source of strategy.</h2>
              <p>
                SocialDash turns audience conversations into a signal you can use.
                Topic clusters surface recurring themes, while sentiment analysis
                shows whether the audience reaction is moving in a healthy direction.
              </p>

              <div className="intelligence-bullets">
                <div><span><Icon.Check size={13} /></span><strong>DBSCAN topic clustering</strong><small>Group similar comments into meaningful themes.</small></div>
                <div><span><Icon.Check size={13} /></span><strong>VADER sentiment analysis</strong><small>See positive, neutral and negative reaction at a glance.</small></div>
                <div><span><Icon.Check size={13} /></span><strong>Keyword discovery</strong><small>Spot the words and subjects repeatedly showing up.</small></div>
              </div>
            </div>

            <div className="intelligence-visual glass-surface">
              <div className="ai-window-head">
                <div><span className="ai-status-dot" /> Audience intelligence</div>
                <span className="ai-live-chip">LIVE MODEL</span>
              </div>

              <div className="ai-main-score">
                <div className="ai-big-ring"><span>82</span><small>health</small></div>
                <div>
                  <small>Channel Health</small>
                  <strong>Strong audience momentum</strong>
                  <p>7 active conversation clusters detected</p>
                </div>
              </div>

              <div className="ai-cluster-list">
                {[
                  ['Creator tools', 72, '#ff2d1b'],
                  ['Editing workflow', 58, '#8b5cf6'],
                  ['New uploads', 49, '#3b82f6'],
                  ['Gear & setup', 35, '#10b981'],
                ].map(([name, amount, color]) => (
                  <div key={name} className="ai-cluster-row">
                    <div><span className="cluster-bullet" style={{ background: color }} />{name}</div>
                    <b>{amount}%</b>
                    <span className="cluster-line"><i style={{ width: `${amount}%`, background: color }} /></span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="monetization" className="section-shell monetization-section">
          <div className="monetization-card">
            <div className="money-glow" />
            <div className="money-copy">
              <div className="section-tag green">MONETIZATION INTELLIGENCE</div>
              <h2>Know what your audience could be worth.</h2>
              <p>
                SocialDash uses your channel's historical performance to create a
                sponsorship benchmark for brand integrations, dedicated videos and
                larger series opportunities.
              </p>

              <div className="money-checks">
                <div><Icon.Check size={13} />Average views per video</div>
                <div><Icon.Check size={13} />Industry CPM baseline</div>
                <div><Icon.Check size={13} />Platform multiplier</div>
              </div>
            </div>

            <div className="money-visual">
              <div className="money-label">ESTIMATED BRAND DEAL VALUE</div>
              <div className="money-value"><span>$</span>6,450</div>
              <div className="money-sub">per sponsored integration</div>
              <div className="money-tiers">
                <div><small>Story mention</small><strong>$1,290</strong></div>
                <div className="active"><small>Dedicated video</small><strong>$6,450</strong></div>
                <div><small>Series deal</small><strong>$19,350</strong></div>
              </div>
            </div>
          </div>
        </section>

        <section id="workflow" className="section-shell workflow-section">
          <div className="section-intro center">
            <div className="section-tag">HOW IT WORKS</div>
            <h2>From channel connection to creator decisions in minutes.</h2>
          </div>

          <div className="workflow-grid">
            {[
              ['01', 'Create your workspace', 'Login, initialize your creator space and keep your analytics isolated to your account.'],
              ['02', 'Connect your source', 'Connect a YouTube channel ID and sync your latest channel performance.'],
              ['03', 'Explore intelligence', 'Move from performance to audience AI and monetization without changing tools.'],
              ['04', 'Act on the signal', 'Use the insights to guide content direction, audience understanding and commercial conversations.'],
            ].map(([n, title, text]) => (
              <div className="workflow-step" key={n}>
                <div className="workflow-number">{n}</div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="final-cta-section">
          <div className="final-cta-card">
            <div className="cta-spark"><Icon.Spark size={21} /></div>
            <div>
              <div className="section-tag red">CREATOR HQ</div>
              <h2>Stop guessing. Start creating with context.</h2>
              <p>Your next growth decision should begin with the data already inside your content.</p>
            </div>
            <button onClick={onGetStarted}>Enter SocialDash <Icon.ArrowUpRight size={17} /></button>
          </div>
        </section>
      </main>

      <footer className="public-footer">
        <div className="public-footer-inner">
          <AppLogo compact />
          <span>Creator intelligence, all in one place.</span>
          <span>© {new Date().getFullYear()} SocialDash</span>
        </div>
      </footer>
    </div>
  );
}


function friendlyAuthError(error, mode = 'login') {
  const code = error?.code || '';
  const raw = String(error?.message || '').toLowerCase();

  if (
    code === 'auth/invalid-credential' ||
    code === 'auth/wrong-password' ||
    code === 'auth/user-not-found' ||
    raw.includes('invalid-credential') ||
    raw.includes('wrong-password') ||
    raw.includes('user-not-found')
  ) {
    return 'Incorrect email or password. Please check your details and try again.';
  }

  if (code === 'auth/invalid-email') return 'Please enter a valid email address.';
  if (code === 'auth/email-already-in-use') return 'An account with this email already exists. Try logging in instead.';
  if (code === 'auth/weak-password') return 'Your password is too weak. Use at least 6 characters.';
  if (code === 'auth/too-many-requests') return 'Too many attempts. Please wait a moment and try again.';
  if (code === 'auth/network-request-failed') return 'Network error. Check your internet connection and try again.';

  return mode === 'signup'
    ? 'We could not create your account. Please try again.'
    : 'We could not sign you in. Please check your details and try again.';
}

function AuthPage({ isRegistering, setIsRegistering, onSuccess }) {
  const { login, signup, resetPassword } = useUserAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);

  const submit = async (event) => {
    event.preventDefault();

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      toast.error('Please enter your email and password.');
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      toast.error('Enter a valid email address.');
      return;
    }

    try {
      setBusy(true);
      if (isRegistering) {
        if (password.length < 6) {
          toast.error('Password must contain at least 6 characters.');
          return;
        }
        await signup(cleanEmail, password);
        toast.success('Workspace created successfully.');
      } else {
        await login(cleanEmail, password);
        toast.success('Welcome back.');
      }
      onSuccess?.();
    } catch (error) {
      toast.error(friendlyAuthError(error, isRegistering ? 'signup' : 'login'));
    } finally {
      setBusy(false);
    }
  };

  const sendReset = async () => {
    if (!email.trim()) {
      toast.error('Enter your email address first.');
      return;
    }
    try {
      setBusy(true);
      await resetPassword(email.trim());
      toast.success('Password reset email sent.');
      setForgotMode(false);
    } catch (error) {
      const message = error?.code === 'auth/user-not-found'
        ? 'No account was found with this email address.'
        : friendlyAuthError(error, 'login');
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <BackgroundFX />
      <div className="auth-shell">
        <div className="auth-showcase">
          <div className="auth-showcase-inner">
            <button className="auth-logo-button" onClick={() => window.location.reload()}><AppLogo /></button>
            <div className="auth-showcase-copy">
              <div className="hero-badge"><span className="badge-pulse" /> PRIVATE CREATOR WORKSPACE</div>
              <h1>Make every upload more intentional.</h1>
              <p>
                Your analytics, audience intelligence and monetization tools
                stay together in one focused command center.
              </p>
              <div className="auth-benefits">
                <div><span><Icon.Check size={13} /></span>Live creator analytics</div>
                <div><span><Icon.Check size={13} /></span>NLP-powered audience insights</div>
                <div><span><Icon.Check size={13} /></span>Data-backed sponsorship estimates</div>
              </div>
            </div>
            <div className="auth-mini-card">
              <div className="auth-mini-top"><span><Icon.Zap size={14} /> LIVE SIGNAL</span><b>+8.7%</b></div>
              <div className="auth-mini-value">4.82M</div>
              <div className="auth-mini-label">Global video views</div>
              <div className="auth-mini-bars">
                {[26, 41, 39, 57, 48, 71, 68, 88, 76, 96].map((h, i) => <i key={i} style={{ height: `${h}%` }} />)}
              </div>
            </div>
          </div>
        </div>

        <div className="auth-panel-wrap">
          <div className="auth-card">
            <div className="auth-card-top">
              <div className="auth-card-eyebrow">{forgotMode ? 'ACCOUNT RECOVERY' : isRegistering ? 'NEW WORKSPACE' : 'WELCOME BACK'}</div>
              <div className="auth-secure"><Icon.Lock size={13} /> Secure access</div>
            </div>

            {!forgotMode ? (
              <>
                <h2>{isRegistering ? 'Create your creator workspace.' : 'Welcome back to SocialDash.'}</h2>
                <p className="auth-card-copy">
                  {isRegistering
                    ? 'Start with your email and create a private command center for your content.'
                    : 'Login to continue to your analytics and creator intelligence dashboard.'}
                </p>

                <form onSubmit={submit} className="auth-form">
                  <label>
                    <span>Email address</span>
                    <input
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      type="email"
                      autoComplete="email"
                      placeholder="you@creator.com"
                    />
                  </label>

                  <label>
                    <span>Password</span>
                    <div className="auth-password">
                      <input
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        type={showPassword ? 'text' : 'password'}
                        autoComplete={isRegistering ? 'new-password' : 'current-password'}
                        placeholder="Enter your password"
                      />
                      <button type="button" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                        {showPassword ? <Icon.EyeOff /> : <Icon.EyeOn />}
                      </button>
                    </div>
                  </label>

                  {!isRegistering && (
                    <div className="auth-row-end">
                      <button type="button" className="auth-link" onClick={() => setForgotMode(true)}>Forgot password?</button>
                    </div>
                  )}

                  <button className="auth-submit" type="submit" disabled={busy}>
                    {busy ? <span className="button-spinner" /> : null}
                    {busy ? 'Please wait…' : isRegistering ? 'Create Workspace' : 'Login to SocialDash'}
                    {!busy && <Icon.ArrowRight size={17} />}
                  </button>
                </form>

                <div className="auth-divider"><span>or</span></div>

                <button className="auth-back-button" onClick={() => setIsRegistering(v => !v)}>
                  {isRegistering ? 'Already have an account? ' : 'New to SocialDash? '}
                  <strong>{isRegistering ? 'Login' : 'Create an account'}</strong>
                </button>
              </>
            ) : (
              <>
                <h2>Reset your password.</h2>
                <p className="auth-card-copy">Enter the email linked to your SocialDash account and we'll send you a reset link.</p>

                <form onSubmit={(e) => { e.preventDefault(); sendReset(); }} className="auth-form">
                  <label>
                    <span>Email address</span>
                    <input
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      type="email"
                      autoComplete="email"
                      placeholder="you@creator.com"
                    />
                  </label>

                  <button className="auth-submit" type="submit" disabled={busy}>
                    {busy ? <span className="button-spinner" /> : null}
                    {busy ? 'Sending…' : 'Send Reset Link'}
                    {!busy && <Icon.ArrowRight size={17} />}
                  </button>
                </form>

                <button className="auth-back-button" onClick={() => setForgotMode(false)}>
                  Back to <strong>Login</strong>
                </button>
              </>
            )}

            <div className="auth-footnote">
              <span className="online-dot" />
              SocialDash services available
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              DASHBOARD UTILS                               */
/* -------------------------------------------------------------------------- */

function ProgressBar({ value, max, color = '#ff2d1b', label, sublabel }) {
  const pct = Math.max(0, Math.min(100, Math.round(((value || 0) / Math.max(max || 1, 1)) * 100)));
  return (
    <div className="progress-wrap">
      <div className="progress-label"><span>{label}</span><b>{sublabel}</b></div>
      <div className="progress-track"><div style={{ width: `${pct}%`, background: color }} /></div>
    </div>
  );
}

function StatCard({ icon, label, value, delta, deltaLabel, color, delay = 0 }) {
  return (
    <div className="dash-stat-card glass-card" style={{ '--delay': `${delay}ms` }}>
      <div className="dash-stat-top">
        <div className="dash-stat-icon" style={{ background: `${color}18`, color, borderColor: `${color}38` }}>{icon}</div>
        <div className="dash-stat-delta"><span>↑</span> {delta}%</div>
      </div>
      <div className="dash-stat-value"><AnimatedNumber value={value} /></div>
      <div className="dash-stat-label">{label}</div>
      <div className="dash-stat-footer">{deltaLabel}</div>
    </div>
  );
}

function NavItem({ icon, label, active, onClick, collapsed }) {
  return (
    <button className={`dash-nav-item ${active ? 'active' : ''}`} onClick={onClick} title={collapsed ? label : undefined}>
      <span className="dash-nav-icon">{icon}</span>
      {!collapsed && <span>{label}</span>}
      {active && <span className="dash-nav-indicator" />}
    </button>
  );
}

const CHART_DEFAULTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: 'rgba(10,10,14,0.95)',
      borderColor: 'rgba(255,255,255,0.1)',
      borderWidth: 1,
      padding: 10,
      titleColor: '#f4f4f5',
      bodyColor: '#a1a1aa',
      cornerRadius: 10
    }
  },
  scales: {
    x: { grid: { color: 'rgba(255,255,255,0.04)', drawBorder: false }, ticks: { color: '#52525b', font: { size: 10 } } },
    y: { grid: { color: 'rgba(255,255,255,0.04)', drawBorder: false }, ticks: { color: '#52525b', font: { size: 10 } } }
  }
};

const TABS = [
  { id: 'dashboard', label: 'Overview', icon: <Icon.Grid /> },
  { id: 'nlp', label: 'Audience AI', icon: <Icon.Brain /> },
  { id: 'revenue', label: 'Monetization', icon: <Icon.Dollar /> }
];

/* -------------------------------------------------------------------------- */
/*                                 APP ROOT                                   */
/* -------------------------------------------------------------------------- */

export default function App() {
  const { user, login, signup, logout, resetPassword } = useUserAuth();
  const API_URL = import.meta.env.VITE_API_URL;

  const [showLanding, setShowLanding] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);

  const [workspace, setWorkspace] = useState(null);
  const [tab, setTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');

  const [channelId, setChannelId] = useState('');
  const [tempId, setTempId] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [nlp, setNlp] = useState(null);
  const authWasReady = useRef(false);

  useEffect(() => {
    if (user) {
      authWasReady.current = true;
      setShowLanding(false);
      setIsLoading(true);
      setWorkspace(null);
      setChannelId('');
      setStats(null);
      setHistory([]);
      setNlp(null);
      setTab('dashboard');

      getDoc(doc(db, 'users', user.uid, 'profile', 'youtube'))
        .then(async snap => {
          if (snap.exists() && snap.data().accountId) {
            const id = snap.data().accountId;
            setChannelId(id);
            setWorkspace('youtube');
            await fetchApiData(id);
          } else {
            setIsLoading(false);
          }
        })
        .catch(() => setIsLoading(false));
    } else {
      setWorkspace(null);
      setChannelId('');
      setStats(null);
      setHistory([]);
      setNlp(null);
      setIsLoading(false);
      if (authWasReady.current) setShowLanding(false);
    }
  }, [user]);

  const openAuth = (register = false) => {
    setIsRegistering(register);
    setShowLanding(false);
  };

  const returnToLanding = () => {
    if (user) return;
    setShowLanding(true);
  };

  const fetchApiData = async (id) => {
    if (!id || !API_URL) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      setLoadingMsg('Fetching channel statistics…');
      const res = await fetch(`${API_URL}/api/youtube/${id}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setStats(data);

      setLoadingMsg('Fetching historical trajectory…');
      const histRes = await fetch(`${API_URL}/api/history/${id}`);
      const histData = await histRes.json();
      setHistory(Array.isArray(histData) ? histData : []);

      setLoadingMsg('Running audience intelligence…');
      if (data.uploads_id) {
        const nlpRes = await fetch(`${API_URL}/api/nlp/${data.uploads_id}`);
        const nlpData = await nlpRes.json();
        setNlp(nlpData?.error ? null : nlpData);
      }
    } catch (error) {
      toast.error('API sync failed. Check your backend connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const selectWorkspace = async (platform) => {
    if (platform !== 'youtube') {
      toast('Meta integrations is Coming Soon.', { icon: '🔒' });
      return;
    }

    try {
      setIsLoading(true);
      setLoadingMsg('Checking integration status…');
      const snap = await getDoc(doc(db, 'users', user.uid, 'profile', 'youtube'));

      if (snap.exists() && snap.data().accountId) {
        const id = snap.data().accountId;
        setChannelId(id);
        setWorkspace('youtube');
        await fetchApiData(id);
      } else {
        setIsLoading(false);
        setIsSettingsOpen(true);
      }
    } catch {
      setIsLoading(false);
      setIsSettingsOpen(true);
    }
  };

  const connectChannel = async () => {
    const id = tempId.trim();
    if (!id) {
      toast.error('Enter a valid YouTube channel ID.');
      return;
    }

    try {
      setIsLoading(true);
      setLoadingMsg('Saving creator source…');
      await setDoc(doc(db, 'users', user.uid, 'profile', 'youtube'), { accountId: id }, { merge: true });
      setChannelId(id);
      setIsSettingsOpen(false);
      setWorkspace('youtube');
      await fetchApiData(id);
    } catch {
      toast.error('Unable to save your YouTube channel.');
      setIsLoading(false);
    }
  };

  const velocityChart = useMemo(() => ({
    labels: history.map(h => new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })),
    datasets: [{
      label: 'Subscribers',
      data: history.map(h => h.subscribers),
      borderColor: '#ff2d1b',
      fill: true,
      tension: 0.42,
      borderWidth: 2.4,
      pointRadius: 0,
      backgroundColor: (ctx) => {
        const canvas = ctx.chart?.ctx;
        if (!canvas) return 'rgba(255,45,27,0.18)';
        const gradient = canvas.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, 'rgba(255,45,27,0.25)');
        gradient.addColorStop(1, 'rgba(255,45,27,0)');
        return gradient;
      }
    }]
  }), [history]);

  const weeklyBarChart = useMemo(() => {
    const base = history.length ? Number(history[history.length - 1].subscribers || 1000) : 1000;
    const values = [0.1, 0.12, 0.11, 0.15, 0.14, 0.18, 0.2].map(v => Math.max(1, Math.round(base * v)));
    return {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [{
        label: 'New subscribers',
        data: values,
        backgroundColor: values.map((_, i) => i === values.length - 1 ? '#ff2d1b' : 'rgba(255,255,255,0.08)'),
        borderColor: values.map((_, i) => i === values.length - 1 ? '#ff2d1b' : 'rgba(255,255,255,0.12)'),
        borderWidth: 1,
        borderRadius: 8
      }]
    };
  }, [history]);

  const sentimentChart = useMemo(() => {
    if (!nlp?.sentiment?.distribution) return null;
    return {
      labels: ['Positive', 'Neutral', 'Negative'],
      datasets: [{
        data: [
          nlp.sentiment.distribution.positive,
          nlp.sentiment.distribution.neutral,
          nlp.sentiment.distribution.negative
        ],
        backgroundColor: ['rgba(16,185,129,0.85)', 'rgba(59,130,246,0.85)', 'rgba(239,68,68,0.85)'],
        borderWidth: 0,
        hoverOffset: 8
      }]
    };
  }, [nlp]);

  const radarChart = useMemo(() => ({
    labels: ['Engagement', 'Retention', 'CTR', 'Sentiment', 'Growth', 'Reach'],
    datasets: [{
      label: 'Health',
      data: [82, 71, 65, (nlp?.sentiment?.distribution?.positive || 50) + 20, 88, 79],
      backgroundColor: 'rgba(255,45,27,0.08)',
      borderColor: '#ff2d1b',
      borderWidth: 2,
      pointBackgroundColor: '#ff2d1b',
      pointRadius: 3
    }]
  }), [nlp]);

  /* Public entry point */
  if (!user && showLanding) {
    return (
      <>
        <LandingPage onLogin={() => openAuth(false)} onGetStarted={() => openAuth(true)} />
        <Toaster position="top-center" />
      </>
    );
  }

  /* Authentication */
  if (!user && !showLanding) {
    return (
      <>
        <AuthPage
          isRegistering={isRegistering}
          setIsRegistering={setIsRegistering}
          onSuccess={() => setShowLanding(false)}
        />
        <button
          className="auth-floating-back"
          onClick={returnToLanding}
          type="button"
          aria-label="Back to website"
        >
          <span className="auth-back-arrow">←</span>
          <span>Back to website</span>
        </button>
        <Toaster position="top-center" />
      </>
    );
  }

  /* Loading */
  if (isLoading) {
    return (
      <div className="dashboard-loading fullscreen-loading">
        <BackgroundFX />
        <div className="loading-card glass-card">
          <div className="loading-logo"><AppLogo /></div>
          <div className="loading-spinner" />
          <h2>{loadingMsg || 'Preparing your creator workspace…'}</h2>
          <p>Syncing your latest SocialDash intelligence.</p>
        </div>
        <Toaster position="top-center" />
      </div>
    );
  }

  /* Workspace hub */
  if (!workspace) {
    return (
      <div className="workspace-page">
        <BackgroundFX />
        <div className="workspace-topbar">
          <AppLogo />
          <button className="dashboard-logout" onClick={logout}><Icon.LogOut size={15} /> Logout</button>
        </div>

        <div className="workspace-center">
          <div className="workspace-kicker">CREATOR WORKSPACE</div>
          <h1>Select a connected source.</h1>
          <p>Start with YouTube today. Meta integrations remain locked behind Pro.</p>

          <div className="workspace-grid">
            <button className="workspace-card active" onClick={() => selectWorkspace('youtube')}>
              <div className="workspace-card-icon youtube"><Icon.Youtube size={28} /></div>
              <h3>YouTube</h3>
              <p>Live API analytics, audience intelligence and monetization.</p>
              <span className="workspace-pill active">Connect source</span>
            </button>

            <button className="workspace-card locked" onClick={() => selectWorkspace('facebook')}>
              <div className="workspace-card-icon facebook"><Icon.Facebook size={28} /></div>
              <h3>Meta Business</h3>
              <p>Pages, ads and audience metrics.</p>
              <span className="workspace-pill"><Icon.Lock size={12} /> Coming Soon</span>
            </button>

            <button className="workspace-card locked" onClick={() => selectWorkspace('instagram')}>
              <div className="workspace-card-icon instagram"><Icon.Instagram size={28} /></div>
              <h3>Instagram</h3>
              <p>Creator account analytics and reach.</p>
              <span className="workspace-pill"><Icon.Lock size={12} /> Coming Soon</span>
            </button>
          </div>
        </div>

        {isSettingsOpen && (
          <div className="modal-veil" onClick={() => setIsSettingsOpen(false)}>
            <div className="modal-panel glass-card" onClick={e => e.stopPropagation()}>
              <div className="modal-kicker">YOUTUBE CONNECTION</div>
              <h2>Connect your channel.</h2>
              <p>Paste the YouTube channel ID you want SocialDash to sync.</p>
              <input className="modal-input" value={tempId} onChange={e => setTempId(e.target.value)} placeholder="UCxxxxxxxxxxxxxxxxxxxx" />
              <div className="modal-actions">
                <button className="modal-cancel" onClick={() => setIsSettingsOpen(false)}>Cancel</button>
                <button className="modal-confirm" onClick={connectChannel}>Connect channel <Icon.ArrowRight size={15} /></button>
              </div>
            </div>
          </div>
        )}
        <footer className="workspace-footer">
          <div className="workspace-footer-inner">
            <AppLogo compact />
            <span>Creator intelligence, all in one place.</span>
            <span>© {new Date().getFullYear()} SocialDash</span>
          </div>
        </footer>
        <Toaster position="top-center" />
      </div>
    );
  }

  /* Dashboard */
  const milestone = Math.max(50000, Math.ceil((Number(stats?.subscribers || 0) + 1) / 50000) * 50000);

  return (
    <div className="dashboard-app">
      <aside className={`dashboard-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-brand-row">
          <AppLogo compact={sidebarCollapsed} />
          <button
            className="sidebar-collapse"
            onClick={() => setSidebarCollapsed(v => !v)}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <Icon.ChevronRight size={15} />
          </button>
        </div>

        {!sidebarCollapsed && stats && (
          <div className="connected-profile glass-card">
            <img
              src={`https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(stats.title || 'creator')}&backgroundColor=18181b`}
              alt="Channel avatar"
            />
            <div>
              <strong>{stats.title}</strong>
              <span><i /> Live synced</span>
            </div>
          </div>
        )}

        <div className="dashboard-nav-section">
          {!sidebarCollapsed && <span>ANALYTICS</span>}
          {TABS.map(item => (
            <NavItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              active={tab === item.id}
              collapsed={sidebarCollapsed}
              onClick={() => setTab(item.id)}
            />
          ))}
        </div>

        <div className="dashboard-nav-section bottom">
          {!sidebarCollapsed && <span>SYSTEM</span>}
          <NavItem icon={<Icon.Switch />} label="Switch workspace" collapsed={sidebarCollapsed} onClick={() => setWorkspace(null)} />
          <NavItem icon={<Icon.Settings />} label="Configuration" collapsed={sidebarCollapsed} onClick={() => setIsSettingsOpen(true)} />
          <NavItem icon={<Icon.LogOut />} label="Disconnect" collapsed={sidebarCollapsed} onClick={logout} />
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div className="dashboard-header-title">
            <div className="dashboard-breadcrumb">CREATOR HQ <Icon.ChevronRight /> {TABS.find(item => item.id === tab)?.label}</div>
            <h1>{stats?.title || 'Creator Workspace'}</h1>
          </div>
          <button className="force-sync" onClick={() => fetchApiData(channelId)}><Icon.Zap size={15} /> Force sync</button>
        </header>

        <div className="dashboard-content">
          {tab === 'dashboard' && stats && (
            <div className="dashboard-tab">
              <div className="dashboard-stats-grid">
                <StatCard icon={<Icon.Users />} label="Total subscribers" value={stats.subscribers} delta="3.2" deltaLabel="Live updates" color="#ff2d1b" delay={0} />
                <StatCard icon={<Icon.Eye />} label="Global views" value={stats.views} delta="8.7" deltaLabel="Across the channel" color="#3b82f6" delay={60} />
                <StatCard icon={<Icon.Video />} label="Published assets" value={stats.videos} delta="1.4" deltaLabel="API validated" color="#8b5cf6" delay={120} />
                <StatCard icon={<Icon.Globe />} label="True omni reach" value={stats.true_reach} delta="5.1" deltaLabel="Projected audience" color="#10b981" delay={180} />
              </div>

              <div className="dashboard-chart-row">
                <div className="dash-panel glass-card large">
                  <div className="dash-panel-header">
                    <div><strong>Live Velocity Stream</strong><span>Real-time subscriber trajectory</span></div>
                    <div className="live-badge"><i /> LIVE</div>
                  </div>
                  <div className="dash-chart"><Line data={velocityChart} options={CHART_DEFAULTS} /></div>
                </div>

                <div className="dash-panel glass-card">
                  <div className="dash-panel-header"><div><strong>Weekly Acquisition</strong><span>New subscribers trend</span></div></div>
                  <div className="dash-chart"><Bar data={weeklyBarChart} options={CHART_DEFAULTS} /></div>
                </div>
              </div>

              <div className="dashboard-bottom-row">
                <div className="dash-panel glass-card">
                  <div className="dash-panel-header"><div><strong>Channel Health</strong><span>Performance quality score</span></div><div className="health-number"><Icon.Star size={13} />82</div></div>
                  <div className="radar-chart"><Radar data={radarChart} options={{ ...CHART_DEFAULTS, scales: { r: { ticks: { display: false }, grid: { color: 'rgba(255,255,255,0.07)' }, angleLines: { color: 'rgba(255,255,255,0.07)' }, pointLabels: { color: '#71717a', font: { size: 10 } }, suggestedMin: 0, suggestedMax: 100 } } }} /></div>
                </div>

                <div className="dash-panel glass-card milestone-panel">
                  <span className="panel-eyebrow">GOAL MILESTONE</span>
                  <h3>{milestone.toLocaleString()} subscribers</h3>
                  <p>Build toward your next meaningful audience milestone.</p>
                  <ProgressBar value={stats.subscribers} max={milestone} label="Progress" sublabel={`${((Number(stats.subscribers || 0) / milestone) * 100).toFixed(1)}%`} />
                  <div className="milestone-foot"><span>Current</span><b>{Number(stats.subscribers || 0).toLocaleString()}</b></div>
                </div>

                {nlp && (
                  <div className="dash-panel glass-card">
                    <div className="dash-panel-header"><div><strong>Top Keywords</strong><span>Audience language</span></div></div>
                    <div className="keyword-cloud">
                      {(nlp.topKeywords || []).slice(0, 10).map(word => <span key={word}>{word}</span>)}
                    </div>
                    <div className="keyword-note"><Icon.Brain size={14} /> Powered by audience text analysis</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === 'nlp' && nlp && (
            <div className="nlp-dashboard">
              <div className="dash-panel glass-card nlp-clusters">
                <div className="dash-panel-header">
                  <div>
                    <strong>DBSCAN Topic Clusters</strong>
                    <span>Scikit-learn clustering across {nlp.total_analyzed || 0} comments</span>
                  </div>
                  <span className="analysis-pill">{nlp.clusters?.length || 0} clusters</span>
                </div>

                <div className="cluster-stream">
                  {(!nlp.clusters || nlp.clusters.length === 0) ? (
                    <div className="empty-state">Insufficient comment data to form topic clusters.</div>
                  ) : (
                    nlp.clusters.map((cluster, index) => (
                      <div className="cluster-item" key={`${cluster.cluster_id}-${index}`}>
                        <div className="cluster-topline">
                          <strong>#{String((cluster.cluster_id || index) + 1).padStart(2, '0')}</strong>
                          <div className="cluster-progress"><span style={{ width: `${Math.min(100, (cluster.size / Math.max(nlp.clusters[0]?.size || 1, 1)) * 100)}%` }} /></div>
                          <b>{Number(cluster.size || 0).toLocaleString()} matches</b>
                        </div>
                        <div className="cluster-tags">{(cluster.keywords || []).map(word => <span key={word}>{word}</span>)}</div>
                        <blockquote>“{cluster.sample || 'Audience conversation cluster'}”</blockquote>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="dash-panel glass-card sentiment-panel">
                <div className="dash-panel-header"><div><strong>VADER Sentiment</strong><span>Audience reaction distribution</span></div></div>
                {sentimentChart ? (
                  <>
                    <div className="sentiment-chart-wrap">
                      <Doughnut data={sentimentChart} options={{ ...CHART_DEFAULTS, cutout: '72%' }} />
                      <div className="sentiment-center">
                        <strong>{Math.round((nlp.sentiment?.score || 0) * 100)}</strong>
                        <span>INDEX</span>
                      </div>
                    </div>
                    <div className="sentiment-list">
                      {[
                        ['Positive', '#10b981', nlp.sentiment.distribution.positive],
                        ['Neutral', '#3b82f6', nlp.sentiment.distribution.neutral],
                        ['Negative', '#ef4444', nlp.sentiment.distribution.negative]
                      ].map(([label, color, amount]) => (
                        <div className="sentiment-line" key={label}>
                          <span><i style={{ background: color }} />{label}</span><div><span style={{ width: `${amount}%`, background: color }} /></div><b>{amount}%</b>
                        </div>
                      ))}
                    </div>
                  </>
                ) : <div className="empty-state">Sentiment data is unavailable.</div>}
              </div>
            </div>
          )}

          {tab === 'revenue' && stats && (
            <div className="revenue-dashboard">
              <div className="dash-panel glass-card revenue-hero-panel">
                <div className="revenue-glow" />
                <div className="revenue-icon"><Icon.Dollar size={28} /></div>
                <div className="panel-eyebrow green">MONETIZATION INTELLIGENCE</div>
                <h2>Brand Deal Valuation</h2>
                <p>Algorithmic pricing based on your historical median viewership.</p>
                <div className="revenue-price"><span>$</span><AnimatedNumber value={stats.sponsorship_value} duration={1500} /></div>
                <div className="revenue-note">estimated value per sponsored integration</div>

                <div className="revenue-tiers">
                  {[
                    ['Story mention', Math.floor(Number(stats.sponsorship_value || 0) * 0.2)],
                    ['Dedicated', Number(stats.sponsorship_value || 0)],
                    ['Series deal', Number(stats.sponsorship_value || 0) * 3]
                  ].map(([label, amount], index) => (
                    <div className={index === 1 ? 'revenue-tier active' : 'revenue-tier'} key={label}>
                      <small>{label}</small><strong>${amount.toLocaleString()}</strong>
                    </div>
                  ))}
                </div>
              </div>

              <div className="dash-panel glass-card revenue-breakdown">
                <div className="dash-panel-header"><div><strong>Calculation Breakdown</strong><span>How the estimate is formed</span></div></div>
                {[
                  ['Average views per video', Math.round(Number(stats.views || 0) / Math.max(Number(stats.videos || 1), 1)).toLocaleString()],
                  ['Industry CPM base', '$20.00'],
                  ['Platform multiplier', '1.0x Standard'],
                  ['Estimated value', `$${Number(stats.sponsorship_value || 0).toLocaleString()}`
                  ]
                ].map(([label, value], i) => (
                  <div className="breakdown-row" key={label}><span>{label}</span><strong className={i === 3 ? 'green-text' : ''}>{value}</strong></div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {isSettingsOpen && (
        <div className="modal-veil" onClick={() => setIsSettingsOpen(false)}>
          <div className="modal-panel glass-card" onClick={e => e.stopPropagation()}>
            <div className="modal-kicker">CONFIGURATION</div>
            <h2>Update connected channel.</h2>
            <p>Change the YouTube channel ID used by this workspace.</p>
            <input className="modal-input" value={tempId} onChange={e => setTempId(e.target.value)} placeholder="UCxxxxxxxxxxxxxxxxxxxx" />
            <div className="modal-actions">
              <button className="modal-cancel" onClick={() => setIsSettingsOpen(false)}>Cancel</button>
              <button className="modal-confirm" onClick={connectChannel}>Update connection <Icon.ArrowRight size={15} /></button>
            </div>
          </div>
        </div>
      )}

      <Toaster position="bottom-right" />
    </div>
  );
}