import { useState, useEffect } from 'react';
import WardOverview from './components/WardOverview';
import AlertFeed from './components/AlertFeed';
import AdmissionScreen from './components/AdmissionScreen';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function App() {
  const [patients, setPatients] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [activeView, setActiveView] = useState('wards'); // 'wards' | 'alerts'
  const [screen, setScreen] = useState('admission'); // 'admission' | 'dashboard'

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [patientsRes, alertsRes] = await Promise.all([
          fetch(`${API_URL}/api/patients`),
          fetch(`${API_URL}/api/alerts/history`)
        ]);
        if (patientsRes.ok) setPatients(await patientsRes.json());
        if (alertsRes.ok) setAlerts(await alertsRes.json());
      } catch (err) {
        console.error("Error fetching data", err);
      }
    };

    fetchData(); // initial fetch
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  if (screen === 'admission') {
    return <AdmissionScreen onEnterDashboard={() => setScreen('dashboard')} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <header style={{ padding: '16px', backgroundColor: '#1e293b', borderBottom: '1px solid #475569', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0, fontSize: '24px' }}>VitalWatch Dashboard</h1>
        <div>
           <button onClick={() => setScreen('admission')} style={{ padding: '8px 16px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>+ Admit Patient</button>
        </div>
      </header>

      <main style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
          <WardOverview patients={patients} />
        </div>
        
        <div style={{ width: '400px' }}>
          <AlertFeed alerts={alerts} />
        </div>
      </main>
    </div>
  );
}
export default App;
