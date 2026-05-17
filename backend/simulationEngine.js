let patients = [
  { id: "P001", name: "Patient P001", age: 45, ward: "ICU", bedId: "ICU-1", offset: 0, admittedAt: new Date().toISOString() },
  { id: "P002", name: "Patient P002", age: 62, ward: "ICU", bedId: "ICU-2", offset: 8, admittedAt: new Date().toISOString() },
  { id: "P003", name: "Patient P003", age: 34, ward: "General", bedId: "GEN-1", offset: -5, admittedAt: new Date().toISOString() },
  { id: "P004", name: "Patient P004", age: 50, ward: "General", bedId: "GEN-2", offset: 12, admittedAt: new Date().toISOString() },
  { id: "P005", name: "Patient P005", age: 28, ward: "Emergency", bedId: "EMR-1", offset: 15, admittedAt: new Date().toISOString() },
  { id: "P006", name: "Patient P006", age: 71, ward: "Emergency", bedId: "EMR-2", offset: -3, admittedAt: new Date().toISOString() }
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

function addPatient(patient) {
  patients.push(patient);
  patientHistory[patient.id] = [];
}

function removePatient(patientId) {
  patients = patients.filter(p => p.id !== patientId);
  delete patientHistory[patientId];
}

module.exports = {
  updateVitals,
  getPatients,
  getHistory,
  addPatient,
  removePatient
};
