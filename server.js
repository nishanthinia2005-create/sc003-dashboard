'use strict';

require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const morgan     = require('morgan');
const helmet     = require('helmet');
const rateLimit  = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');

const app  = express();
const PORT = process.env.PORT || 4000;

// ── MIDDLEWARE ───────────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.ALLOWED_ORIGIN || '*' }));
app.use(express.json());
app.use(morgan('dev'));

// Rate limiter: max 100 requests / 15 min per IP
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, standardHeaders: true, legacyHeaders: false });
app.use('/api/', limiter);

// ── SEED RNG (reproducible randoms) ─────────────────────────────────────────
let seed = 42;
function seededRand() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }

// ── STATIC DATA ──────────────────────────────────────────────────────────────
const DEPARTMENTS = ['CS', 'EE', 'Mech', 'Civil', 'MBA', 'Bio'];

const academicPerformance = [
  { year: '2019', avgGPA: 6.9, passRate: 81, toppers: 35, avgAttendance: 78 },
  { year: '2020', avgGPA: 7.2, passRate: 84, toppers: 42, avgAttendance: 80 },
  { year: '2021', avgGPA: 7.5, passRate: 87, toppers: 51, avgAttendance: 82 },
  { year: '2022', avgGPA: 7.8, passRate: 89, toppers: 60, avgAttendance: 84 },
  { year: '2023', avgGPA: 8.0, passRate: 91, toppers: 74, avgAttendance: 86 },
  { year: '2024', avgGPA: 8.2, passRate: 93, toppers: 88, avgAttendance: 88 },
];

const departmentData = DEPARTMENTS.map((dept, i) => {
  seed = 42 + i * 17; // deterministic per dept
  return {
    dept,
    avgGPA:         +(7 + seededRand() * 1.5).toFixed(1),
    passRate:       Math.round(80 + seededRand() * 15),
    facultyRatio:   +(10 + seededRand() * 10).toFixed(1),
    researchOutput: Math.round(5 + seededRand() * 30),
    placementRate:  Math.round(75 + seededRand() * 20),
    budget:         Math.round(20 + seededRand() * 80),    // lakhs
    studentCount:   Math.round(200 + seededRand() * 600),
    activeProjects: Math.round(2 + seededRand() * 15),
  };
});

const enrollmentTrends = [
  { year: '2019', total: 3200, male: 1900, female: 1300, international: 40,  dropouts: 96 },
  { year: '2020', total: 3400, male: 1950, female: 1450, international: 55,  dropouts: 88 },
  { year: '2021', total: 3600, male: 2000, female: 1600, international: 72,  dropouts: 79 },
  { year: '2022', total: 3900, male: 2100, female: 1800, international: 90,  dropouts: 70 },
  { year: '2023', total: 4200, male: 2200, female: 2000, international: 115, dropouts: 63 },
  { year: '2024', total: 4500, male: 2250, female: 2250, international: 140, dropouts: 55 },
  { year: '2025', total: 4800, male: 2300, female: 2500, international: 170, dropouts: null, predicted: true },
  { year: '2026', total: 5100, male: 2350, female: 2750, international: 200, dropouts: null, predicted: true },
];

const kpis = [
  { id: 'pass-rate',        name: 'Overall pass rate',       value: 91.4,  unit: '%',      target: 90,   status: 'good',    trend: '+2.4%' },
  { id: 'faculty-ratio',    name: 'Faculty-student ratio',   value: 18,    unit: ':1',     target: 20,   status: 'good',    trend: 'stable' },
  { id: 'research-pubs',    name: 'Research publications',   value: 142,   unit: ' papers',target: 150,  status: 'warning', trend: '+8' },
  { id: 'placement-rate',   name: 'Placement rate',          value: 87.2,  unit: '%',      target: 85,   status: 'good',    trend: '+3.1%' },
  { id: 'satisfaction',     name: 'Student satisfaction',    value: 4.1,   unit: '/5',     target: 4.0,  status: 'good',    trend: '+0.2' },
  { id: 'dropout-rate',     name: 'Dropout rate',            value: 4.8,   unit: '%',      target: 5,    status: 'good',    trend: '-0.5%' },
  { id: 'fee-collection',   name: 'Fee collection rate',     value: 94.1,  unit: '%',      target: 95,   status: 'warning', trend: '-0.9%' },
  { id: 'library-usage',    name: 'Library usage index',     value: 62,    unit: '%',      target: 70,   status: 'danger',  trend: '-3%' },
  { id: 'avg-attendance',   name: 'Avg attendance',          value: 88,    unit: '%',      target: 85,   status: 'good',    trend: '+2%' },
  { id: 'internship-rate',  name: 'Internship completion',   value: 79.3,  unit: '%',      target: 80,   status: 'warning', trend: '+5%' },
];

