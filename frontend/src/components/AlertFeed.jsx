import { useEffect, useRef } from 'react';

function AlertFeed({ alerts }) {
  const feedRef = useRef(null);

  // Auto-scroll to latest (which are at the top usually based on history, or bottom if we append)
  // Our backend sends latest at index 0 (unshifted)
  
  return (
    <div className="alert-feed" ref={feedRef}>
      <h2 style={{ marginTop: 0 }}>Live Alert Feed</h2>
      
      {alerts.length === 0 ? (
        <p style={{ color: '#94a3b8' }}>No recent alerts.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {alerts.map((alert, idx) => {
            const isCritical = alert.level === 'CRITICAL';
            return (
              <div key={idx} className={`alert-row ${isCritical ? 'critical' : 'warning'}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span className={`badge ${isCritical ? 'badge-red' : 'badge-yellow'}`}>
                    {alert.level}
                  </span>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                
                <div style={{ marginBottom: '4px' }}>
                  <strong>{alert.patientId}</strong> - <span style={{ fontSize: '12px', padding: '2px 6px', backgroundColor: '#475569', borderRadius: '4px' }}>{alert.type}</span>
                </div>
                
                <div style={{ fontSize: '14px' }}>
                  {alert.message}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default AlertFeed;
