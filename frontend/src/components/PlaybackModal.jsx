import { useEffect, useRef, useState } from 'react';
import { apiFetch } from '../api';
import VitalCard from './VitalCard';

// Time-travel "Black Box" playback. Pulls the snapshot ring buffer from the
// backend and replays it second-by-second over the dashboard UI for one patient.
function PlaybackModal({ patient, onClose }) {
  const [snapshots, setSnapshots] = useState([]);
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1); // 1x = 1 tick/sec
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await apiFetch(`/api/patients/${patient.id}/playback?windowSec=300`);
        if (!cancelled) {
          if (res.ok) {
            const data = await res.json();
            setSnapshots(data.snapshots || []);
            setIdx(0);
          } else {
            setError(`Playback API returned ${res.status}`);
          }
        }
      } catch (err) {
        if (!cancelled) setError(String(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [patient.id]);

  useEffect(() => {
    if (!playing || snapshots.length === 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    const interval = Math.max(80, 1000 / playbackRate);
    timerRef.current = setInterval(() => {
      setIdx(prev => {
        if (prev >= snapshots.length - 1) {
          setPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, interval);
    return () => clearInterval(timerRef.current);
  }, [playing, playbackRate, snapshots.length]);

  const current = snapshots[idx];
  const overlay = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)', display: 'flex',
    alignItems: 'center', justifyContent: 'center', zIndex: 2000
  };
  const modal = {
    backgroundColor: '#1e293b', borderRadius: '8px', padding: '24px',
    maxWidth: '720px', width: '90%', maxHeight: '90vh', overflowY: 'auto',
    border: '2px solid #7c3aed'
  };
  const btn = (color) => ({ padding: '8px 14px', backgroundColor: color, color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', marginRight: '6px' });

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 style={{ margin: 0, color: '#c4b5fd' }}>📼 Black Box Playback</h2>
            <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>
              {patient.name} ({patient.id}) — {patient.ward} / {patient.bedId}
            </div>
          </div>
          <button onClick={onClose} style={{ ...btn('#475569'), marginRight: 0 }}>Close ✕</button>
        </div>

        {loading && <p style={{ color: '#94a3b8' }}>Loading buffered snapshots…</p>}
        {error && <p style={{ color: '#ef4444' }}>Error: {error}</p>}

        {!loading && !error && snapshots.length === 0 && (
          <p style={{ color: '#94a3b8' }}>No snapshots buffered yet — wait a few seconds for the simulator to populate the black box.</p>
        )}

        {current && (
          <>
            <div style={{ padding: '12px', backgroundColor: '#0f172a', borderRadius: '6px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ fontFamily: 'monospace', color: '#cbd5e1', fontSize: '13px' }}>
                  T-{snapshots.length - 1 - idx} ticks · {new Date(current.timestamp).toLocaleString()}
                </div>
                <span style={{
                  padding: '4px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', color: 'white',
                  backgroundColor: current.status === 'CRITICAL' ? '#ef4444' : current.status === 'WARNING' ? '#eab308' : '#22c55e'
                }}>
                  {current.status}
                </span>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                <VitalCard name="Heart Rate" value={current.vitals.heartRate} unit="bpm" normalMin={60} normalMax={100} />
                <VitalCard name="Blood Pressure" value={current.vitals.bloodPressure} unit="mmHg" normalMin={90} normalMax={120} />
                <VitalCard name="SpO2" value={current.vitals.spo2} unit="%" normalMin={95} normalMax={100} />
                <VitalCard name="Temperature" value={current.vitals.temperature} unit="°C" normalMin={36.5} normalMax={37.5} />
              </div>

              {current.alerts && current.alerts.length > 0 && (
                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #475569' }}>
                  <strong style={{ fontSize: '12px', color: '#94a3b8' }}>ALERTS AT THIS MOMENT:</strong>
                  <ul style={{ margin: '6px 0 0', paddingLeft: '20px', fontSize: '13px' }}>
                    {current.alerts.map((a, i) => (
                      <li key={i} style={{ color: a.level === 'CRITICAL' ? '#ef4444' : '#eab308' }}>
                        {a.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <input
              type="range"
              min={0}
              max={snapshots.length - 1}
              value={idx}
              onChange={(e) => { setIdx(parseInt(e.target.value)); setPlaying(false); }}
              style={{ width: '100%', marginBottom: '12px' }}
            />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <button style={btn(playing ? '#dc2626' : '#22c55e')} onClick={() => setPlaying(p => !p)}>
                  {playing ? '⏸ Pause' : '▶ Play'}
                </button>
                <button style={btn('#475569')} onClick={() => { setIdx(0); setPlaying(false); }}>⏮ Start</button>
                <button style={btn('#475569')} onClick={() => setIdx(i => Math.max(0, i - 1))}>← Step</button>
                <button style={btn('#475569')} onClick={() => setIdx(i => Math.min(snapshots.length - 1, i + 1))}>Step →</button>
              </div>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', fontSize: '13px', color: '#cbd5e1' }}>
                Speed:
                {[1, 2, 4, 8].map(rate => (
                  <button
                    key={rate}
                    onClick={() => setPlaybackRate(rate)}
                    style={{
                      ...btn(playbackRate === rate ? '#7c3aed' : '#334155'),
                      padding: '4px 10px', marginRight: 0
                    }}
                  >
                    {rate}×
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginTop: '12px', fontSize: '12px', color: '#64748b', textAlign: 'center' }}>
              Snapshot {idx + 1} / {snapshots.length} buffered from the past 5 minutes
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default PlaybackModal;
