import VitalCard from './VitalCard';

function PatientCard({ patient }) {
  const statusColor = patient.status === 'CRITICAL' ? 'red' : patient.status === 'WARNING' ? 'yellow' : 'green';

  return (
    <div className="patient-card" style={{ flex: '1 1 calc(50% - 16px)', minWidth: '300px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h4 style={{ margin: 0 }}>{patient.name} ({patient.id})</h4>
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
    </div>
  );
}

export default PatientCard;
