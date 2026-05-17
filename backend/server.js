const express = require('express');
const cors = require('cors');
const simulationEngine = require('./simulationEngine');
const alertEngine = require('./alertEngine');
const metricsExporter = require('./metricsExporter');

const app = express();
app.use(cors());
app.use(express.json()); // needed for POST request bodies
app.use((req, res, next) => {
  metricsExporter.recordApiRequest();
  next();
});

const wardBeds = {
  ICU: {
    totalBeds: 3,
    beds: [
      { bedId: "ICU-1", status: "occupied", patientId: "P001" },
      { bedId: "ICU-2", status: "occupied", patientId: "P002" },
      { bedId: "ICU-3", status: "available", patientId: null }
    ]
  },
  General: {
    totalBeds: 4,
    beds: [
      { bedId: "GEN-1", status: "occupied", patientId: "P003" },
      { bedId: "GEN-2", status: "occupied", patientId: "P004" },
      { bedId: "GEN-3", status: "available", patientId: null },
      { bedId: "GEN-4", status: "available", patientId: null }
    ]
  },
  Emergency: {
    totalBeds: 3,
    beds: [
      { bedId: "EMR-1", status: "occupied", patientId: "P005" },
      { bedId: "EMR-2", status: "occupied", patientId: "P006" },
      { bedId: "EMR-3", status: "available", patientId: null }
    ]
  }
};

let nextPatientId = 7;
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
      age: p.age,
      bedId: p.bedId,
      admittedAt: p.admittedAt,
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

app.get('/api/beds', (req, res) => {
  const result = {};
  for (const [ward, data] of Object.entries(wardBeds)) {
    const available = data.beds.filter(b => b.status === 'available').length;
    result[ward] = {
      total: data.totalBeds,
      available,
      occupied: data.totalBeds - available,
      beds: data.beds
    };
  }
  res.json(result);
});

app.post('/api/patients/admit', (req, res) => {
  const { name, age, condition, ward } = req.body;
  if (!wardBeds[ward]) {
    return res.status(400).json({ error: "Invalid ward" });
  }
  
  const availableBed = wardBeds[ward].beds.find(b => b.status === 'available');
  if (!availableBed) {
    return res.status(409).json({ error: `No beds available in ${ward}. Please choose another ward.` });
  }

  const newPatientId = `P00${nextPatientId++}`;
  availableBed.status = 'occupied';
  availableBed.patientId = newPatientId;

  const newPatient = {
    id: newPatientId,
    name,
    age: parseInt(age),
    condition,
    ward,
    bedId: availableBed.bedId,
    offset: Math.floor(Math.random() * 20) - 10,
    admittedAt: new Date().toISOString()
  };

  simulationEngine.addPatient(newPatient);
  res.json({ success: true, patient: newPatient });
});

app.post('/api/patients/:id/discharge', (req, res) => {
  const { id } = req.params;
  const patients = simulationEngine.getPatients();
  const patient = patients.find(p => p.id === id);
  
  if (!patient) return res.status(404).json({ error: "Patient not found" });

  const bed = wardBeds[patient.ward].beds.find(b => b.bedId === patient.bedId);
  if (bed) {
    bed.status = 'available';
    bed.patientId = null;
  }

  simulationEngine.removePatient(id);
  currentPatientsData = currentPatientsData.filter(p => p.id !== id);

  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    patientId: id,
    event: "PATIENT_DISCHARGED",
    ward: patient.ward,
    bedId: patient.bedId,
    message: `Bed ${patient.bedId} is now available`
  }));

  res.json({
    success: true,
    message: `Patient ${id} discharged. Bed ${patient.bedId} is now available.`,
    bedId: patient.bedId
  });
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
