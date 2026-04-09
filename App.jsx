import { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from 'recharts';

const API = 'http://localhost:4000/api';

// ── FETCH HOOK ──────────────────────────────────────────────────────────────
function useData(endpoint) {
  const [data, setData] = useState(null);
  useEffect(() => {
    fetch(API + endpoint).then(r => r.json()).then(setData).catch(() => {});
  }, [endpoint]);
  return data;
}

// ── KPI CARD ───────────────────────────────────────────────────────────────
function KpiCard({ label, value, unit, color = '#378ADD' }) {
  return (
    <div style={{
      background: 'var(--color-bg2, #f8f8f6)',
      borderRadius: 10, padding: '16px 20px',
      border: '0.5px solid #e0deda', textAlign: 'center'
    }}>
      <div style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 600, color }}>{value}<span style={{ fontSize: 14, fontWeight: 400, marginLeft: 3 }}>{unit}</span></div>
    </div>
  );
}

// ── BADGE ──────────────────────────────────────────────────────────────────
function Badge({ status }) {
  const styles = {
    good:    { bg: '#EAF3DE', color: '#3B6D11' },
    warning: { bg: '#FAEEDA', color: '#854F0B' },
    danger:  { bg: '#FCEBEB', color: '#A32D2D' },
    success: { bg: '#EAF3DE', color: '#3B6D11' },
  };
  const s = styles[status] || styles.warning;
  return <span style={{ background: s.bg, color: s.color, fontSize: 11, padding: '2px 8px', borderRadius: 5, fontWeight: 500 }}>{status}</span>;
}

// ══ PAGE: ACADEMIC PERFORMANCE ════════════════════════════════════════════
function AcademicPage() {
  const data = useData('/academic-performance');
  if (!data) return <Loading />;
  return (
    <div>
      <h2 style={headingStyle}>Academic performance</h2>
      <p style={subStyle}>Year-on-year trends in GPA, pass rates, and top achievers.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 28 }}>
        <KpiCard label="Avg GPA (2024)" value={data[data.length-1].avgGPA} unit="/10" color="#534AB7"/>
        <KpiCard label="Pass rate (2024)" value={data[data.length-1].passRate} unit="%" color="#1D9E75"/>
        <KpiCard label="Toppers (2024)" value={data[data.length-1].toppers} unit="students" color="#D85A30"/>
      </div>
      <ChartCard title="GPA trend">
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee"/>
            <XAxis dataKey="year" fontSize={12}/>
            <YAxis domain={[6,10]} fontSize={12}/>
            <Tooltip/>
            <Line type="monotone" dataKey="avgGPA" stroke="#534AB7" strokeWidth={2} dot={{ r:4 }}/>
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard title="Pass rate & toppers">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee"/>
            <XAxis dataKey="year" fontSize={12}/>
            <YAxis yAxisId="left" fontSize={12}/>
            <YAxis yAxisId="right" orientation="right" fontSize={12}/>
            <Tooltip/>
            <Legend/>
            <Bar yAxisId="left" dataKey="passRate" fill="#1D9E75" name="Pass rate %"/>
            <Bar yAxisId="right" dataKey="toppers" fill="#D85A30" name="Toppers"/>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

