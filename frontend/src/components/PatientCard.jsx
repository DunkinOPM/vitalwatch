import { useState } from 'react';
import VitalCard from './VitalCard';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function PatientCard({ patient }) {
  const [discharged, setDischarged] = useState(false);
  const statusColor = patient.status === 'CRITICAL' ? 'red' : patient.status === 'WARNING' ? 'yellow' : 'green';

  const handleDischarge = async (id) => {
    if (window.confirm(`Discharge ${patient.name}? Bed ${patient.bedId} will be freed immediately.`)) {
      try {
        const res = await fetch(`${API_URL}/api/patients/${id}/discharge`, { method: 'POST' });
        if (res.ok) {
          setDischarged(true);
          // Simple toast implementation via alert for now, or just let polling handle UI
          alert(`Patient discharged. Bed ${patient.bedId} is now available.`);
        } else {
          alert('Failed to discharge patient');
        }
      } catch (err) {
        console.error("Error discharging patient", err);
      }
    }
  };

  if (discharged) return null;

  return (
    <div className="patient-card" style={{ flex: '1 1 calc(50% - 16px)', minWidth: '300px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h4 style={{ margin: 0 }}>{patient.name} ({patient.id})</h4>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>Ward: {patient.ward} | Bed: {patient.bedId}</div>
        </div>
        <span className={`badge badge-${statusColor}`}>{patient.status}</span>
      </div>
      
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        <VitalCard name="Heart Rate" value={patient.vitals.heartRate} unit="bpm" normalMin={60} normalMax={100} />
        <VitalCard name="Blood Pressure" value={patient.vitals.bloodPressure} unit="mmHg" normalMin={90} normalMax={120} />
        <VitalCard name="SpO2" value={patient.vitals.spo2} unit="%" normalMin={95} normalMax={100} />
        <VitalCard name="Temperature" value={patient.vitals.temperature} unit="°C" normalMin={36.5} normalMax={37.5} />
      </div>

      {patient.alerts && patient.alerts.length > 0 && (
        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #475569' }}>
          <strong style={{ fontSize: '12px', color: '#94a3b8' }}>ACTIVE ALERTS:</strong>
          <ul style={{ margin: '8px 0 0', paddingLeft: '20px', fontSize: '14px' }}>
            {patient.alerts.map((alert, idx) => (
              <li key={idx} style={{ color: alert.level === 'CRITICAL' ? '#ef4444' : '#eab308' }}>
                {alert.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ marginTop: '16px', textAlign: 'right' }}>
        <button 
          onClick={() => handleDischarge(patient.id)}
          style={{ padding: '6px 12px', backgroundColor: 'transparent', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
          ❌ Discharge Patient
        </button>
      </div>
    </div>
  );
}

export default PatientCard;