let alerts = [
  { id: uuidv4(), dept: 'Civil', issue: 'Pass rate dropped below 80%',      severity: 'danger',  date: '2024-11', resolved: false },
  { id: uuidv4(), dept: 'MBA',   issue: 'Enrollment down 12% YoY',          severity: 'warning', date: '2024-10', resolved: false },
  { id: uuidv4(), dept: 'Bio',   issue: 'Research output below target',      severity: 'warning', date: '2024-11', resolved: false },
  { id: uuidv4(), dept: 'EE',    issue: 'Placement rate exceeded target',    severity: 'success', date: '2024-11', resolved: true  },
  { id: uuidv4(), dept: 'CS',    issue: 'Library resource usage critically low', severity: 'danger', date: '2024-12', resolved: false },
  { id: uuidv4(), dept: 'Mech',  issue: 'Faculty-student ratio improving',   severity: 'success', date: '2024-12', resolved: true  },
];

let disputesList = [];

const facultyData = DEPARTMENTS.map((dept, i) => {
  seed = 100 + i * 31;
  return {
    dept,
    total:       Math.round(20 + seededRand() * 40),
    permanent:   Math.round(15 + seededRand() * 25),
    visiting:    Math.round(3  + seededRand() * 10),
    phd:         Math.round(60 + seededRand() * 30),      // % with PhD
    avgExp:      +(5 + seededRand() * 15).toFixed(1),     // years
    publications: Math.round(5 + seededRand() * 40),
    grants:      Math.round(seededRand() * 10),
  };
});

const financialData = [
  { year: '2020', revenue: 420, expenses: 370, grants: 45, surplus: 50 },
  { year: '2021', revenue: 455, expenses: 395, grants: 52, surplus: 60 },
  { year: '2022', revenue: 490, expenses: 415, grants: 60, surplus: 75 },
  { year: '2023', revenue: 535, expenses: 445, grants: 72, surplus: 90 },
  { year: '2024', revenue: 580, expenses: 470, grants: 85, surplus: 110 },
];

// Students at risk (GPA < 6.0 or attendance < 60%)
const atRiskStudents = Array.from({ length: 24 }, (_, i) => {
  seed = 200 + i * 13;
  const dept = DEPARTMENTS[Math.floor(seededRand() * DEPARTMENTS.length)];
  const gpa  = +(4.0 + seededRand() * 2.0).toFixed(1);
  const att  = Math.round(45 + seededRand() * 15);
  return {
    id:         `STU-${1000 + i}`,
    dept,
    year:       Math.ceil(seededRand() * 4),
    gpa,
    attendance: att,
    risk:       gpa < 5.5 || att < 55 ? 'high' : 'medium',
    backlogs:   Math.round(seededRand() * 4),
  };
});

const summary = {
  totalStudents:  4500,
  totalFaculty:   250,
  departments:    6,
  avgGPA:         8.2,
  passRate:       91.4,
  placementRate:  87.2,
  researchPapers: 142,
  activeAlerts:   alerts.filter(a => !a.resolved).length,
};

