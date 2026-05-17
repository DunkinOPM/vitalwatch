import { useState, useEffect } from 'react';
import WardOverview from './components/WardOverview';
import AlertFeed from './components/AlertFeed';
import AdmissionScreen from './components/AdmissionScreen';
import ChaosPanel from './components/ChaosPanel';
import { apiFetch, isAuditMode, setAuditMode, onAuditModeChange } from './api';

function App() {
  const [patients, setPatients] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [screen, setScreen] = useState('admission'); // 'admission' | 'dashboard' | 'chaos'
  const [auditMode, setAuditModeState] = useState(isAuditMode());

  useEffect(() => {
    const unsub = onAuditModeChange(setAuditModeState);
    return unsub;
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        const [patientsRes, alertsRes] = await Promise.all([
          apiFetch('/api/patients'),
          apiFetch('/api/alerts/history')
        ]);
        if (cancelled) return;
        if (patientsRes.ok) setPatients(await patientsRes.json());
        if (alertsRes.ok) setAlerts(await alertsRes.json());
      } catch (err) {
        console.error("Error fetching data", err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [auditMode]);

  if (screen === 'admission') {
    return <AdmissionScreen onEnterDashboard={() => setScreen('dashboard')} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <header style={{ padding: '16px', backgroundColor: '#1e293b', borderBottom: '1px solid #475569', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0, fontSize: '24px' }}>
          VitalWatch Dashboard
          {auditMode && (
            <span style={{ marginLeft: '12px', fontSize: '12px', padding: '4px 10px', backgroundColor: '#7c3aed', borderRadius: '4px', verticalAlign: 'middle' }}>
              🔒 AUDIT MODE — PII HASHED
            </span>
          )}
        </h1>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#cbd5e1', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={auditMode}
              onChange={(e) => setAuditMode(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            Audit Mode
          </label>
          <button onClick={() => setScreen(screen === 'chaos' ? 'dashboard' : 'chaos')} style={{ padding: '8px 16px', backgroundColor: screen === 'chaos' ? '#ef4444' : '#7c2d12', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
            {screen === 'chaos' ? '← Back to Dashboard' : '⚠ Chaos Dashboard'}
          </button>
          <button onClick={() => setScreen('admission')} style={{ padding: '8px 16px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
            + Admit Patient
          </button>
        </div>
      </header>

      <main style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
          {screen === 'chaos'
            ? <ChaosPanel />
            : <WardOverview patients={patients} />}
        </div>

        <div style={{ width: '400px' }}>
          <AlertFeed alerts={alerts} />
        </div>
      </main>
    </div>
  );
}
export default App;
