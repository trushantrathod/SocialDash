import React, { useState, useEffect, useMemo } from 'react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase'; 
import { useUserAuth } from './context/AuthContext';
import LineChart from './components/LineChart';
import './App.css';

const Icons = {
  Youtube: () => <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ff0000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" /><path d="m10 15 5-3-5-3z" /></svg>,
  Facebook: () => <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#1877f2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>,
  Instagram: () => <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#d62976" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" /></svg>,
  Sync: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /></svg>
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

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) { setIsLoading(false); return; }
      try {
        const docRef = doc(db, 'users', user.uid, 'profile', 'youtube');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setChannelId(snap.data().youtubeId);
          setIsSetupRequired(false);
        } else { setIsSetupRequired(true); }
      } catch (e) { setIsSetupRequired(true); }
      finally { setIsLoading(false); }
    };
    fetchProfile();
  }, [user]);

  // OPTIMIZED POLLING: 60s interval + Page Visibility Check
  useEffect(() => {
    let timer;
    if (activePlatform === 'youtube' && channelId) {
      const update = () => {
        if (!document.hidden) { // Only fetch if user is looking at the tab
          fetchAnalytics(channelId);
          if (isComparing && compareId) fetchComparison(compareId);
        }
      };
      update();
      timer = setInterval(update, 60000); 
    }
    return () => clearInterval(timer);
  }, [activePlatform, channelId, isComparing, compareId]);

  const fetchAnalytics = async (id) => {
    setIsSyncing(true);
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/youtube/${id}`);
      const data = await res.json();
      const histRes = await fetch(`http://127.0.0.1:8000/api/history/${id}`);
      const histData = await histRes.json();
      setStats(data);
      setHistory(histData);
      setLabels(histData.map(h => new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })));
    } catch (e) { console.error("Fetch Error:", e); }
    finally { setTimeout(() => setIsSyncing(false), 800); }
  };

  const fetchComparison = async (id) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/youtube/${id}`);
      const data = await res.json();
      if (!data.error) setCompareStats(data);
    } catch (e) { console.error(e); }
  };

  const handleLink = async () => {
    if (!channelId || !user) return;
    await setDoc(doc(db, 'users', user.uid, 'profile', 'youtube'), { youtubeId: channelId });
    setIsSetupRequired(false);
    setActivePlatform('youtube');
  };

  const chartData = useMemo(() => ({
    labels,
    datasets: [{
      label: 'Subscribers',
      data: history.map(h => h.subscribers),
      borderColor: '#ff0000',
      backgroundColor: 'rgba(255, 0, 0, 0.1)',
      fill: true,
      tension: 0.3,
      pointRadius: 2
    }]
  }), [labels, history]);

  if (isLoading) return <div className="layout-centered-view"><h1>Syncing...</h1></div>;

  if (!user) {
    return (
      <div className="layout-centered-view">
        <div className="glass-card auth-box">
          <h1 className="title-gradient">{isRegistering ? 'Join' : 'Vault'}</h1>
          <div style={{margin: '20px 0'}}>
            <input className="form-input" style={{marginBottom: '10px'}} type="email" placeholder="Email" onChange={e => setEmail(e.target.value)} />
            <input className="form-input" type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} />
          </div>
          <button className="btn btn-primary" style={{width: '100%'}} onClick={() => isRegistering ? signup(email, password) : login(email, password)}>
            {isRegistering ? 'Initialize' : 'Enter'}
          </button>
          <button className="btn-link" onClick={() => setIsRegistering(!isRegistering)}>Switch Mode</button>
        </div>
      </div>
    );
  }

  if (isSetupRequired) {
    return (
      <div className="layout-centered-view">
        <div className="glass-card auth-box">
          <Icons.Youtube />
          <h1 className="title-gradient">Setup</h1>
          <input className="form-input" style={{margin: '20px 0'}} placeholder="YouTube ID (UC...)" value={channelId} onChange={e => setChannelId(e.target.value)} />
          <button className="btn btn-primary" style={{width: '100%'}} onClick={handleLink}>Link Account</button>
        </div>
      </div>
    );
  }

  if (!activePlatform) {
    return (
      <div className="layout-centered-view">
        <div className="container-wide">
          <h1 className="hub-main-title title-gradient">Social Hub</h1>
          <div className="hub-grid">
            <div className="hub-card glass-card" onClick={() => setActivePlatform('youtube')}>
              <Icons.Youtube />
              <h3>YouTube</h3>
              <p className="text-dim">Live Tracking</p>
            </div>
            <div className="hub-card glass-card is-disabled"><Icons.Facebook /><h3>Facebook</h3><p className="text-dim">Locked</p></div>
            <div className="hub-card glass-card is-disabled"><Icons.Instagram /><h3>Instagram</h3><p className="text-dim">Locked</p></div>
          </div>
          <button className="btn btn-secondary" style={{marginTop: '40px'}} onClick={logout}>Sign Out</button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button className="btn btn-link" onClick={() => { setActivePlatform(null); setIsComparing(false); setCompareStats(null); }}>← HUB</button>
        <div style={{marginTop: '2.5rem'}}>
          <p className="text-dim" style={{fontSize: '0.75rem', fontWeight: 800, marginBottom: '1rem'}}>COMPARE</p>
          <input className="form-input" placeholder="Channel ID" value={compareId} onChange={(e) => setCompareId(e.target.value)} />
          <button className="btn btn-primary" style={{marginTop: '10px', width: '100%'}} onClick={() => { setIsComparing(true); fetchComparison(compareId); }}>Compare</button>
          {isComparing && <button className="btn-link" style={{fontSize: '0.8rem'}} onClick={() => { setIsComparing(false); setCompareStats(null); }}>Reset</button>}
        </div>
        <div className="sidebar-footer text-dim" style={{marginTop: 'auto'}}>{user.email}</div>
      </aside>

      <main className="main-content">
        <div className="container-wide">
          <header className="dashboard-header" style={{display: 'flex', justifyContent: 'space-between', marginBottom: '3rem'}}>
            <h1 className="title-gradient">{isComparing ? "Comparison" : (stats?.title || "Studio")}</h1>
            <button className={`btn-sync ${isSyncing ? 'animate-spin' : ''}`} onClick={() => fetchAnalytics(channelId)}><Icons.Sync /></button>
          </header>

          <section className="metrics-grid">
            <div className="glass-card metric-card">
              <span className="text-dim">{isComparing ? stats?.title : "Subscribers"}</span>
              <h2 className="metric-value">{parseInt(stats?.subscribers || 0).toLocaleString()}</h2>
              <div style={{marginTop: '10px'}}><span className="pulse-indicator"></span><span style={{fontSize: '0.7rem', fontWeight: 800}}>LIVE</span></div>
            </div>

            {isComparing && compareStats ? (
              <div className="glass-card metric-card" style={{border: '1px solid var(--clr-text-dim)'}}>
                <span className="text-dim">{compareStats.title}</span>
                <h2 className="metric-value">{parseInt(compareStats.subscribers || 0).toLocaleString()}</h2>
              </div>
            ) : (
              <div className="glass-card metric-card">
                <span className="text-dim">Global Views</span>
                <h2 className="metric-value">{parseInt(stats?.views || 0).toLocaleString()}</h2>
              </div>
            )}
          </section>

          <div className="glass-card chart-section" style={{padding: '2rem'}}>
            <div className="chart-wrapper"><LineChart chartData={chartData} /></div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;