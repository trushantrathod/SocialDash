import React, { useState, useEffect, useMemo, useRef } from 'react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase'; 
import { useUserAuth } from './context/AuthContext';
import { Line, Doughnut, Bar, Radar } from 'react-chartjs-2';
import 'chart.js/auto';
import toast, { Toaster } from 'react-hot-toast';
import './App.css';

// ─── ICONS ──────────────────────────────────────────────────────────────────
const I = {
  Youtube: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>,
  Facebook: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" color="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>,
  Instagram: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>,
  Grid: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>,
  Brain: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/></svg>,
  Dollar: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  Zap: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  Settings: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  LogOut: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  TrendUp: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  Eye: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  Users: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Video: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>,
  Star: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  Globe: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
  ChevronRight: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>,
  Switch: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/></svg>
};

// ─── UTILS & ANIMATED COMPONENTS ──────────────────────────────────────────────
function AnimatedNumber({ value, prefix = '', suffix = '', duration = 1400 }) {
  const [display, setDisplay] = useState(0);
  const startRef = useRef(null);
  const frameRef = useRef(null);

  useEffect(() => {
    const start = performance.now();
    const from = display;
    const to = value || 0;
    const step = (ts) => {
      if (!startRef.current) startRef.current = ts;
      const elapsed = ts - start;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 4);
      setDisplay(Math.round(from + (to - from) * ease));
      if (progress < 1) frameRef.current = requestAnimationFrame(step);
    };
    frameRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameRef.current);
  }, [value, duration]);

  return <span>{prefix}{display.toLocaleString()}{suffix}</span>;
}

