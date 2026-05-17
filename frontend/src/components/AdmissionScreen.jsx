import { useState, useEffect } from 'react';
import { apiFetch } from '../api';

function AdmissionScreen({ onEnterDashboard }) {
  const [beds, setBeds] = useState(null);
  const [formData, setFormData] = useState({ name: '', age: '', condition: 'Stable', ward: 'ICU' });
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchBeds = async () => {
    try {
      const res = await apiFetch('/api/beds');
      if (res.ok) setBeds(await res.json());
    } catch (err) {
      console.error("Error fetching beds", err);
    }
  };

  useEffect(() => {
    fetchBeds();
    const interval = setInterval(fetchBeds, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiFetch('/api/patients/admit', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setToast(`✅ Patient admitted to ${formData.ward} — Bed ${data.patient.bedId} assigned`);
        setFormData({ name: '', age: '', condition: 'Stable', ward: 'ICU' });
        fetchBeds();
        setTimeout(() => setToast(null), 3000);
      } else {
        alert(data.error || "Failed to admit patient");
      }
    } catch (err) {
      console.error("Error admitting patient", err);
      alert("Network error admitting patient");
    } finally {
      setLoading(false);
    }
  };

  const selectedWardIsFull = beds && beds[formData.ward] && beds[formData.ward].available === 0;

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto', color: '#f8fafc' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '32px' }}>🏥 VitalWatch — Patient Admission</h1>

      {toast && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', backgroundColor: '#22c55e', color: 'white', padding: '16px', borderRadius: '8px', zIndex: 1000, boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          {toast}
        </div>
      )}

      <div style={{ backgroundColor: '#1e293b', padding: '24px', borderRadius: '8px', marginBottom: '24px' }}>
        <h2 style={{ marginTop: 0, borderBottom: '1px solid #475569', paddingBottom: '12px' }}>Ward Availability</h2>
        {!beds ? <p>Loading beds...</p> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {['ICU', 'General', 'Emergency'].map(ward => {
              const data = beds[ward];
              if (!data) return null;
              const isFull = data.available === 0;
              return (
                <div key={ward} style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ width: '100px', fontWeight: 'bold' }}>{ward}</div>
                  <div style={{ display: 'flex', gap: '4px', marginRight: '16px' }}>
                    {Array.from({ length: data.total }).map((_, i) => (
                      <div key={i} style={{
                        width: '24px', height: '24px', borderRadius: '4px',
                        backgroundColor: i < data.occupied ? (isFull ? '#ef4444' : '#64748b') : '#22c55e'
                      }}></div>
                    ))}
                  </div>
                  <div style={{ color: isFull ? '#ef4444' : '#22c55e' }}>
                    {data.occupied}/{data.total} beds occupied
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ backgroundColor: '#1e293b', padding: '24px', borderRadius: '8px', marginBottom: '24px' }}>
        <h2 style={{ marginTop: 0, borderBottom: '1px solid #475569', paddingBottom: '12px' }}>Admit New Patient</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px' }}>Name:</label>
            <input required type="text" name="name" value={formData.name} onChange={handleInputChange} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #475569', backgroundColor: '#0f172a', color: 'white' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px' }}>Age:</label>
            <input required type="number" min="1" max="120" name="age" value={formData.age} onChange={handleInputChange} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #475569', backgroundColor: '#0f172a', color: 'white' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px' }}>Condition:</label>
            <select name="condition" value={formData.condition} onChange={handleInputChange} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #475569', backgroundColor: '#0f172a', color: 'white' }}>
              <option value="Stable">Stable</option>
              <option value="Moderate">Moderate</option>
              <option value="Critical">Critical</option>
              <option value="Post-Surgery">Post-Surgery</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px' }}>Ward:</label>
            <select name="ward" value={formData.ward} onChange={handleInputChange} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #475569', backgroundColor: '#0f172a', color: 'white' }}>
              <option value="ICU">ICU</option>
              <option value="General">General</option>
              <option value="Emergency">Emergency</option>
            </select>
            {selectedWardIsFull && (
              <div style={{ color: '#ef4444', fontSize: '14px', marginTop: '8px' }}>
                ⚠️ {formData.ward} is currently full. Please select another ward.
              </div>
            )}
          </div>

          <button type="submit" disabled={selectedWardIsFull || loading} style={{ padding: '12px', backgroundColor: selectedWardIsFull ? '#64748b' : '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: selectedWardIsFull ? 'not-allowed' : 'pointer', fontWeight: 'bold', marginTop: '16px' }}>
            {loading ? 'Admitting...' : 'Admit Patient'}
          </button>
        </form>
      </div>

      <div style={{ textAlign: 'center' }}>
        <button onClick={onEnterDashboard} style={{ padding: '12px 24px', backgroundColor: 'transparent', color: '#3b82f6', border: '1px solid #3b82f6', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
          Go to Dashboard →
        </button>
      </div>
    </div>
  );
}

export default AdmissionScreen;
