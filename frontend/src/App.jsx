import { useState, useEffect } from 'react';
import WardOverview from './components/WardOverview';
import AlertFeed from './components/AlertFeed';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function App() {
  const [patients, setPatients] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [activeView, setActiveView] = useState('wards'); // 'wards' | 'alerts'

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <header style={{ padding: '16px', backgroundColor: '#1e293b', borderBottom: '1px solid #475569', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0, fontSize: '24px' }}>VitalWatch Dashboard</h1>
        {/* Simple navigation to toggle activeView if needed for smaller screens, though we'll render side by side */}
        <div style={{ display: 'none' /* hidden for now as we are side by side */ }}>
           <button onClick={() => setActiveView('wards')}>Wards</button>
           <button onClick={() => setActiveView('alerts')}>Alerts</button>
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
