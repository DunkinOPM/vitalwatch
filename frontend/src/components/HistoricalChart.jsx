import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';
import { apiFetch } from '../api';

function HistoricalChart({ patientId, refreshMs = 5000 }) {
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await apiFetch(`/api/patients/${patientId}/history?points=120`);
        if (!cancelled && res.ok) {
          const data = await res.json();
          const formatted = (data.points || []).map(p => ({
            time: new Date(p.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            heartRate: p.heartRate,
            spo2: p.spo2
          }));
          setPoints(formatted);
        }
      } catch (err) {
        console.error('Error fetching patient history', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    const interval = setInterval(load, refreshMs);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [patientId, refreshMs]);

  if (loading && points.length === 0) {
    return <div style={{ height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '12px' }}>Loading history…</div>;
  }

  if (points.length < 2) {
    return <div style={{ height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '12px' }}>Collecting data…</div>;
  }

  return (
    <div style={{ width: '100%', height: '160px', marginTop: '12px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
          <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#94a3b8' }} interval="preserveStartEnd" minTickGap={40} />
          <YAxis yAxisId="hr" orientation="left" tick={{ fontSize: 10, fill: '#f87171' }} domain={['auto', 'auto']} width={32} />
          <YAxis yAxisId="spo2" orientation="right" tick={{ fontSize: 10, fill: '#60a5fa' }} domain={[80, 100]} width={32} />
          <Tooltip
            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #475569', borderRadius: '4px', fontSize: '12px' }}
            labelStyle={{ color: '#cbd5e1' }}
          />
          <Legend wrapperStyle={{ fontSize: '11px' }} />
          <Line yAxisId="hr" type="monotone" dataKey="heartRate" stroke="#f87171" dot={false} strokeWidth={2} name="HR (bpm)" isAnimationActive={false} />
          <Line yAxisId="spo2" type="monotone" dataKey="spo2" stroke="#60a5fa" dot={false} strokeWidth={2} name="SpO2 (%)" isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default HistoricalChart;
