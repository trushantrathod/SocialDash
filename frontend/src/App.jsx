import React, { useState, useEffect, useMemo } from 'react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase'; 
import { useUserAuth } from './context/AuthContext';
import LineChart from './components/LineChart';
import toast, { Toaster } from 'react-hot-toast'; 
import './App.css';

const Icons = {
  Youtube: () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ff3e3e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" /><path d="m10 15 5-3-5-3z" /></svg>,
  Sync: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /></svg>,
  Download: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  Target: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
};

function App() {
  const { user, logout, login, signup } = useUserAuth();
  const [activePlatform, setActivePlatform] = useState(null);
  const [channelId, setChannelId] = useState("");
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [labels, setLabels] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSetupRequired, setIsSetupRequired] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [compareId, setCompareId] = useState("");
  const [compareStats, setCompareStats] = useState(null);
  const [isComparing, setIsComparing] = useState(false);

  const [subGoal, setSubGoal] = useState(150000000); 
  const [velocity, setVelocity] = useState(0);
  const [milestones, setMilestones] = useState([]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) { setIsLoading(false); return; }
      try {
        const snap = await getDoc(doc(db, 'users', user.uid, 'profile', 'youtube'));
        if (snap.exists()) {
          setChannelId(snap.data().youtubeId);
          setIsSetupRequired(false);
        } else { setIsSetupRequired(true); }
      } catch (e) { setIsSetupRequired(true); }
      finally { setIsLoading(false); }
    };
    fetchProfile();
  }, [user]);

  useEffect(() => {
    let timer;
    if (activePlatform === 'youtube' && channelId) {
      const update = () => { if (!document.hidden) fetchAnalytics(channelId); };
      update();
      timer = setInterval(update, 60000); 
    }
    return () => clearInterval(timer);
  }, [activePlatform, channelId]);

  const fetchAnalytics = async (id) => {
    setIsSyncing(true);
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/youtube/${id}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const histRes = await fetch(`http://127.0.0.1:8000/api/history/${id}`);
      const histData = await histRes.json();
      setStats({ ...data });
      setHistory([...histData]);
      setLabels(histData.map(h => new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })));
      
      if (histData.length > 1) {
        const diff = histData[histData.length - 1].subscribers - histData[0].subscribers;
        setVelocity(diff > 0 ? diff : 0);
      }
    } catch (e) { toast.error(`Sync Failed`); } 
    finally { setTimeout(() => setIsSyncing(false), 800); }
  };

  const handleAuth = async () => {
    if (!email || !password) return toast.error("Enter all fields");
    const authPromise = isRegistering ? signup(email, password) : login(email, password);
    toast.promise(authPromise, {
      loading: 'Authenticating...',
      success: <b>Dashboard Ready!</b>,
      error: (err) => `Error: ${err.code.split('/')[1]}`,
    });
  };

  const chartData = useMemo(() => ({
    labels,
    datasets: [{
      label: 'Subscribers',
      data: history.map(h => h.subscribers),
      borderColor: '#ff3e3e',
      backgroundColor: 'rgba(255, 62, 62, 0.1)',
      fill: true,
      tension: 0.4
    }]
  }), [labels, history]);

  if (isLoading) return <div className="layout-centered-view"><h1 className="title-gradient">Loading...</h1></div>;

  /* --- RECTIFIED LOGIN SCREEN --- */
  if (!user) {
    return (
      <div className="layout-centered-view">
        <Toaster position="top-center" />
        <div className="container-centered auth-container">
          <div className="welcome-heading">
            <h2 className="title-white">Welcome to SocialDash</h2>
            <p className="text-dim">Analyze your dashboard</p>
          </div>
          <div className="glass-card auth-box">
            <h1 className="title-gradient">{isRegistering ? 'Create' : 'Login'}</h1>
            <input className="form-input" style={{marginTop: '20px'}} value={email} type="email" placeholder="Email" onChange={e => setEmail(e.target.value)} />
            <input className="form-input" style={{marginTop: '10px'}} type="password" value={password} placeholder="Password" onChange={e => setPassword(e.target.value)} />
            <button className="btn btn-primary btn-full" style={{marginTop: '20px'}} onClick={handleAuth}>
              {isRegistering ? 'Create' : 'Enter'}
            </button>
            <button className="btn-link" style={{marginTop: '15px'}} onClick={() => setIsRegistering(!isRegistering)}>
              {isRegistering ? 'Already have an account? Login' : 'Create an account'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!activePlatform) {
    return (
      <div className="layout-centered-view">
        <Toaster position="top-center" />
        <div className="container-wide container-centered">
          <h1 className="hub-main-title title-gradient">Social Hub</h1>
          <div className="hub-grid">
            <div className="hub-card glass-card" onClick={() => setActivePlatform('youtube')}>
              <Icons.Youtube />
              <h3>YouTube</h3>
              <p className="text-dim">Live Tracking</p>
            </div>
            {/* Locked Platforms */}
            <div className="hub-card glass-card is-disabled"><Icons.Youtube style={{filter: 'grayscale(1)'}} /><h3>Facebook</h3><p className="text-dim">Locked</p></div>
            <div className="hub-card glass-card is-disabled"><Icons.Youtube style={{filter: 'grayscale(1)'}} /><h3>Instagram</h3><p className="text-dim">Locked</p></div>
          </div>
          <button className="btn-secondary" style={{marginTop: '40px'}} onClick={logout}>Sign Out</button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Toaster position="bottom-right" />
      <aside className="sidebar">
        <button className="btn-link" style={{marginBottom: '20px'}} onClick={() => setActivePlatform(null)}>← HUB</button>
        <div className="sidebar-section">
          <p className="section-label">TARGET GOAL</p>
          <input className="form-input" type="number" value={subGoal} onChange={(e) => setSubGoal(e.target.value)} />
        </div>
        <div className="sidebar-footer text-dim">{user.email}</div>
      </aside>

      <main className="main-content">
        <div className="container-wide">
          <header className="dashboard-header">
            <h1 className="title-gradient">{stats?.title || "Studio"}</h1>
            <button className={`btn-sync ${isSyncing ? 'animate-spin' : ''}`} onClick={() => fetchAnalytics(channelId)}><Icons.Sync /></button>
          </header>

          <section className="metrics-grid">
            <div className="glass-card metric-card">
              <span className="text-dim">Subscribers</span>
              <h2 className="metric-value">{parseInt(stats?.subscribers || 0).toLocaleString()}</h2>
              <div className="status-indicator"><span className="pulse-indicator"></span><span className="live-label">LIVE</span></div>
            </div>
            <div className="glass-card metric-card">
              <span className="text-dim">Growth Velocity</span>
              <h2 className="metric-value">+{velocity}</h2>
              <p className="small-text">Session gain</p>
            </div>
            <div className="glass-card metric-card">
              <span className="text-dim">Global Views</span>
              <h2 className="metric-value">{parseInt(stats?.views || 0).toLocaleString()}</h2>
            </div>
          </section>

          {/* Corrected Progress Bar Math */}
          <section className="glass-card goal-section">
            <div className="goal-header">
              <div className="goal-target"><Icons.Target /><span>Goal to {parseInt(subGoal).toLocaleString()}</span></div>
              <span className="goal-percent">{Math.min((stats?.subscribers / subGoal) * 100, 100).toFixed(2)}%</span>
            </div>
            <div className="progress-bg">
              <div className="progress-fill" style={{ width: `${Math.min((stats?.subscribers / subGoal) * 100, 100)}%` }}></div>
            </div>
          </section>

          <div className="glass-card chart-section">
            <div className="chart-wrapper"><LineChart chartData={chartData} /></div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;