// ── AI INSIGHT RESPONSES (rule-based, no external API needed) ────────────────
const AI_INSIGHTS = {
  academic: [
    '📈 GPA has grown 1.3 points over 6 years — sustain momentum by expanding peer-tutoring programs.',
    '🎯 Pass rate hit 93% in 2024, surpassing the 90% target. Document successful strategies for replication.',
    '⭐ Topper count more than doubled since 2019. Consider a fast-track honours programme to retain top talent.',
    '📅 Attendance improved from 78% to 88% — a strong correlation with GPA gains is evident.',
  ],
  departments: [
    '🔬 CS and EE consistently lead in placement and GPA — facilitate cross-department curriculum reviews.',
    '⚠️ Civil department shows widest variance across metrics — prioritise targeted faculty mentoring.',
    '📊 MBA research output is below average — incentivise industry-collaborative research grants.',
    '💡 Departments with higher budget allocations show a 12% higher placement rate on average.',
  ],
  enrollment: [
    '📉 Male enrollment growth is plateauing while female enrollment is surging — a positive equity trend.',
    '🔮 2026 forecast projects 5,100 students — begin hostel and lab infrastructure planning immediately.',
    '🌍 International student count is growing 22% YoY; consider a dedicated international student support cell.',
    '📉 Dropout rate has halved from 96 to 55 over 6 years — retention strategies are clearly working.',
  ],
  kpis: [
    '🚨 Library usage at 62% is the critical weak KPI — pilot 24×7 digital access and reading incentives.',
    '💰 Fee collection at 94.1% is just below target — implement automated reminders and easy EMI options.',
    '✅ 6 of 10 KPIs exceed targets — share the institutional success blueprint at the state level.',
    '📌 Internship completion at 79.3% needs a push — establish a mandatory industry internship policy.',
  ],
  faculty: [
    '🎓 Over 75% of faculty hold PhDs — above national average; leverage this in accreditation submissions.',
    '🔬 Departments with more research grants correlate with 18% higher student satisfaction scores.',
    '👩‍🏫 Visiting faculty count is rising — consider formal vetting and quality assurance frameworks.',
    '📅 Average faculty experience is 12 years — a healthy balance of seasoned and early-career educators.',
  ],
  financial: [
    '💹 Revenue has grown 38% over 5 years with a consistent surplus — strong financial health.',
    '🔬 Research grants have nearly doubled — prioritise grant-writing workshops for faculty.',
    '📊 Expenses growing at 6% annually while revenue grows at 8% — a sustainable positive trajectory.',
    '🏗️ The current surplus can fund 2-3 major infrastructure projects without additional debt.',
  ],
};

// ── ROUTES ───────────────────────────────────────────────────────────────────

// Health check
app.get('/health', (_, res) => res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() }));

// Summary
app.get('/api/summary', (_, res) => res.json({ ...summary, activeAlerts: alerts.filter(a => !a.resolved).length }));

// Academic performance — optional ?year= filter
app.get('/api/academic-performance', (req, res) => {
  const { year } = req.query;
  const data = year ? academicPerformance.filter(d => d.year === year) : academicPerformance;
  res.json(data);
});

// Department comparison — optional ?dept= filter
app.get('/api/department-comparison', (req, res) => {
  const { dept } = req.query;
  const data = dept ? departmentData.filter(d => d.dept.toLowerCase() === dept.toLowerCase()) : departmentData;
  res.json(data);
});

// Single department detail
app.get('/api/department-comparison/:dept', (req, res) => {
  const d = departmentData.find(x => x.dept.toLowerCase() === req.params.dept.toLowerCase());
  if (!d) return res.status(404).json({ error: 'Department not found' });
  res.json(d);
});

// Enrollment trends — optional ?predicted=true|false
app.get('/api/enrollment-trends', (req, res) => {
  const { predicted } = req.query;
  let data = enrollmentTrends;
  if (predicted === 'false') data = data.filter(d => !d.predicted);
  if (predicted === 'true')  data = data.filter(d =>  d.predicted);
  res.json(data);
});

// KPIs — optional ?status= filter (good|warning|danger)
app.get('/api/kpis', (req, res) => {
  const { status } = req.query;
  const data = status ? kpis.filter(k => k.status === status) : kpis;
  res.json(data);
});

// Alerts — optional ?resolved=true|false&dept= filters
app.get('/api/alerts', (req, res) => {
  const { resolved, dept, severity } = req.query;
  let data = [...alerts];
  if (resolved !== undefined) data = data.filter(a => String(a.resolved) === resolved);
  if (dept)                   data = data.filter(a => a.dept.toLowerCase() === dept.toLowerCase());
  if (severity)               data = data.filter(a => a.severity === severity);
  res.json(data);
});

// Resolve an alert by ID (PATCH)
app.patch('/api/alerts/:id/resolve', (req, res) => {
  const alert = alerts.find(a => a.id === req.params.id);
  if (!alert) return res.status(404).json({ error: 'Alert not found' });
  alert.resolved = true;
  res.json({ message: 'Alert resolved', alert });
});

// Create a new alert (POST)
app.post('/api/alerts', (req, res) => {
  const { dept, issue, severity } = req.body;
  if (!dept || !issue || !severity) return res.status(400).json({ error: 'dept, issue and severity are required' });
  if (!['danger','warning','success'].includes(severity)) return res.status(400).json({ error: 'Invalid severity' });
  if (!DEPARTMENTS.includes(dept)) return res.status(400).json({ error: `Invalid dept. Must be one of: ${DEPARTMENTS.join(', ')}` });
  const newAlert = { id: uuidv4(), dept, issue, severity, date: new Date().toISOString().slice(0,7), resolved: false };
  alerts.unshift(newAlert);
  res.status(201).json(newAlert);
});

