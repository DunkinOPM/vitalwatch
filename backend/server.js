const express = require('express');
const cors = require('cors');
const simulationEngine = require('./simulationEngine');
const alertEngine = require('./alertEngine');
const metricsExporter = require('./metricsExporter');

const app = express();
app.use(cors());
app.use((req, res, next) => {
  metricsExporter.recordApiRequest();
  next();
});

let currentPatientsData = [];

// Tick every 3 seconds
setInterval(() => {
  const updated = simulationEngine.updateVitals();
  let allNewAlerts = [];
  
  currentPatientsData = updated.map(p => {
    const history = simulationEngine.getHistory(p.id);
    const { activeAlerts, overallStatus } = alertEngine.evaluateAlerts(p, p.vitals, history, p.timestamp);
    allNewAlerts = allNewAlerts.concat(activeAlerts);
    
    return {
      id: p.id,
      name: p.name,
      ward: p.ward,
      vitals: p.vitals,
      alerts: activeAlerts,
      status: overallStatus
    };
  });
  
  metricsExporter.updateAlertMetrics(alertEngine.getActiveAlerts(), allNewAlerts);
}, 3000);

// Initialize right away
setTimeout(() => {
  const updated = simulationEngine.updateVitals();
  currentPatientsData = updated.map(p => {
    return { ...p, status: "INFO", alerts: [] };
  });
}, 0);


app.get('/api/patients', (req, res) => {
  res.json(currentPatientsData);
});

app.get('/api/patients/:id', (req, res) => {
  const p = currentPatientsData.find(x => x.id === req.params.id);
  if (!p) return res.status(404).json({ error: 'Patient not found' });
  
  const alertHistory = alertEngine.getPatientAlerts(p.id);
  res.json({
    ...p,
    alertHistory
  });
});

app.get('/api/alerts', (req, res) => {
  res.json(alertEngine.getActiveAlerts());
});

app.get('/api/alerts/history', (req, res) => {
  res.json(alertEngine.getAlertsHistory());
});

app.get('/api/wards', (req, res) => {
  const wardsData = {};
  currentPatientsData.forEach(p => {
    if (!wardsData[p.ward]) {
      wardsData[p.ward] = { ward: p.ward, patientCount: 0, sumHeartRate: 0, criticalCount: 0 };
    }
    wardsData[p.ward].patientCount++;
    wardsData[p.ward].sumHeartRate += p.vitals.heartRate;
    if (p.status === 'CRITICAL') {
      wardsData[p.ward].criticalCount++;
    }
  });

  const result = Object.values(wardsData).map(w => ({
    ward: w.ward,
    patientCount: w.patientCount,
    avgHeartRate: Math.round(w.sumHeartRate / w.patientCount),
    criticalCount: w.criticalCount
  }));
  res.json(result);
});

app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', metricsExporter.register.contentType);
    res.end(await metricsExporter.register.metrics());
  } catch (ex) {
    res.status(500).end(ex.message);
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`VitalWatch Backend running on port ${PORT}`);
});
