import { useState, useEffect } from 'react';
import { apiFetch } from '../api';

const wardOptions = ['ICU', 'General', 'Emergency'];

function ChaosPanel() {
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState([]);

  const fetchStatus = async () => {
    try {
      const res = await apiFetch('/api/admin/chaos/status');
      if (res.ok) setStatus(await res.json());
    } catch (err) {
      console.error('Error fetching chaos status', err);
    }
  };

  useEffect(() => {
    fetchStatus();
    const i = setInterval(fetchStatus, 2000);
    return () => clearInterval(i);
  }, []);

  const trigger = async (payload, label) => {
    setBusy(true);
    try {
      const res = await apiFetch('/api/admin/chaos', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      const ok = res.ok && data.success;
      setLog(prev => [
        { ts: new Date().toLocaleTimeString(), label, ok, payload },
        ...prev
      ].slice(0, 20));
      await fetchStatus();
    } catch (err) {
      console.error('Chaos trigger failed', err);
      setLog(prev => [
        { ts: new Date().toLocaleTimeString(), label, ok: false, payload, error: String(err) },
        ...prev
      ].slice(0, 20));
    } finally {
      setBusy(false);
    }
  };

  const sectionStyle = { backgroundColor: '#1e293b', padding: '20px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #475569' };
  const btnStyle = (color) => ({ padding: '10px 14px', backgroundColor: color, color: 'white', border: 'none', borderRadius: '4px', cursor: busy ? 'wait' : 'pointer', fontWeight: 'bold', opacity: busy ? 0.6 : 1, marginRight: '8px', marginBottom: '8px' });

  return (
    <div>
      <h2 style={{ marginTop: 0, color: '#fca5a5' }}>⚠ Chaos Dashboard — Resilience Testing</h2>
      <p style={{ color: '#cbd5e1', maxWidth: '720px' }}>
        Trigger simulated mass-casualty events and infrastructure failures. Watch the Kubernetes HPA spin up
        new backend pods on Grafana as the data throughput surges. Hit Reset to return to normal operation.
      </p>

      <div style={sectionStyle}>
        <h3 style={{ marginTop: 0 }}>Current State</h3>
        {status ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', color: '#e2e8f0', fontSize: '14px' }}>
            <div><strong>Simulation Speed:</strong> {status.speedMultiplier}× <span style={{ color: '#94a3b8' }}>({status.tickIntervalMs}ms ticks)</span></div>
            <div><strong>Patients Monitored:</strong> {status.patientCount}</div>
            <div>
              <strong>Power Failures:</strong>{' '}
              {status.powerFailures.length === 0
                ? <span style={{ color: '#22c55e' }}>none</span>
                : status.powerFailures.map(p => <span key={p.ward} style={{ color: '#ef4444', marginRight: '8px' }}>{p.ward} ({p.remainingSec}s)</span>)
              }
            </div>
            <div>
              <strong>Vital Surges:</strong>{' '}
              {status.surges.length === 0
                ? <span style={{ color: '#22c55e' }}>none</span>
                : status.surges.map(s => <span key={s.ward} style={{ color: '#eab308', marginRight: '8px' }}>{s.ward} ({s.remainingSec}s)</span>)
              }
            </div>
          </div>
        ) : <p style={{ color: '#94a3b8' }}>Loading chaos state…</p>}
      </div>

      <div style={sectionStyle}>
        <h3 style={{ marginTop: 0 }}>1. Simulation Speed (Data Throughput Stress)</h3>
        <p style={{ color: '#94a3b8', fontSize: '13px' }}>
          Multiplies the tick rate, increasing CPU + memory on backend pods so the HPA scales out.
        </p>
        <button disabled={busy} style={btnStyle('#f97316')} onClick={() => trigger({ type: 'speed', multiplier: 5 }, '5× speed')}>5× Speed</button>
        <button disabled={busy} style={btnStyle('#dc2626')} onClick={() => trigger({ type: 'speed', multiplier: 10 }, '10× speed')}>10× Speed</button>
        <button disabled={busy} style={btnStyle('#7f1d1d')} onClick={() => trigger({ type: 'speed', multiplier: 20 }, '20× speed')}>20× Speed (extreme)</button>
        <button disabled={busy} style={btnStyle('#0ea5e9')} onClick={() => trigger({ type: 'speed', multiplier: 1 }, 'normal speed')}>Normal (1×)</button>
      </div>

      <div style={sectionStyle}>
        <h3 style={{ marginTop: 0 }}>2. Ward Power Failure</h3>
        <p style={{ color: '#94a3b8', fontSize: '13px' }}>
          Knocks out monitors in a ward for 30 seconds — vitals flatline to 0, tripping critical alerts.
        </p>
        {wardOptions.map(w => (
          <button key={w} disabled={busy} style={btnStyle('#dc2626')} onClick={() => trigger({ type: 'power_failure', ward: w, durationSec: 30 }, `${w} power failure`)}>
            ⚡ Simulate {w} Power Failure
          </button>
        ))}
      </div>

      <div style={sectionStyle}>
        <h3 style={{ marginTop: 0 }}>3. Mass Admission Event</h3>
        <p style={{ color: '#94a3b8', fontSize: '13px' }}>
          Admits 50 critically-ill patients to a ward at once. Combined with 10× speed this is the canonical
          load test — the HPA should spin up new backend pods within ~30s.
        </p>
        <button disabled={busy} style={btnStyle('#dc2626')} onClick={() => trigger({ type: 'mass_admission', ward: 'Emergency', count: 50 }, '50 ER admissions')}>
          🚑 Simulate 50 Sudden ER Admissions
        </button>
        <button disabled={busy} style={btnStyle('#dc2626')} onClick={() => trigger({ type: 'mass_admission', ward: 'ICU', count: 20 }, '20 ICU admissions')}>
          🚑 Simulate 20 ICU Admissions
        </button>
      </div>

      <div style={sectionStyle}>
        <h3 style={{ marginTop: 0 }}>4. Vital Surge (existing patients)</h3>
        <p style={{ color: '#94a3b8', fontSize: '13px' }}>
          Pushes vitals of existing patients in a ward toward critical thresholds.
        </p>
        {wardOptions.map(w => (
          <button key={w} disabled={busy} style={btnStyle('#b45309')} onClick={() => trigger({ type: 'surge', ward: w, durationSec: 60 }, `${w} surge`)}>
            📈 Vital Surge — {w}
          </button>
        ))}
      </div>

      <div style={sectionStyle}>
        <h3 style={{ marginTop: 0 }}>Reset</h3>
        <button disabled={busy} style={btnStyle('#22c55e')} onClick={() => trigger({ type: 'reset' }, 'reset all chaos')}>
          ✓ Reset All Chaos
        </button>
      </div>

      <div style={sectionStyle}>
        <h3 style={{ marginTop: 0 }}>Recent Triggers</h3>
        {log.length === 0
          ? <p style={{ color: '#94a3b8' }}>No chaos triggered yet.</p>
          : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontFamily: 'monospace', fontSize: '13px' }}>
              {log.map((entry, idx) => (
                <li key={idx} style={{ padding: '6px 0', borderBottom: '1px solid #334155', color: entry.ok ? '#cbd5e1' : '#ef4444' }}>
                  <span style={{ color: '#64748b' }}>{entry.ts}</span> — {entry.ok ? '✓' : '✗'} {entry.label}
                </li>
              ))}
            </ul>
          )
        }
      </div>
    </div>
  );
}

export default ChaosPanel;
