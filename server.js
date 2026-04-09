const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

// ── MOCK DATA ──────────────────────────────────────────────────────────────
const departments = ['CS', 'EE', 'Mech', 'Civil', 'MBA', 'Bio'];

const academicPerformance = [
  { year: '2020', avgGPA: 7.2, passRate: 84, toppers: 42 },
  { year: '2021', avgGPA: 7.5, passRate: 87, toppers: 51 },
  { year: '2022', avgGPA: 7.8, passRate: 89, toppers: 60 },
  { year: '2023', avgGPA: 8.0, passRate: 91, toppers: 74 },
  { year: '2024', avgGPA: 8.2, passRate: 93, toppers: 88 },
];

const departmentComparison = departments.map(dept => ({
  dept,
  avgGPA: +(7 + Math.random() * 1.5).toFixed(1),
  passRate: Math.round(80 + Math.random() * 15),
  facultyRatio: +(10 + Math.random() * 10).toFixed(1),
  researchOutput: Math.round(5 + Math.random() * 30),
  placementRate: Math.round(75 + Math.random() * 20),
}));

const enrollmentTrends = [
  { year: '2019', total: 3200, male: 1900, female: 1300 },
  { year: '2020', total: 3400, male: 1950, female: 1450 },
  { year: '2021', total: 3600, male: 2000, female: 1600 },
  { year: '2022', total: 3900, male: 2100, female: 1800 },
  { year: '2023', total: 4200, male: 2200, female: 2000 },
  { year: '2024', total: 4500, male: 2250, female: 2250 },
  // Predicted
  { year: '2025', total: 4800, male: 2300, female: 2500, predicted: true },
  { year: '2026', total: 5100, male: 2350, female: 2750, predicted: true },
];

const kpis = [
  { name: 'Overall pass rate', value: 91.4, unit: '%', target: 90, status: 'good' },
  { name: 'Faculty-student ratio', value: 1/18, unit: ':1', target: 1/20, status: 'good' },
  { name: 'Research publications', value: 142, unit: 'papers', target: 150, status: 'warning' },
  { name: 'Placement rate', value: 87.2, unit: '%', target: 85, status: 'good' },
  { name: 'Student satisfaction', value: 4.1, unit: '/5', target: 4.0, status: 'good' },
  { name: 'Dropout rate', value: 4.8, unit: '%', target: 5, status: 'good' },
  { name: 'Fee collection rate', value: 94.1, unit: '%', target: 95, status: 'warning' },
  { name: 'Library usage index', value: 62, unit: '%', target: 70, status: 'danger' },
];

const alerts = [
  { dept: 'Civil', issue: 'Pass rate dropped below 80%', severity: 'danger', date: '2024-11' },
  { dept: 'MBA', issue: 'Enrollment down 12% YoY', severity: 'warning', date: '2024-10' },
  { dept: 'Bio', issue: 'Research output below target', severity: 'warning', date: '2024-11' },
  { dept: 'EE', issue: 'Placement rate exceeded target', severity: 'success', date: '2024-11' },
];

// ── ROUTES ──────────────────────────────────────────────────────────────────
app.get('/api/academic-performance', (req, res) => res.json(academicPerformance));
app.get('/api/department-comparison', (req, res) => res.json(departmentComparison));
app.get('/api/enrollment-trends', (req, res) => res.json(enrollmentTrends));
app.get('/api/kpis', (req, res) => res.json(kpis));
app.get('/api/alerts', (req, res) => res.json(alerts));
app.get('/api/summary', (req, res) => res.json({
  totalStudents: 4500,
  totalFaculty: 250,
  departments: 6,
  avgGPA: 8.2,
  passRate: 91.4,
  placementRate: 87.2,
}));

app.listen(4000, () => console.log('API running on http://localhost:4000'));