// Faculty data — optional ?dept= filter
app.get('/api/faculty', (req, res) => {
  const { dept } = req.query;
  const data = dept ? facultyData.filter(f => f.dept.toLowerCase() === dept.toLowerCase()) : facultyData;
  res.json(data);
});

// Financial data — optional ?year= filter
app.get('/api/financial', (req, res) => {
  const { year } = req.query;
  const data = year ? financialData.filter(f => f.year === year) : financialData;
  res.json(data);
});

// At-risk students — optional ?risk=high|medium&dept= filters
app.get('/api/students/at-risk', (req, res) => {
  const { risk, dept } = req.query;
  let data = [...atRiskStudents];
  if (risk) data = data.filter(s => s.risk === risk);
  if (dept) data = data.filter(s => s.dept.toLowerCase() === dept.toLowerCase());
  // Don't return all; paginate
  const page  = Math.max(1, parseInt(req.query.page  || '1'));
  const limit = Math.min(50, parseInt(req.query.limit || '20'));
  const start = (page - 1) * limit;
  res.json({ total: data.length, page, limit, data: data.slice(start, start + limit) });
});

// Get specific student by ID (mocks a real student if not in at-risk array)
app.get('/api/students/:id', (req, res) => {
  const idStr = req.params.id;
  const existing = atRiskStudents.find(s => s.id === idStr);
  if (existing) return res.json(existing);
  
  // Predictably mock using the digits from the ID
  const numMatches = idStr.match(/\d+/);
  const n = numMatches ? parseInt(numMatches[0]) : 42;
  seed = 500 + n * 17;
  const dept = DEPARTMENTS[Math.floor(seededRand() * DEPARTMENTS.length)];
  const gpa = +(6.0 + seededRand() * 3.5).toFixed(1);
  const attendance = Math.round(65 + seededRand() * 35);
  
  res.json({
    id: idStr.startsWith('STU-') ? idStr : `STU-${idStr}`,
    dept,
    year: Math.ceil(seededRand() * 4),
    gpa,
    attendance,
    risk: gpa < 5.5 || attendance < 55 ? 'high' : 'medium',
    backlogs: Math.round(seededRand() * 2),
  });
});

// Get specific student's recent absences
app.get('/api/students/:id/absences', (req, res) => {
  const idStr = req.params.id;
  const numMatches = idStr.match(/\d+/);
  const n = numMatches ? parseInt(numMatches[0]) : 42;
  
  // Predictably mock 3-5 absence dates
  const absences = [];
  // Use a localized scope variables to not overwrite global seededRand directly unexpectedly, actually just use it sequentially
  seed = 600 + n * 13;
  const count = Math.floor(3 + seededRand() * 3);
  for (let i=0; i<count; i++) {
    const day = Math.floor(1 + seededRand() * 28);
    const month = Math.floor(1 + seededRand() * 10);
    absences.push(`2024-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`);
  }
  
  // Unique and Sort descending
  const uniqueAbsences = [...new Set(absences)].sort((a,b) => b.localeCompare(a));
  res.json(uniqueAbsences);
});

// Get specific student's daily attendance history (last 30 days)
app.get('/api/students/:id/daily-attendance', (req, res) => {
  const idStr = req.params.id;
  const existing = atRiskStudents.find(s => s.id === idStr);
  let attRate = existing ? existing.attendance : 75;
  
  const numMatches = idStr.match(/\d+/);
  const n = numMatches ? parseInt(numMatches[0]) : 42;
  seed = 700 + n * 11;
  
  const history = [];
  const today = new Date();
  
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    
    // Skip weekends
    if (d.getDay() === 0 || d.getDay() === 6) continue;

    const isPresent = (seededRand() * 100) <= attRate;
    history.push({ date: dateStr, status: isPresent ? 'present' : 'absent' });
  }
  
  res.json(history);
});

