import { useState, useEffect } from 'react';
import PatientCard from './PatientCard';
import { apiFetch } from '../api';

function WardOverview({ patients }) {
  const [beds, setBeds] = useState(null);
  const wards = ['ICU', 'General', 'Emergency'];

  useEffect(() => {
    const fetchBeds = async () => {
      try {
        const res = await apiFetch('/api/beds');
        if (res.ok) setBeds(await res.json());
      } catch (err) {
        console.error("Error fetching beds", err);
      }
    };
    fetchBeds();
    const interval = setInterval(fetchBeds, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <h2>Ward Overview</h2>
      {wards.map(ward => {
        const wardPatients = patients.filter(p => p.ward === ward);
        if (wardPatients.length === 0) return null;

        const hasCritical = wardPatients.some(p => p.status === 'CRITICAL');
        const hasWarning = wardPatients.some(p => p.status === 'WARNING');

        let badgeClass = 'badge-green';
        let badgeText = '0 Alerts';
        let alertCount = wardPatients.reduce((sum, p) => sum + (p.alerts ? p.alerts.length : 0), 0);

        if (hasCritical) { badgeClass = 'badge-red'; badgeText = `${alertCount} Active Alerts`; }
        else if (hasWarning) { badgeClass = 'badge-yellow'; badgeText = `${alertCount} Active Alerts`; }

        return (
          <div key={ward} className="ward-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0 }}>
                {ward} Ward {beds && beds[ward] ? `— ${beds[ward].occupied}/${beds[ward].total} beds occupied` : `(${wardPatients.length} Patients)`}
              </h3>
              <span className={`badge ${badgeClass}`}>{badgeText}</span>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
              {wardPatients.map(patient => (
                <PatientCard key={patient.id} patient={patient} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default WardOverview;
