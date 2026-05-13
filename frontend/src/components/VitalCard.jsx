import { useEffect, useRef } from 'react';

function VitalCard({ name, value, unit, normalMin, normalMax }) {
  const prevValueRef = useRef(value);
  
  useEffect(() => {
    prevValueRef.current = value;
  }, [value]);
  
  const prevValue = prevValueRef.current;
  
  let color = '#22c55e'; // green
  if (value < normalMin || value > normalMax) {
    // Check if it's way off to color it red, else yellow
    // Simplistic visual representation
    if (name === 'Heart Rate' && (value > 120 || value < 50)) color = '#ef4444';
    else if (name === 'SpO2' && value < 90) color = '#ef4444';
    else if (name === 'Temperature' && (value > 39 || value < 35)) color = '#ef4444';
    else if (name === 'Blood Pressure' && (value > 140 || value < 80)) color = '#ef4444';
    else color = '#eab308'; // warning
  }

  let trend = '→';
  if (value > prevValue) trend = '↑';
  else if (value < prevValue) trend = '↓';

  return (
    <div className="vital-card">
      <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>{name}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
        <span style={{ fontSize: '24px', fontWeight: 'bold', color }}>{value}</span>
        <span style={{ fontSize: '12px', color: '#64748b' }}>{unit}</span>
      </div>
      <div style={{ fontSize: '12px', marginTop: '4px', display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ color: '#94a3b8' }}>Norm: {normalMin}-{normalMax}</span>
        <span style={{ color }}>{trend}</span>
      </div>
    </div>
  );
}

export default VitalCard;