// Submit a new attendance dispute
app.post('/api/disputes', (req, res) => {
  const { studentId, dept, date, reason } = req.body;
  if (!studentId || !date || !reason) {
    return res.status(400).json({ error: 'studentId, date, and reason are required' });
  }

  const disputeId = uuidv4();
  const disputeTargetDate = new Date().toISOString().slice(0,10);

  // Add to full tracking system
  disputesList.unshift({
    id: disputeId,
    studentId,
    dept: dept || 'Unknown',
    date,
    reason,
    status: 'pending',
    createdAt: disputeTargetDate
  });

  // Also add to dashboard alerts overview
  alerts.unshift({
    id: disputeId, // Use same ID so we can resolve both
    dept: dept || 'Unknown',
    issue: `Attendance Dispute (${studentId}): Marked absent on ${date}. Reason: "${reason}"`,
    severity: 'warning',
    date: disputeTargetDate,
    resolved: false
  });

  res.json({ message: 'Dispute submitted. Staff has been alerted successfully.' });
});

// Get disputes (optional ?studentId= filter)
app.get('/api/disputes', (req, res) => {
  const { studentId } = req.query;
  if (studentId) {
    return res.json(disputesList.filter(d => d.studentId === studentId));
  }
  res.json(disputesList);
});

// Resolve a dispute
app.patch('/api/disputes/:id/resolve', (req, res) => {
  const dispute = disputesList.find(d => d.id === req.params.id);
  if (!dispute) return res.status(404).json({ error: 'Dispute not found' });
  
  dispute.status = 'resolved';

  // Also resolve the corresponding alert if it exists
  const alert = alerts.find(a => a.id === req.params.id);
  if (alert) alert.resolved = true;
  
  res.json({ message: 'Dispute resolved', dispute });
});

// Automated Attendance Checker
app.post('/api/trigger-attendance-check', (req, res) => {
  const lowAtt = atRiskStudents.filter(s => s.attendance < 60);
  let newAlertsCount = 0;
  lowAtt.forEach(stu => {
    // Check if an alert for this student already exists
    const exists = alerts.some(a => a.issue.includes(stu.id));
    if (!exists) {
      alerts.unshift({
        id: uuidv4(),
        dept: stu.dept,
        issue: `Automated Alert: Student ${stu.id} has critical attendance (${stu.attendance}%)`,
        severity: 'danger',
        date: new Date().toISOString().slice(0,10),
        resolved: false
      });
      newAlertsCount++;
    }
  });
  res.json({ message: `Attendance check complete. Generated ${newAlertsCount} new alerts for staff.`, added: newAlertsCount });
});

// List of departments (meta)
app.get('/api/departments', (_, res) => res.json(DEPARTMENTS));

// AI Insight endpoint — rule-based (swap with Anthropic SDK if API key present)
app.post('/api/ai-insight', (req, res) => {
  const { section } = req.body;
  const key = (section || '').toLowerCase();
  const insights = AI_INSIGHTS[key];
  if (!insights) return res.status(400).json({ error: `Unknown section. Valid: ${Object.keys(AI_INSIGHTS).join(', ')}` });

  // Simulate a slight delay to feel like an LLM call
  setTimeout(() => {
    res.json({ insight: insights.join('\n'), section: key, generated_at: new Date().toISOString() });
  }, 600);
});

// Analytics snapshot (all-in-one for report export)
app.get('/api/snapshot', (_, res) => {
  res.json({
    generated_at: new Date().toISOString(),
    summary,
    academicPerformance,
    departmentData,
    enrollmentTrends,
    kpis,
    alerts,
    facultyData,
    financialData,
  });
});

// ── ERROR HANDLING ────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: `Route ${req.method} ${req.path} not found` }));

app.use((err, req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// ── START ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀  API running on http://localhost:${PORT}`);
  console.log('   Endpoints:');
  console.log('   GET  /health');
  console.log('   GET  /api/summary');
  console.log('   GET  /api/academic-performance  [?year=]');
  console.log('   GET  /api/department-comparison [?dept=]');
  console.log('   GET  /api/department-comparison/:dept');
  console.log('   GET  /api/enrollment-trends     [?predicted=]');
  console.log('   GET  /api/kpis                  [?status=]');
  console.log('   GET  /api/alerts                [?resolved=&dept=&severity=]');
  console.log('   POST /api/alerts');
  console.log('   PATCH /api/alerts/:id/resolve');
  console.log('   GET  /api/faculty               [?dept=]');
  console.log('   GET  /api/financial             [?year=]');
  console.log('   GET  /api/students/at-risk      [?risk=&dept=&page=&limit=]');
  console.log('   GET  /api/departments');
  console.log('   GET  /api/snapshot');
  console.log('   POST /api/ai-insight            { section: "academic|departments|enrollment|kpis|faculty|financial" }');
  console.log('\n');
});