function ProgressBar({ value, max, color, label, sublabel }) {
  const pct = Math.round((value / max) * 100) || 0;
  const [animated, setAnimated] = useState(0);
  useEffect(() => { const t = setTimeout(() => setAnimated(pct), 100); return () => clearTimeout(t); }, [pct]);
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)', fontWeight: 600 }}>{label}</span>
        <span style={{ fontSize: '0.85rem', color: 'white', fontWeight: 700 }}>{sublabel}</span>
      </div>
      <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${animated}%`, borderRadius: 99, background: `linear-gradient(90deg, ${color}, ${color}aa)`, transition: 'width 1s cubic-bezier(0.4,0,0.2,1)', boxShadow: `0 0 12px ${color}66` }}/>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, delta, deltaLabel, color, delay = 0 }) {
  return (
    <div className="stat-card-new glass-card" style={{ animationDelay: `${delay}ms` }}>
      <div className="stat-card-top">
        <div className="stat-icon-wrap" style={{ background: `${color}18`, border: `1px solid ${color}30`, color }}>{icon}</div>
        <div className="stat-delta-badge">
          <I.TrendUp /> +{delta}%
        </div>
      </div>
      <div className="stat-value-block">
        <div className="stat-num"><AnimatedNumber value={value} /></div>
        <div className="stat-label">{label}</div>
      </div>
      <div className="stat-footer">
        <span className="stat-sub">{deltaLabel}</span>
      </div>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }) {
  return (
    <button className={`nav-item-new ${active ? 'nav-active' : ''}`} onClick={onClick}>
      <span className="nav-icon">{icon}</span>
      <span className="nav-label-text">{label}</span>
      {active && <span className="nav-indicator"/>}
    </button>
  );
}

const CHART_DEFAULTS = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { backgroundColor: 'rgba(10,10,15,0.95)', borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1, padding: 12, titleColor: '#f4f4f5', bodyColor: '#a1a1aa', cornerRadius: 10 }},
  scales: { x: { grid: { color: 'rgba(255,255,255,0.04)', drawBorder: false }, ticks: { color: '#52525b', font: { size: 11 } } }, y: { grid: { color: 'rgba(255,255,255,0.04)', drawBorder: false }, ticks: { color: '#52525b', font: { size: 11 } } } },
};

const TABS = [
  { id: 'dashboard', label: 'Overview', icon: <I.Grid /> },
  { id: 'nlp', label: 'Audience AI', icon: <I.Brain /> },
  { id: 'revenue', label: 'Monetization', icon: <I.Dollar /> }
];

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const { user, login, signup, logout, resetPassword } = useUserAuth();
  const API_URL = import.meta.env.VITE_API_URL;
  
  // Auth State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  // App & Navigation State
  const [workspace, setWorkspace] = useState(null); // null = Hub view, 'youtube' = Dashboard view
  const [tab, setTab] = useState('dashboard');
  
  // Loading & Data State
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [channelId, setChannelId] = useState("");
  const [tempId, setTempId] = useState("");
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [nlp, setNlp] = useState(null);

  // Authentication Handler
  const handleAuth = async () => {
    if (!email || !password) return toast.error("Enter all fields");
    const authPromise = isRegistering ? signup(email, password) : login(email, password);
    toast.promise(authPromise, { loading: 'Authenticating...', success: <b>Access Granted</b>, error: (e) => `${e.message}` });
  };

  const handleForgotPassword = async () => {
  if (!email) {
    toast.error("Please enter your email address first");
    return;
  }

  try {
    await resetPassword(email);
    toast.success("Password reset email sent successfully!");
  } catch (error) {
    toast.error(error.message);
  }
};
  


  // State wipe & Profile Fetch when User logs in or out
  useEffect(() => {
    if (user) {
      setIsLoading(true);
      
      // WIPE PREVIOUS STATE TO PREVENT LEAKS ACROSS ACCOUNTS
      setWorkspace(null); 
      setChannelId("");
      setTempId("");
      setStats(null);
      setHistory([]);
      setNlp(null);
      setTab('dashboard');

      // Check if this new user has an ID saved
      getDoc(doc(db, 'users', user.uid, 'profile', 'youtube')).then(snap => {
        if (snap.exists() && snap.data().accountId) {
          const id = snap.data().accountId;
          setChannelId(id);
          setWorkspace('youtube'); // Auto-skip Hub since they already have an ID
          fetchApiData(id);
        } else {
          // New User! Stop loading and show them the Hub to pick a card.
          setIsLoading(false);
        }
      });
    } else {
      // WIPE STATE ON LOGOUT
      setWorkspace(null);
      setChannelId("");
      setStats(null);
      setHistory([]);
      setNlp(null);
      setIsLoading(false);
    }
  }, [user]);

  // Workspace Selection (The Hub Logic)
  const selectWorkspace = async (platform) => {
    if (platform === 'facebook' || platform === 'instagram') {
      toast("Meta integrations require a Pro License.", { icon: '🔒' });
      return;
    }
    
    if (platform === 'youtube') {
      setIsLoading(true);
      setLoadingMsg("Checking Integration Status...");
      
      try {
        const snap = await getDoc(doc(db, 'users', user.uid, 'profile', 'youtube'));
        if (snap.exists() && snap.data().accountId) {
          const id = snap.data().accountId;
          setChannelId(id);
          setWorkspace('youtube');
          await fetchApiData(id);
        } else {
          // They clicked the Youtube card but have no ID. Ask for it!
          setIsLoading(false);
          setIsSettingsOpen(true); 
        }
      } catch (e) {
        setIsLoading(false);
        setIsSettingsOpen(true);
      }
    }
  };

  // Connect & Save New YouTube ID
  const connectChannel = async () => {
    if (!tempId.trim()) return toast.error("Enter a valid ID");
    setIsLoading(true);
    await setDoc(doc(db, 'users', user.uid, 'profile', 'youtube'), { accountId: tempId });
    setChannelId(tempId);
    setIsSettingsOpen(false);
    setWorkspace('youtube');
    fetchApiData(tempId);
  };

  // Fetch Live Data
  const fetchApiData = async (id) => {
    setIsLoading(true);
    try {
      setLoadingMsg("Fetching Channel Statistics...");
      const res = await fetch(`${API_URL}/api/youtube/${id}`);
      const data = await res.json();
      if(data.error) throw new Error(data.error);
      setStats(data);

      setLoadingMsg("Fetching Historical Trajectory...");
      const histRes = await fetch(`${API_URL}/api/history/${id}`);
      const histData = await histRes.json();
      setHistory(histData || []);

      setLoadingMsg("Executing ML Clustering...");
      if(data.uploads_id) {
         const nlpRes = await fetch(`${API_URL}/api/nlp/${data.uploads_id}`);
         const nlpData = await nlpRes.json();
         if(!nlpData.error) setNlp(nlpData);
      }
    } catch (e) {
      toast.error("API Sync Failed. Check backend connection.");
    }
    setIsLoading(false);
  };

  // Memoized Chart Data
  const velocityChart = useMemo(() => ({
    labels: history.map(h => new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })),
    datasets: [{
      label: 'Subscribers', data: history.map(h => h.subscribers),
      borderColor: '#ff2200', fill: true, tension: 0.45, borderWidth: 2.5, pointRadius: 0,
      backgroundColor: (ctx) => { const g = ctx.chart.ctx.createLinearGradient(0, 0, 0, 300); g.addColorStop(0, 'rgba(255,34,0,0.25)'); g.addColorStop(1, 'rgba(255,34,0,0)'); return g; }
    }],
  }), [history]);

  const weeklyBarChart = useMemo(() => {
    const base = history.length > 0 ? history[history.length-1].subscribers : 1000;
    const miniData = [base*0.1, base*0.12, base*0.11, base*0.15, base*0.14, base*0.18, base*0.2].map(v => Math.round(v));
    return {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [{ label: 'New Subs', data: miniData, backgroundColor: miniData.map((_, i) => i === 6 ? '#ff0000' : 'rgba(255,255,255,0.07)'), borderColor: miniData.map((_, i) => i === 6 ? '#ff0000' : 'rgba(255,255,255,0.12)'), borderWidth: 1, borderRadius: 8 }]
    };
  }, [history]);

  const sentimentChart = useMemo(() => {
    if(!nlp) return null;
    return {
      labels: ['Positive', 'Neutral', 'Negative'],
      datasets: [{ data: [nlp.sentiment.distribution.positive, nlp.sentiment.distribution.neutral, nlp.sentiment.distribution.negative], backgroundColor: ['rgba(16,185,129,0.85)', 'rgba(59,130,246,0.85)', 'rgba(239,68,68,0.85)'], borderWidth: 0, hoverOffset: 8 }]
    };
  }, [nlp]);

  const radarChart = useMemo(() => ({
    labels: ['Engagement', 'Retention', 'CTR', 'Sentiment', 'Growth', 'Reach'],
    datasets: [{ label: 'Health', data: [82, 71, 65, (nlp?.sentiment?.distribution?.positive || 50) + 20, 88, 79], backgroundColor: 'rgba(255,0,0,0.1)', borderColor: '#ff0000', borderWidth: 2, pointBackgroundColor: '#ff0000', pointRadius: 4 }]
  }), [nlp]);

// ─── VIEW 1: AUTHENTICATION ───
if (!user) {
  return (
    <div className="app-shell layout-centered">
      <Toaster position="top-center" />

      <div className="glass-card modal-panel" style={{ width: 420 }}>
        <div
          className="brand"
          style={{ justifyContent: 'center', marginBottom: 40 }}
        >
          <div className="brand-icon">
            <I.Youtube />
          </div>
          <span style={{ fontSize: '1.8rem', fontWeight: 800 }}>
            Social<span style={{ color: '#ff0000' }}>Dash</span>
          </span>
        </div>

        <h2
          style={{
            textAlign: 'center',
            marginBottom: 25,
            fontSize: '1.2rem',
            color: 'white'
          }}
        >
          {isRegistering ? 'Create Workspace' : 'Authenticate'}
        </h2>

        <input
          className="modal-input"
          placeholder="Work Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ marginBottom: 12 }}
        />

        <input
          className="modal-input"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ marginBottom: 10 }}
        />

        {!isRegistering && (
          <div
            style={{
              textAlign: 'right',
              marginBottom: 20
            }}
          >
            <button
              onClick={handleForgotPassword}
              style={{
                background: 'none',
                border: 'none',
                color: '#3b82f6',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 600
              }}
            >
              Forgot Password?
            </button>
          </div>
        )}

        <button
          className="modal-btn-ok"
          style={{
            width: '100%',
            marginBottom: 15,
            padding: '14px'
          }}
          onClick={handleAuth}
        >
          {isRegistering ? 'Initialize Account' : 'Access Studio'}
        </button>

        <button
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-dim)',
            width: '100%',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer'
          }}
          onClick={() => setIsRegistering(!isRegistering)}
        >
          {isRegistering
            ? 'Already have an account? Login'
            : 'Need access? Sign Up'}
        </button>
      </div>
    </div>
  );
}

  // ─── VIEW 2: LOADING ───
  if (isLoading) {
    return (
      <div className="app-shell layout-centered">
        <div className="loader-spinner"></div>
        <p style={{ marginTop: 20, color: 'white', fontWeight: 600 }}>{loadingMsg}</p>
      </div>
    );
  }

  // ─── VIEW 3: WORKSPACE HUB (SELECT PLATFORM) ───
  if (workspace === null) {
    return (
      <div className="app-shell layout-centered">
        <Toaster position="top-center"/>
        <div className="content-wrapper" style={{ textAlign: 'center' }}>
          <h1 className="title-grad" style={{ fontSize: '3rem', marginBottom: 10 }}>Select Workspace</h1>
          <p className="text-dim" style={{ marginBottom: 40 }}>Initialize your tracking environments to begin generating insights.</p>
          
          <div className="hub-grid">
            {/* YOUTUBE (ACTIVE) */}
            <div className="hub-card" onClick={() => selectWorkspace('youtube')}>
              <div style={{ color: '#ff0000', marginBottom: 15 }}><I.Youtube /></div>
              <h3 style={{ color: 'white', fontSize: '1.2rem' }}>YouTube</h3>
              <p className="text-dim" style={{ fontSize: '0.85rem', marginTop: 5 }}>Live API Sync</p>
              <div className="hub-badge active">{channelId ? 'Online' : 'Connect Source'}</div>
            </div>

            {/* FACEBOOK (LOCKED) */}
            <div className="hub-card locked" onClick={() => selectWorkspace('facebook')}>
              <div style={{ color: '#1877F2', marginBottom: 15 }}><I.Facebook /></div>
              <h3 style={{ color: 'white', fontSize: '1.2rem' }}>Meta Business</h3>
              <p className="text-dim" style={{ fontSize: '0.85rem', marginTop: 5 }}>Pages & Ads</p>
              <div className="hub-badge pro">Pro Required</div>
            </div>

            {/* INSTAGRAM (LOCKED) */}
            <div className="hub-card locked" onClick={() => selectWorkspace('instagram')}>
              <div style={{ color: '#E1306C', marginBottom: 15 }}><I.Instagram /></div>
              <h3 style={{ color: 'white', fontSize: '1.2rem' }}>Instagram</h3>
              <p className="text-dim" style={{ fontSize: '0.85rem', marginTop: 5 }}>Creator Accounts</p>
              <div className="hub-badge pro">Pro Required</div>
            </div>
          </div>
          
          <button className="btn" style={{ marginTop: 60 }} onClick={logout}>Secure Logout</button>
        </div>

        {/* SETTINGS MODAL (Triggered if YouTube selected but no ID saved) */}
        {isSettingsOpen && (
          <div className="modal-veil" onClick={() => setIsSettingsOpen(false)}>
            <div className="modal-panel glass-card" onClick={e => e.stopPropagation()}>
              <h2 style={{ color: 'white', marginBottom: 8 }}>Initialize YouTube</h2>
              <p style={{ color: 'var(--text-dim)', marginBottom: 24, fontSize: '0.9rem' }}>Connect your YouTube channel ID to sync live API analytics securely.</p>
              <input className="modal-input" placeholder="Channel ID (UC...)" value={tempId} onChange={(e) => setTempId(e.target.value)} />
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button className="modal-btn-cancel" onClick={() => setIsSettingsOpen(false)}>Cancel</button>
                <button className="modal-btn-ok" onClick={connectChannel}>Connect Database</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── VIEW 4: MAIN DASHBOARD ───
  return (
    <div className="app-shell">
      <Toaster position="bottom-right"/>

      {/* SIDEBAR */}
      <aside className={`sidebar-new ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="brand">
            <div className="brand-icon"><I.Youtube /></div>
            {!sidebarCollapsed && <span style={{color: 'white'}}>Social<span style={{color: '#ff0000'}}>Dash</span></span>}
          </div>
          <button className="collapse-btn" onClick={() => setSidebarCollapsed(v => !v)}>
            {sidebarCollapsed ? <I.Grid /> : <I.ChevronRight />}
          </button>
        </div>

        {!sidebarCollapsed && stats && (
          <div className="sidebar-profile-card">
            <div className="profile-avatar-wrap">
              <img src={`https://api.dicebear.com/7.x/shapes/svg?seed=${stats.title}&backgroundColor=18181b`} alt="avatar" className="profile-avatar"/>
              <span className="profile-live-dot"/>
            </div>
            <div>
              <div className="profile-name">{stats.title}</div>
              <div className="profile-status"><span className="status-dot"/>&nbsp;Live Synced</div>
            </div>
          </div>
        )}

        <nav className="sidebar-nav-new">
          {!sidebarCollapsed && <div className="nav-section-label">ANALYTICS</div>}
          {TABS.map(t2 => (
            <NavItem key={t2.id} icon={t2.icon} label={sidebarCollapsed ? '' : t2.label} active={tab === t2.id} onClick={() => setTab(t2.id)}/>
          ))}
          
          {!sidebarCollapsed && <div className="nav-section-label" style={{ marginTop: 24 }}>SYSTEM</div>}
          
          {/* SWITCH WORKSPACE BUTTON */}
          <NavItem icon={<I.Switch />} label={sidebarCollapsed ? '' : 'Switch Workspace'} active={false} onClick={() => setWorkspace(null)} />
          
          <NavItem icon={<I.Settings />} label={sidebarCollapsed ? '' : 'Configuration'} active={false} onClick={() => setIsSettingsOpen(true)} />
          <NavItem icon={<I.LogOut />} label={sidebarCollapsed ? '' : 'Disconnect'} active={false} onClick={logout} />
        </nav>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="main-new">
        <header className="topbar">
          <div className="topbar-left">
            <div className="breadcrumb">
              <span>Creator HQ</span> <I.ChevronRight /> <span className="bc-current">{TABS.find(t2 => t2.id === tab)?.label}</span>
            </div>
            <h1 className="page-title">{stats?.title}</h1>
          </div>
          <div className="topbar-right">
            <button className="sync-btn" onClick={() => fetchApiData(channelId)}><I.Zap /><span>Force Sync Data</span></button>
          </div>
        </header>

        <div className="content-scroll">
          
          {/* DASHBOARD TAB */}
          {tab === 'dashboard' && stats && (
            <div className="tab-content">
              <div className="stats-grid">
                <StatCard icon={<I.Users />} label="Total Subscribers" value={stats.subscribers} delta={3.2} deltaLabel="Live Updates" color="#ff0000" delay={0} />
                <StatCard icon={<I.Eye />} label="Global Views" value={stats.views} delta={8.7} deltaLabel="Across entire channel" color="#3b82f6" delay={80} />
                <StatCard icon={<I.Video />} label="Published Assets" value={stats.videos} delta={1.4} deltaLabel="API Validated" color="#8b5cf6" delay={160} />
                <StatCard icon={<I.Globe />} label="True Omni Reach" value={stats.true_reach} delta={5.1} deltaLabel="Projected Audience" color="#10b981" delay={240} />
              </div>

              <div className="charts-row">
                <div className="glass-card chart-card">
                  <div className="chart-header">
                    <div>
                      <div className="chart-title">Live Velocity Stream</div>
                      <div className="chart-sub">Real-time database listener</div>
                    </div>
                    <div className="chart-badge"><span className="pulse-dot"/>LIVE</div>
                  </div>
                  <div className="chart-area">
                    <Line data={velocityChart} options={CHART_DEFAULTS} />
                  </div>
                </div>
                <div className="glass-card chart-card">
                  <div className="chart-header"><div><div className="chart-title">Weekly Acquisition</div></div></div>
                  <div className="chart-area"><Bar data={weeklyBarChart} options={CHART_DEFAULTS} /></div>
                </div>
              </div>

              <div className="bottom-row">
                <div className="glass-card chart-card">
                  <div className="chart-header"><div><div className="chart-title">Channel Health</div></div><div className="health-score"><I.Star /><span>82</span></div></div>
                  <div className="chart-area" style={{ height: 220 }}><Radar data={radarChart} options={{ ...CHART_DEFAULTS, scales: { r: { ticks: { display: false } } } }}/></div>
                </div>
                <div className="glass-card predict-card">
                  <div className="predict-label">Goal Milestone</div>
                  <div className="predict-goal">Target: {((stats.subscribers + 50000) - ((stats.subscribers + 50000) % 50000)).toLocaleString()}</div>
                  <div style={{ marginTop: 20 }}>
                    <ProgressBar value={stats.subscribers} max={(stats.subscribers + 50000) - ((stats.subscribers + 50000) % 50000)} color="#ff0000" label="Progress" sublabel={`${((stats.subscribers/((stats.subscribers + 50000) - ((stats.subscribers + 50000) % 50000)))*100).toFixed(1)}%`} />
                  </div>
                </div>
                {nlp && (
                  <div className="glass-card chart-card">
                    <div className="chart-header"><div><div className="chart-title">Top Keywords</div></div></div>
                    <div className="kw-cloud">{nlp.topKeywords.slice(0, 8).map(kw => <span key={kw} className="kw-tag">{kw}</span>)}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* NLP TAB */}
          {tab === 'nlp' && nlp && (
            <div className="tab-content nlp-layout">
              <div className="glass-card nlp-main">
                <div className="chart-header" style={{ marginBottom: 20 }}>
                  <div><div className="chart-title">DBSCAN Topic Clusters</div><div className="chart-sub">Scikit-learn clustering on latest video ({nlp.total_analyzed} comments)</div></div>
                </div>
                {nlp.clusters.length === 0 ? (
                  <div style={{color: 'var(--text-dim)', padding: 20}}>Insufficient comment data to form clusters.</div>
                ) : (
                  <div className="cluster-stream">
                    {nlp.clusters.map((c, i) => (
                      <div key={i} className="cluster-block" style={{ animationDelay: `${i * 80}ms` }}>
                        <div className="cluster-top">
                          <div className="cluster-id">
                            <span className="cluster-num">#{String(c.cluster_id + 1).padStart(2,'0')}</span>
                            <div className="cluster-bar-wrap"><div className="cluster-bar" style={{ width: `${(c.size / nlp.clusters[0].size) * 100}%` }}/></div>
                          </div>
                          <span className="cluster-size">{c.size.toLocaleString()} matches</span>
                        </div>
                        <div className="cluster-kws">{c.keywords.map(kw => <span key={kw} className="kw-chip">{kw}</span>)}</div>
                        <blockquote className="cluster-quote">"{c.sample}"</blockquote>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="glass-card nlp-main">
                <div className="chart-title" style={{ marginBottom: 20 }}>VADER Sentiment</div>
                <div style={{ height: 200, position: 'relative' }}>
                  <Doughnut data={sentimentChart} options={{ ...CHART_DEFAULTS, cutout: '72%' }}/>
                  <div className="donut-center"><div className="donut-score">{(nlp.sentiment.score * 100).toFixed(0)}</div><div className="donut-label">Index</div></div>
                </div>
                <div style={{ marginTop: 30, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[['Positive', '#10b981', nlp.sentiment.distribution.positive], ['Neutral', '#3b82f6', nlp.sentiment.distribution.neutral], ['Negative', '#ef4444', nlp.sentiment.distribution.negative]].map(([l, c, v]) => (
                    <div key={l} className="sentiment-row"><span className="sent-dot" style={{ background: c }}/><span className="sent-label">{l}</span><div className="sent-bar-wrap"><div className="sent-bar" style={{ width: `${v}%`, background: c }}/></div><span className="sent-pct">{v}%</span></div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* REVENUE TAB */}
          {tab === 'revenue' && stats && (
            <div className="tab-content revenue-layout">
              <div className="glass-card revenue-hero">
                <div className="rev-glow"/>
                <div className="rev-icon"><I.Dollar /></div>
                <div className="rev-title">Brand Deal Valuation</div>
                <div className="rev-sub">Algorithmic pricing based on your historical median viewership</div>
                <div className="rev-price"><span className="rev-currency">$</span><AnimatedNumber value={stats.sponsorship_value} duration={1500} /></div>
                <div className="rev-note">Per sponsored integration</div>
                <div className="rev-tiers">
                  {[['Story Mention', Math.floor(stats.sponsorship_value * 0.2)], ['Dedicated', stats.sponsorship_value], ['Series Deal', stats.sponsorship_value * 3]].map(([l, v]) => (
                    <div key={l} className={`rev-tier ${v === stats.sponsorship_value ? 'tier-active' : ''}`}>
                      <span className="tier-label">{l}</span><span className="tier-price">${v.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="glass-card revenue-details" style={{ padding: 28 }}>
                <div className="chart-title" style={{ marginBottom: 20 }}>Calculation Breakdown</div>
                {[
                  ['Avg Views per Video', Math.round(stats.views / Math.max(stats.videos, 1)).toLocaleString(), 'white'],
                  ['Industry CPM Base', '$20.00', 'white'],
                  ['Platform Multiplier', '1.0x (Standard)', '#fbbf24'],
                  ['Estimated Value', `$${stats.sponsorship_value.toLocaleString()}`, '#10b981'],
                ].map(([k, v, c]) => (
                  <div key={k} className="calc-line"><span className="calc-key">{k}</span><span className="calc-val" style={{ color: c }}>{v}</span></div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      
      {/* IN-DASHBOARD SETTINGS MODAL */}
      {isSettingsOpen && workspace === 'youtube' && (
        <div className="modal-veil" onClick={() => setIsSettingsOpen(false)}>
          <div className="modal-panel glass-card" onClick={e => e.stopPropagation()}>
            <h2 style={{ color: 'white', marginBottom: 8 }}>Configuration</h2>
            <p style={{ color: 'var(--text-dim)', marginBottom: 24, fontSize: '0.9rem' }}>Update your connected YouTube Channel ID.</p>
            <input className="modal-input" placeholder="Channel ID (UC...)" value={tempId} onChange={(e) => setTempId(e.target.value)} />
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button className="modal-btn-cancel" onClick={() => setIsSettingsOpen(false)}>Cancel</button>
              <button className="modal-btn-ok" onClick={connectChannel}>Update Connection</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}