// ══ PAGE: DEPARTMENT COMPARISON ═══════════════════════════════════════════
function DeptPage() {
  const data = useData('/department-comparison');
  if (!data) return <Loading />;
  const radarData = data.map(d => ({
    dept: d.dept,
    GPA: d.avgGPA * 10,
    'Pass rate': d.passRate,
    Placement: d.placementRate,
    Research: d.researchOutput * 2,
  }));
  return (
    <div>
      <h2 style={headingStyle}>Department comparison</h2>
      <p style={subStyle}>Performance across all departments side by side.</p>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 16 }}>
        <ChartCard title="Multi-metric radar">
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={radarData}>
              <PolarGrid/>
              <PolarAngleAxis dataKey="dept" fontSize={12}/>
              <Radar name="GPA" dataKey="GPA" stroke="#534AB7" fill="#534AB7" fillOpacity={0.2}/>
              <Radar name="Pass rate" dataKey="Pass rate" stroke="#1D9E75" fill="#1D9E75" fillOpacity={0.2}/>
              <Legend/>
            </RadarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Placement rate by dept">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#eee"/>
              <XAxis type="number" fontSize={12} domain={[0,100]}/>
              <YAxis dataKey="dept" type="category" fontSize={12} width={40}/>
              <Tooltip/>
              <Bar dataKey="placementRate" fill="#378ADD" name="Placement %"/>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
      <ChartCard title="All metrics table">
        <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #eee' }}>
              {['Dept','Avg GPA','Pass rate','Faculty ratio','Research','Placement'].map(h =>
                <th key={h} style={{ textAlign:'left', padding: '6px 10px', color:'#888', fontWeight:500 }}>{h}</th>
              )}
            </tr>
          </thead>
          <tbody>
            {data.map(d => (
              <tr key={d.dept} style={{ borderBottom: '0.5px solid #f0ede8' }}>
                <td style={{ padding:'7px 10px', fontWeight:500 }}>{d.dept}</td>
                <td style={{ padding:'7px 10px' }}>{d.avgGPA}</td>
                <td style={{ padding:'7px 10px' }}>{d.passRate}%</td>
                <td style={{ padding:'7px 10px' }}>1:{d.facultyRatio.toFixed(0)}</td>
                <td style={{ padding:'7px 10px' }}>{d.researchOutput}</td>
                <td style={{ padding:'7px 10px' }}>{d.placementRate}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </ChartCard>
    </div>
  );
}

// ══ PAGE: ENROLLMENT TRENDS ═══════════════════════════════════════════════
function EnrollmentPage() {
  const data = useData('/enrollment-trends');
  if (!data) return <Loading />;
  const actual = data.filter(d => !d.predicted);
  const latest = actual[actual.length - 1];
  return (
    <div>
      <h2 style={headingStyle}>Student enrollment trends</h2>
      <p style={subStyle}>Historical enrollment and 2-year forecast. Dashed line = predicted.</p>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:24 }}>
        <KpiCard label="Total (2024)" value={latest.total.toLocaleString()} unit="students" color="#534AB7"/>
        <KpiCard label="Male" value={latest.male.toLocaleString()} unit="" color="#378ADD"/>
        <KpiCard label="Female" value={latest.female.toLocaleString()} unit="" color="#D4537E"/>
      </div>
      <ChartCard title="Total enrollment (with forecast)">
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee"/>
            <XAxis dataKey="year" fontSize={12}/>
            <YAxis fontSize={12}/>
            <Tooltip/>
            <Area type="monotone" dataKey="total" stroke="#534AB7" fill="#EEEDFE" strokeWidth={2}
              strokeDasharray={(_, index) => data[index]?.predicted ? '6 3' : '0'}/>
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard title="Gender breakdown">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={actual}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee"/>
            <XAxis dataKey="year" fontSize={12}/>
            <YAxis fontSize={12}/>
            <Tooltip/>
            <Legend/>
            <Bar dataKey="male" fill="#378ADD" name="Male" stackId="a"/>
            <Bar dataKey="female" fill="#D4537E" name="Female" stackId="a"/>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

// ══ PAGE: KPI MONITORING ══════════════════════════════════════════════════
function KpiPage() {
  const kpis = useData('/kpis');
  const alerts = useData('/alerts');
  if (!kpis || !alerts) return <Loading />;
  return (
    <div>
      <h2 style={headingStyle}>Institutional KPI monitoring</h2>
      <p style={subStyle}>Live status of key performance indicators against targets.</p>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10, marginBottom:24 }}>
        {kpis.map(k => (
          <div key={k.name} style={{
            background:'#fafaf8', border:'0.5px solid #e5e2dc',
            borderRadius:10, padding:'12px 16px',
            display:'flex', alignItems:'center', justifyContent:'space-between'
          }}>
            <div>
              <div style={{ fontSize:13, color:'#555', marginBottom:3 }}>{k.name}</div>
              <div style={{ fontSize:20, fontWeight:600 }}>
                {typeof k.value === 'number' && k.value < 1 ? `1:${Math.round(1/k.value)}` : k.value}{k.unit !== ':1' ? k.unit : ''}
              </div>
            </div>
            <Badge status={k.status}/>
          </div>
        ))}
      </div>
      <ChartCard title="Alerts & actions required">
        <table style={{ width:'100%', fontSize:13, borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ borderBottom:'1px solid #eee' }}>
              {['Department','Issue','Severity','Date'].map(h =>
                <th key={h} style={{ textAlign:'left', padding:'6px 10px', color:'#888', fontWeight:500 }}>{h}</th>
              )}
            </tr>
          </thead>
          <tbody>
            {alerts.map((a,i) => (
              <tr key={i} style={{ borderBottom:'0.5px solid #f0ede8' }}>
                <td style={{ padding:'8px 10px', fontWeight:500 }}>{a.dept}</td>
                <td style={{ padding:'8px 10px' }}>{a.issue}</td>
                <td style={{ padding:'8px 10px' }}><Badge status={a.severity}/></td>
                <td style={{ padding:'8px 10px', color:'#888' }}>{a.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </ChartCard>
    </div>
  );
}

// ── SHARED COMPONENTS ──────────────────────────────────────────────────────
function ChartCard({ title, children }) {
  return (
    <div style={{ background:'#fff', border:'0.5px solid #e5e2dc', borderRadius:12, padding:'16px 20px', marginBottom:16 }}>
      <div style={{ fontSize:13, fontWeight:500, color:'#555', marginBottom:12 }}>{title}</div>
      {children}
    </div>
  );
}

function Loading() {
  return <div style={{ padding:40, textAlign:'center', color:'#aaa' }}>Loading data...</div>;
}

const headingStyle = { fontSize: 22, fontWeight: 600, margin: '0 0 6px', color: '#1a1a18' };
const subStyle = { fontSize: 14, color: '#888', margin: '0 0 24px' };

// ── NAV ITEMS ──────────────────────────────────────────────────────────────
const navItems = [
  { id: 'academic',    label: 'Academic performance' },
  { id: 'departments', label: 'Department comparison' },
  { id: 'enrollment',  label: 'Enrollment trends' },
  { id: 'kpis',        label: 'KPI monitoring' },
];

// ══ ROOT APP ══════════════════════════════════════════════════════════════
export default function App() {
  const [page, setPage] = useState('academic');
  const summary = useData('/summary');

  const pages = {
    academic:    <AcademicPage />,
    departments: <DeptPage />,
    enrollment:  <EnrollmentPage />,
    kpis:        <KpiPage />,
  };

  return (
    <div style={{ display:'flex', minHeight:'100vh', fontFamily:'Inter, system-ui, sans-serif', background:'#f5f4f0' }}>
      {/* Sidebar */}
      <div style={{ width:220, background:'#1a1a2e', padding:'24px 0', display:'flex', flexDirection:'column' }}>
        <div style={{ padding:'0 20px 24px', borderBottom:'0.5px solid #ffffff18' }}>
          <div style={{ fontSize:11, color:'#ffffff60', letterSpacing:'.1em', marginBottom:4 }}>SC003</div>
          <div style={{ fontSize:14, fontWeight:600, color:'#fff', lineHeight:1.4 }}>Decision Support<br/>Dashboard</div>
        </div>

        {/* Summary stats */}
        {summary && (
          <div style={{ padding:'16px 20px', borderBottom:'0.5px solid #ffffff18' }}>
            {[
              ['Students', summary.totalStudents.toLocaleString()],
              ['Faculty', summary.totalFaculty],
              ['Departments', summary.departments],
            ].map(([l,v]) => (
              <div key={l} style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                <span style={{ fontSize:12, color:'#ffffff60' }}>{l}</span>
                <span style={{ fontSize:12, color:'#fff', fontWeight:500 }}>{v}</span>
              </div>
            ))}
          </div>
        )}

        <nav style={{ padding:'16px 12px', flex:1 }}>
          {navItems.map(item => (
            <button key={item.id} onClick={() => setPage(item.id)} style={{
              display:'block', width:'100%', textAlign:'left',
              padding:'9px 12px', borderRadius:7, marginBottom:4,
              fontSize:13, border:'none', cursor:'pointer',
              background: page === item.id ? '#534AB7' : 'transparent',
              color: page === item.id ? '#fff' : '#ffffff90',
              transition:'all .15s'
            }}>
              {item.label}
            </button>
          ))}
        </nav>

        <div style={{ padding:'16px 20px', fontSize:11, color:'#ffffff40' }}>
          Sathakathon 2.0 · SC003
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex:1, padding:'32px 36px', maxWidth:900, overflow:'auto' }}>
        {pages[page]}
      </div>
    </div>
  );
}
