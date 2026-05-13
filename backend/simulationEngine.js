const patients = [
  { id: "P001", name: "Patient 001", ward: "ICU", offset: 0 },
  { id: "P002", name: "Patient 002", ward: "ICU", offset: 8 },
  { id: "P003", name: "Patient 003", ward: "General", offset: -5 },
  { id: "P004", name: "Patient 004", ward: "General", offset: 12 },
  { id: "P005", name: "Patient 005", ward: "Emergency", offset: 15 },
  { id: "P006", name: "Patient 006", ward: "Emergency", offset: -3 }
];

const patientHistory = {}; // rolling history of last 5 readings
patients.forEach(p => patientHistory[p.id] = []);

function generateVitals(patient, timestamp) {
  const t = new Date(timestamp).getMinutes();
  const noise = () => (Math.random() - 0.5) * 5;
  const offset = patient.offset;

  return {
    heartRate:     Math.round(80 + offset * 0.3 + 10 * Math.sin((t * Math.PI) / 30) + noise()),
    bloodPressure: Math.round(110 + offset * 0.2 + 8  * Math.sin((t * Math.PI) / 30) + noise()),
    spo2:          parseFloat((97 + 1.5 * Math.sin((t * Math.PI) / 30) + noise() * 0.3).toFixed(1)),
    temperature:   parseFloat((37 + 0.4 * Math.sin((t * Math.PI) / 30) + noise() * 0.05).toFixed(1))
  };
}

function updateVitals() {
  const timestamp = new Date().toISOString();
  
  return patients.map(p => {
    const vitals = generateVitals(p, timestamp);
    
    patientHistory[p.id].push(vitals);
    if (patientHistory[p.id].length > 5) {
      patientHistory[p.id].shift();
    }
    
    return {
      ...p,
      vitals,
      timestamp
    };
  });
}

function getPatients() {
  return patients;
}

function getHistory(patientId) {
  return patientHistory[patientId] || [];
}

module.exports = {
  updateVitals,
  getPatients,
  getHistory
};
