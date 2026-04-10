import { useState, useEffect, useCallback, useRef } from 'react';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, ComposedChart,
} from 'recharts';
import AIInsights from './AIInsights';

// Empty string → Vite proxy forwards /api/* to http://localhost:4000 in dev.
// In production set VITE_API_URL to your deployed backend URL (e.g. https://sc003.railway.app).
const API = import.meta.env.VITE_API_URL ?? '';

// ── COLOUR PALETTE ────────────────────────────────────────────────────────────
const C = {
  accent:  '#6c63ff',
  accent2: '#00d4aa',
  accent3: '#ff6b9d',
  warn:    '#ff9f43',
  danger:  '#ff4757',
  success: '#2ed573',
  blue:    '#54a0ff',
  muted:   '#7878a0',
};

const CHART_COLORS = [C.accent, C.accent2, C.accent3, C.warn, C.blue, C.success];

// ── FETCH HOOK ────────────────────────────────────────────────────────────────
function useData(endpoint) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch(API + endpoint)
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(d => { setData(d); setError(null); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [endpoint]);

  useEffect(() => { load(); }, [load]);
  return { data, loading, error, refetch: load };
}

// ── ANIMATED COUNTER ──────────────────────────────────────────────────────────
function useCounter(target, duration = 1200) {
  const [val, setVal] = useState(0);
  const targetNum = parseFloat(String(target).replace(/[^0-9.]/g, '')) || 0;
  useEffect(() => {
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(+(targetNum * eased).toFixed(typeof target === 'string' && target.includes('.') ? 1 : 0));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [targetNum, duration]);
  return val;
}

// ── SHARED COMPONENTS ─────────────────────────────────────────────────────────
function Loading() {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:80, gap:16 }}>
      <div style={{ width:36, height:36, border:`3px solid rgba(108,99,255,0.2)`, borderTop:`3px solid ${C.accent}`, borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
      <span style={{ color: C.muted, fontSize:13 }}>Fetching data…</span>
    </div>
  );
}

function ErrorMsg({ msg }) {
  return (
    <div style={{ padding:'20px 24px', borderRadius:12, background:'rgba(255,71,87,0.1)', color:'#ff6b7a', border:'1px solid rgba(255,71,87,0.25)', fontSize:14 }}>
      ⚠️ {msg} — make sure the backend is running on port 4000.
    </div>
  );
}

function SectionHeader({ title, sub }) {
  return (
    <div style={{ marginBottom:28 }}>
      <h1 style={{ fontSize:26, fontWeight:800, background:`linear-gradient(135deg, #e8e8f4, ${C.accent2})`, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', marginBottom:6 }}>
        {title}
      </h1>
      <p style={{ fontSize:14, color: C.muted }}>{sub}</p>
    </div>
  );
}

function StatCard({ label, value, unit = '', color, icon, delay = 0 }) {
  const num = useCounter(value);
  return (
    <div className="glass animate-in" style={{
      padding:'22px 24px', borderRadius:16,
      animation: `fadeInUp 0.5s ease ${delay}ms both`,
      cursor:'default', transition:'transform .2s, box-shadow .2s',
      position:'relative', overflow:'hidden',
    }}
    onMouseEnter={e => { e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow=`0 12px 40px rgba(108,99,255,0.2)`; }}
    onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow=''; }}
    >
      {/* Glow blob */}
      <div style={{ position:'absolute', top:-20, right:-20, width:80, height:80, borderRadius:'50%', background: color, opacity:.12, filter:'blur(20px)', pointerEvents:'none' }} />
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div>
          <div style={{ fontSize:11, color: C.muted, textTransform:'uppercase', letterSpacing:'.08em', fontWeight:600, marginBottom:10 }}>{label}</div>
          <div style={{ fontSize:32, fontWeight:800, color, lineHeight:1, animation:'countUp 0.6s ease' }}>
            {num}<span style={{ fontSize:14, fontWeight:500, opacity:.7, marginLeft:2 }}>{unit}</span>
          </div>
        </div>
        <div style={{ fontSize:28, opacity:.8 }}>{icon}</div>
      </div>
    </div>
  );
}

function GlassCard({ title, children, style = {}, delay = 0 }) {
  return (
    <div className="glass animate-in" style={{ padding:'20px 24px', borderRadius:16, marginBottom:16, animation:`fadeInUp 0.5s ease ${delay}ms both`, ...style }}>
      {title && <div style={{ fontSize:11, fontWeight:700, color: C.muted, textTransform:'uppercase', letterSpacing:'.08em', marginBottom:16, display:'flex', alignItems:'center', gap:8 }}>
        {title}
      </div>}
      {children}
    </div>
  );
}

function Badge({ status }) {
  const map = {
    good:    { bg:'rgba(46,213,115,0.15)', color: C.success,  label:'✓ good' },
    warning: { bg:'rgba(255,159,67,0.15)', color: C.warn,     label:'⚡ warning' },
    danger:  { bg:'rgba(255,71,87,0.15)',  color: C.danger,   label:'⚠ danger' },
    success: { bg:'rgba(46,213,115,0.15)', color: C.success,  label:'↑ exceeded' },
    high:    { bg:'rgba(255,71,87,0.15)',  color: C.danger,   label:'⚠ high risk' },
    medium:  { bg:'rgba(255,159,67,0.15)', color: C.warn,     label:'⚡ medium' },
  };
  const s = map[status] || map.warning;
  return <span style={{ background:s.bg, color:s.color, fontSize:11, padding:'3px 10px', borderRadius:20, fontWeight:700, whiteSpace:'nowrap' }}>{s.label}</span>;
}

const TOOLTIP_STYLE = { background:'rgba(10,10,30,0.95)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, fontSize:12 };

const g3 = { display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, marginBottom:22 };
const g2 = { display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 };
const g4 = { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:22 };

// ── PAGE: OVERVIEW ────────────────────────────────────────────────────────────
function OverviewPage({ onNavigate }) {
  const { data: summary } = useData('/api/summary');
  const { data: kpis }    = useData('/api/kpis');
  const { data: alerts }  = useData('/api/alerts?resolved=false');
  const { data: ap }      = useData('/api/academic-performance');

  const now = new Date().toLocaleString('en-IN', { dateStyle:'medium', timeStyle:'short' });

  const statuses = kpis ? {
    good:    kpis.filter(k=>k.status==='good').length,
    warning: kpis.filter(k=>k.status==='warning').length,
    danger:  kpis.filter(k=>k.status==='danger').length,
  } : {};
  const pieData = kpis ? [
    { name:'On Target', value: statuses.good    },
    { name:'Warning',   value: statuses.warning  },
    { name:'Critical',  value: statuses.danger   },
  ] : [];

  return (
    <div>
      {/* Hero header */}
      <div className="animate-in" style={{ marginBottom:32, display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div>
          <div style={{ fontSize:12, color: C.accent2, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', marginBottom:8, display:'flex', alignItems:'center', gap:8 }}>
            <span className="live-dot" /> Live Dashboard
          </div>
          <h1 style={{ fontSize:32, fontWeight:900, lineHeight:1.2, letterSpacing:'-.02em', background:`linear-gradient(135deg, #fff 30%, ${C.accent} 100%)`, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
            Institutional Decision<br/>Support Analytics
          </h1>
          <p style={{ fontSize:14, color: C.muted, marginTop:10 }}>SC003 · Sathakathon 2.0 · {now}</p>
        </div>
        <button onClick={()=>onNavigate('kpis')} style={{ background:`linear-gradient(135deg,${C.accent},${C.accent2})`, color:'#fff', border:'none', borderRadius:12, padding:'12px 22px', fontSize:13, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:8, boxShadow:`0 8px 24px rgba(108,99,255,0.35)`, fontFamily:'inherit', transition:'transform .2s, box-shadow .2s' }}
          onMouseEnter={e=>{e.currentTarget.style.transform='scale(1.04)';}}
          onMouseLeave={e=>{e.currentTarget.style.transform='';}}
        >
          🎯 Monitor KPIs
        </button>
      </div>

      {/* Top stat cards */}
      {summary && (
        <div style={g4}>
          <StatCard label="Total Students" value={summary.totalStudents}  unit="" color={C.accent}  icon="🎓" delay={0} />
          <StatCard label="Total Faculty"  value={summary.totalFaculty}   unit="" color={C.accent2} icon="👩‍🏫" delay={80} />
          <StatCard label="Pass Rate"      value={summary.passRate}        unit="%" color={C.success} icon="✅" delay={160} />
          <StatCard label="Placement Rate" value={summary.placementRate}   unit="%" color={C.warn}   icon="💼" delay={240} />
        </div>
      )}

      <div style={g2}>
        {/* GPA mini trend */}
        {ap && (
          <GlassCard title="📊 GPA Trend at a Glance" delay={100}>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={ap}>
                <defs>
                  <linearGradient id="gGPA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={C.accent}  stopOpacity={0.3} />
                    <stop offset="95%" stopColor={C.accent}  stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="year" fontSize={10} stroke={C.muted} />
                <YAxis domain={[6,10]} fontSize={10} stroke={C.muted} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Area type="monotone" dataKey="avgGPA" stroke={C.accent} fill="url(#gGPA)" strokeWidth={2.5} dot={{ r:3, fill:C.accent }} />
              </AreaChart>
            </ResponsiveContainer>
          </GlassCard>
        )}

        {/* KPI status pie */}
        {kpis && (
          <GlassCard title="🎯 KPI Health Status" delay={150}>
            <div style={{ display:'flex', alignItems:'center', gap:16 }}>
              <PieChart width={140} height={140}>
                <Pie data={pieData} cx={65} cy={65} innerRadius={40} outerRadius={65} dataKey="value" paddingAngle={3}>
                  <Cell fill={C.success} />
                  <Cell fill={C.warn} />
                  <Cell fill={C.danger} />
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} />
              </PieChart>
              <div style={{ flex:1 }}>
                {[['On Target', statuses.good, C.success],['Warning', statuses.warning, C.warn],['Critical', statuses.danger, C.danger]].map(([l,v,c])=>(
                  <div key={l} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div style={{ width:8, height:8, borderRadius:'50%', background:c, boxShadow:`0 0 6px ${c}` }} />
                      <span style={{ fontSize:13, color: C.muted }}>{l}</span>
                    </div>
                    <span style={{ fontSize:18, fontWeight:800, color:c }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>
        )}
      </div>

      {/* Active alerts */}
      {alerts && alerts.length > 0 && (
        <GlassCard delay={200} style={{ borderColor:'rgba(255,71,87,0.2)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <span style={{ fontSize:11, fontWeight:700, color: C.muted, textTransform:'uppercase', letterSpacing:'.08em' }}>
              🚨 Active Alerts ({alerts.length})
            </span>
            <button onClick={()=>onNavigate('kpis')} style={{ fontSize:12, color: C.accent, background:'none', border:'none', cursor:'pointer', fontWeight:600 }}>View all →</button>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {alerts.slice(0,4).map((a,i) => (
              <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 14px', borderRadius:10, background:'rgba(255,71,87,0.07)', border:'1px solid rgba(255,71,87,0.12)' }}>
                <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                  <span style={{ fontSize:13, fontWeight:700, color:'#fff' }}>{a.dept}</span>
                  <span style={{ fontSize:12, color: C.muted }}>{a.issue}</span>
                </div>
                <Badge status={a.severity} />
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
}

// ── PAGE: ACADEMIC PERFORMANCE ────────────────────────────────────────────────
function AcademicPage() {
  const { data, loading, error } = useData('/api/academic-performance');
  if (loading) return <Loading />;
  if (error)   return <ErrorMsg msg={error} />;
  const last = data[data.length-1];
  return (
    <div>
      <SectionHeader title="Academic Performance" sub="Year-on-year trends in GPA, pass rates, attendance, and top achievers." />
      <div style={g3}>
        <StatCard label="Avg GPA 2024"      value={last.avgGPA}        unit="/10" color={C.accent}  icon="📚" delay={0} />
        <StatCard label="Pass Rate 2024"    value={last.passRate}      unit="%"   color={C.success} icon="✅" delay={80} />
        <StatCard label="Avg Attendance"    value={last.avgAttendance} unit="%"   color={C.accent2} icon="📅" delay={160} />
      </div>

      <GlassCard title="📈 GPA Trend (2019–2024)" delay={100}>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={C.accent} stopOpacity={0.3} />
                <stop offset="95%" stopColor={C.accent} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="year" fontSize={12} stroke={C.muted} />
            <YAxis domain={[6,10]} fontSize={12} stroke={C.muted} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Area type="monotone" dataKey="avgGPA" stroke={C.accent} fill="url(#g1)" strokeWidth={2.5} dot={{ r:4, fill:C.accent, strokeWidth:0 }} name="Avg GPA" />
          </AreaChart>
        </ResponsiveContainer>
      </GlassCard>

      <div style={g2}>
        <GlassCard title="📊 Pass Rate vs Toppers" delay={150}>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="year" fontSize={11} stroke={C.muted} />
              <YAxis yAxisId="l" fontSize={11} stroke={C.muted} />
              <YAxis yAxisId="r" orientation="right" fontSize={11} stroke={C.muted} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ fontSize:11, color: C.muted }} />
              <Bar yAxisId="l" dataKey="passRate" fill={C.accent2} name="Pass Rate %" radius={[5,5,0,0]} />
              <Bar yAxisId="r" dataKey="toppers"  fill={C.accent3} name="Toppers"    radius={[5,5,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>
        <GlassCard title="📅 Attendance Trend" delay={200}>
          <ResponsiveContainer width="100%" height={210}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={C.accent2} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={C.accent2} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="year" fontSize={11} stroke={C.muted} />
              <YAxis domain={[70,100]} fontSize={11} stroke={C.muted} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Area type="monotone" dataKey="avgAttendance" stroke={C.accent2} fill="url(#g2)" strokeWidth={2.5} name="Attendance %" />
            </AreaChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>
      <AIInsights section="academic" />
    </div>
  );
}

// ── PAGE: DEPARTMENTS ─────────────────────────────────────────────────────────
function DeptPage() {
  const { data, loading, error } = useData('/api/department-comparison');
  if (loading) return <Loading />;
  if (error)   return <ErrorMsg msg={error} />;
  const radarData = data.map(d => ({ dept:d.dept, GPA:d.avgGPA*10, 'Pass Rate':d.passRate, Placement:d.placementRate }));
  return (
    <div>
      <SectionHeader title="Department Comparison" sub="Performance across all departments — GPA, placement, research, and more." />
      <div style={g2}>
        <GlassCard title="🕸️ Multi-Metric Radar" delay={50}>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.08)" />
              <PolarAngleAxis dataKey="dept" fontSize={11} tick={{ fill: C.muted }} />
              <Radar name="GPA×10"    dataKey="GPA"       stroke={C.accent}  fill={C.accent}  fillOpacity={0.15} />
              <Radar name="Pass Rate" dataKey="Pass Rate" stroke={C.accent2} fill={C.accent2} fillOpacity={0.15} />
              <Radar name="Placement" dataKey="Placement" stroke={C.accent3} fill={C.accent3} fillOpacity={0.1} />
              <Legend wrapperStyle={{ fontSize:11, color: C.muted }} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
            </RadarChart>
          </ResponsiveContainer>
        </GlassCard>
        <GlassCard title="💼 Placement Rate by Dept" delay={100}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis type="number" fontSize={11} stroke={C.muted} domain={[0,100]} />
              <YAxis dataKey="dept" type="category" fontSize={12} stroke={C.muted} width={44} tick={{ fill:'#e8e8f4' }} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="placementRate" radius={[0,6,6,0]} name="Placement %">
                {data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>
      <GlassCard title="📋 All Metrics Table" delay={150}>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', fontSize:13, borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
                {['Dept','Avg GPA','Pass Rate','Faculty 1:N','Research','Placement','Students','Budget'].map(h =>
                  <th key={h} style={{ textAlign:'left', padding:'8px 14px', color: C.muted, fontWeight:700, fontSize:11, textTransform:'uppercase', letterSpacing:'.05em', whiteSpace:'nowrap' }}>{h}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {data.map((d, i) => (
                <tr key={d.dept} style={{ borderBottom:'1px solid rgba(255,255,255,0.04)', transition:'background .15s' }}
                  onMouseEnter={e=>e.currentTarget.style.background='rgba(108,99,255,0.07)'}
                  onMouseLeave={e=>e.currentTarget.style.background=''}
                >
                  <td style={{ padding:'10px 14px', fontWeight:700, color: CHART_COLORS[i%CHART_COLORS.length] }}>{d.dept}</td>
                  <td style={{ padding:'10px 14px' }}>{d.avgGPA}</td>
                  <td style={{ padding:'10px 14px' }}>{d.passRate}%</td>
                  <td style={{ padding:'10px 14px' }}>1:{Math.round(d.facultyRatio)}</td>
                  <td style={{ padding:'10px 14px' }}>{d.researchOutput}</td>
                  <td style={{ padding:'10px 14px' }}>{d.placementRate}%</td>
                  <td style={{ padding:'10px 14px' }}>{d.studentCount}</td>
                  <td style={{ padding:'10px 14px' }}>₹{d.budget}L</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
      <AIInsights section="departments" />
    </div>
  );
}

// ── PAGE: ENROLLMENT ──────────────────────────────────────────────────────────
function EnrollmentPage() {
  const { data, loading, error } = useData('/api/enrollment-trends');
  if (loading) return <Loading />;
  if (error)   return <ErrorMsg msg={error} />;
  const actual = data.filter(d => !d.predicted);
  const latest = actual[actual.length-1];
  const predicted = data.filter(d => d.predicted);
  return (
    <div>
      <SectionHeader title="Enrollment Trends" sub="Historical data + 2-year AI-predicted forecast. Dashed markers indicate predictions." />
      <div style={g3}>
        <StatCard label="Total Students 2024"  value={latest.total}  unit="" color={C.accent}  icon="🎓" delay={0}  />
        <StatCard label="Male Enrollment"      value={latest.male}   unit="" color={C.blue}    icon="👨‍🎓" delay={80} />
        <StatCard label="Female Enrollment"    value={latest.female} unit="" color={C.accent3} icon="👩‍🎓" delay={160} />
      </div>
      <GlassCard title="📈 Total Enrollment with 2-Year Forecast" delay={100}>
        <ResponsiveContainer width="100%" height={240}>
          <ComposedChart data={data}>
            <defs>
              <linearGradient id="gET" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={C.accent} stopOpacity={0.3} />
                <stop offset="95%" stopColor={C.accent} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="year" fontSize={12} stroke={C.muted} />
            <YAxis fontSize={12} stroke={C.muted} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Legend wrapperStyle={{ fontSize:11, color: C.muted }} />
            <Area type="monotone" dataKey="total" stroke={C.accent} fill="url(#gET)" strokeWidth={2.5} name="Total (Actual)" dot={(p) => !data[p.index]?.predicted ? <circle cx={p.cx} cy={p.cy} r={4} fill={C.accent} key={p.index}/> : null} strokeDasharray="0" />
            <Line type="monotone" dataKey="total" stroke={C.accent3} strokeWidth={2} strokeDasharray="8 4" dot={false} name="Predicted" />
          </ComposedChart>
        </ResponsiveContainer>
      </GlassCard>
      <div style={g2}>
        <GlassCard title="⚖️ Gender Breakdown (Actual)" delay={150}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={actual}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="year" fontSize={11} stroke={C.muted} />
              <YAxis fontSize={11} stroke={C.muted} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ fontSize:11, color: C.muted }} />
              <Bar dataKey="male"   fill={C.blue}    name="Male"   stackId="a" />
              <Bar dataKey="female" fill={C.accent3} name="Female" stackId="a" radius={[5,5,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>
        <GlassCard title="🌍 International Students" delay={200}>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={actual}>
              <defs>
                <linearGradient id="gInt" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={C.warn} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={C.warn} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="year" fontSize={11} stroke={C.muted} />
              <YAxis fontSize={11} stroke={C.muted} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Area type="monotone" dataKey="international" stroke={C.warn} fill="url(#gInt)" strokeWidth={2.5} name="International" />
            </AreaChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>
      {predicted.length > 0 && (
        <GlassCard style={{ borderColor:'rgba(108,99,255,0.25)', background:'rgba(108,99,255,0.06)' }} delay={250}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <span style={{ fontSize:28 }}>🔮</span>
            <div>
              <div style={{ fontWeight:700, color:'#e8e8f4', marginBottom:4 }}>AI Enrollment Forecast</div>
              {predicted.map(p=>(
                <div key={p.year} style={{ fontSize:13, color: C.muted }}>
                  <strong style={{ color: C.accent }}>{p.year}</strong>: <strong style={{ color:'#fff' }}>{p.total.toLocaleString()}</strong> students total
                  &nbsp;·&nbsp; {p.male.toLocaleString()} male, {p.female.toLocaleString()} female, ~{p.international} international
                </div>
              ))}
            </div>
          </div>
        </GlassCard>
      )}
      <AIInsights section="enrollment" />
    </div>
  );
}

// ── PAGE: KPI MONITORING ──────────────────────────────────────────────────────
function KpiPage() {
  const { data: kpis,   loading: lk, error: ek } = useData('/api/kpis');
  const { data: alerts, loading: la, error: ea, refetch } = useData('/api/alerts?resolved=false');

  const resolveAlert = async (id) => {
    await fetch(`${API}/api/alerts/${id}/resolve`, { method:'PATCH' });
    refetch();
  };

  if (lk || la) return <Loading />;
  if (ek || ea) return <ErrorMsg msg={ek || ea} />;

  return (
    <div>
      <SectionHeader title="KPI Monitoring" sub="Live status of all institutional key performance indicators against targets." />
      <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12, marginBottom:22 }}>
        {kpis.map((k, i) => {
          const color = k.status==='good' ? C.success : k.status==='warning' ? C.warn : C.danger;
          return (
            <div key={k.id} className="glass animate-in" style={{ padding:'14px 18px', borderRadius:14, display:'flex', alignItems:'center', justifyContent:'space-between', animation:`fadeInUp 0.4s ease ${i*40}ms both`, transition:'transform .15s', cursor:'default' }}
              onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.borderColor=color+'55';}}
              onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.borderColor='';}}
            >
              <div>
                <div style={{ fontSize:11, color: C.muted, textTransform:'uppercase', letterSpacing:'.05em', marginBottom:4 }}>{k.name}</div>
                <div style={{ display:'flex', alignItems:'baseline', gap:8 }}>
                  <span style={{ fontSize:24, fontWeight:800, color }}>{k.id==='faculty-ratio'?`1:${k.value}`:k.value}{k.id!=='faculty-ratio'?k.unit:''}</span>
                  <span style={{ fontSize:12, color: k.trend?.startsWith('+')?C.success:k.trend?.startsWith('-')?C.danger:C.muted, fontWeight:700 }}>{k.trend}</span>
                </div>
                <div style={{ fontSize:11, color: C.muted, marginTop:3 }}>Target: {k.id==='faculty-ratio'?`1:${k.target}`:`${k.target}${k.unit}`}</div>
              </div>
              <Badge status={k.status} />
            </div>
          );
        })}
      </div>

      <GlassCard title="🚨 Active Alerts" delay={150} style={{ borderColor: alerts?.length ? 'rgba(255,71,87,0.2)' : 'rgba(46,213,115,0.2)' }}>
        {!alerts?.length ? (
          <div style={{ padding:'20px 0', textAlign:'center', color: C.success, fontSize:15, fontWeight:600 }}>✅ No active alerts — all systems nominal!</div>
        ) : (
          <table style={{ width:'100%', fontSize:13, borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
                {['Dept','Issue','Severity','Date',''].map(h =>
                  <th key={h} style={{ textAlign:'left', padding:'8px 14px', color: C.muted, fontWeight:700, fontSize:11, textTransform:'uppercase', letterSpacing:'.05em' }}>{h}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {alerts.map(a => (
                <tr key={a.id} style={{ borderBottom:'1px solid rgba(255,255,255,0.04)', transition:'background .1s' }}
                  onMouseEnter={e=>e.currentTarget.style.background='rgba(255,71,87,0.06)'}
                  onMouseLeave={e=>e.currentTarget.style.background=''}
                >
                  <td style={{ padding:'10px 14px', fontWeight:700 }}>{a.dept}</td>
                  <td style={{ padding:'10px 14px', color: C.muted }}>{a.issue}</td>
                  <td style={{ padding:'10px 14px' }}><Badge status={a.severity} /></td>
                  <td style={{ padding:'10px 14px', color: C.muted, fontSize:11 }}>{a.date}</td>
                  <td style={{ padding:'10px 14px' }}>
                    <button onClick={()=>resolveAlert(a.id)} style={{ fontSize:11, padding:'5px 12px', borderRadius:8, border:`1px solid rgba(108,99,255,0.3)`, background:'rgba(108,99,255,0.1)', cursor:'pointer', color: C.accent, fontWeight:700, fontFamily:'inherit', transition:'background .15s' }}
                      onMouseEnter={e=>e.currentTarget.style.background='rgba(108,99,255,0.25)'}
                      onMouseLeave={e=>e.currentTarget.style.background='rgba(108,99,255,0.1)'}
                    >Resolve ✓</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </GlassCard>
      <AIInsights section="kpis" />
    </div>
  );
}

// ── PAGE: FACULTY ─────────────────────────────────────────────────────────────
function FacultyPage() {
  const { data, loading, error } = useData('/api/faculty');
  if (loading) return <Loading />;
  if (error)   return <ErrorMsg msg={error} />;
  const total = data.reduce((a,f)=>a+f.total,0);
  const pubs  = data.reduce((a,f)=>a+f.publications,0);
  const grants= data.reduce((a,f)=>a+f.grants,0);
  return (
    <div>
      <SectionHeader title="Faculty Overview" sub="Staffing levels, qualifications, research output, and grants across departments." />
      <div style={g3}>
        <StatCard label="Total Faculty"    value={total}  unit="" color={C.accent}  icon="👨‍🏫" delay={0}  />
        <StatCard label="Total Research"   value={pubs}   unit=" papers" color={C.accent2} icon="📄" delay={80} />
        <StatCard label="Active Grants"    value={grants} unit="" color={C.warn}    icon="🏆" delay={160} />
      </div>
      <div style={g2}>
        <GlassCard title="👥 Faculty Composition by Dept" delay={100}>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="dept" fontSize={11} stroke={C.muted} />
              <YAxis fontSize={11} stroke={C.muted} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ fontSize:11, color: C.muted }} />
              <Bar dataKey="permanent" fill={C.accent}  name="Permanent" stackId="a" />
              <Bar dataKey="visiting"  fill={C.accent2} name="Visiting"  stackId="a" radius={[5,5,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>
        <GlassCard title="📄 Publications by Dept" delay={150}>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={data} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis type="number" fontSize={11} stroke={C.muted} />
              <YAxis dataKey="dept" type="category" fontSize={11} stroke={C.muted} width={44} tick={{ fill:'#e8e8f4' }} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="publications" radius={[0,6,6,0]} name="Papers">
                {data.map((_,i)=><Cell key={i} fill={CHART_COLORS[i%CHART_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>
      <GlassCard title="📋 Faculty Details" delay={200}>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', fontSize:13, borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
                {['Dept','Total','Permanent','Visiting','PhD %','Avg Exp','Publications','Grants'].map(h =>
                  <th key={h} style={{ textAlign:'left', padding:'8px 14px', color: C.muted, fontWeight:700, fontSize:11, textTransform:'uppercase', letterSpacing:'.05em' }}>{h}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {data.map((f,i)=>(
                <tr key={f.dept} style={{ borderBottom:'1px solid rgba(255,255,255,0.04)', transition:'background .1s' }}
                  onMouseEnter={e=>e.currentTarget.style.background='rgba(108,99,255,0.07)'}
                  onMouseLeave={e=>e.currentTarget.style.background=''}
                >
                  <td style={{ padding:'10px 14px', fontWeight:700, color: CHART_COLORS[i%CHART_COLORS.length] }}>{f.dept}</td>
                  <td style={{ padding:'10px 14px' }}>{f.total}</td>
                  <td style={{ padding:'10px 14px' }}>{f.permanent}</td>
                  <td style={{ padding:'10px 14px' }}>{f.visiting}</td>
                  <td style={{ padding:'10px 14px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div style={{ flex:1, height:4, borderRadius:2, background:'rgba(255,255,255,0.1)', overflow:'hidden' }}>
                        <div style={{ height:'100%', width:`${f.phd}%`, background:`linear-gradient(90deg,${C.accent},${C.accent2})`, borderRadius:2 }} />
                      </div>
                      <span>{f.phd}%</span>
                    </div>
                  </td>
                  <td style={{ padding:'10px 14px' }}>{f.avgExp} yrs</td>
                  <td style={{ padding:'10px 14px' }}>{f.publications}</td>
                  <td style={{ padding:'10px 14px' }}>{f.grants}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
      <AIInsights section="faculty" />
    </div>
  );
}

// ── PAGE: FINANCIAL ───────────────────────────────────────────────────────────
function FinancialPage() {
  const { data, loading, error } = useData('/api/financial');
  if (loading) return <Loading />;
  if (error)   return <ErrorMsg msg={error} />;
  const latest = data[data.length-1];
  const growth = (((latest.revenue - data[0].revenue) / data[0].revenue) * 100).toFixed(0);
  return (
    <div>
      <SectionHeader title="Financial Overview" sub={`Revenue, expenditure, grants and surplus trends · All figures in ₹ Lakhs · ${growth}% revenue growth since ${data[0].year}`} />
      <div style={g3}>
        <StatCard label="Revenue 2024"    value={latest.revenue}  unit="L" color={C.accent}  icon="💰" delay={0}   />
        <StatCard label="Surplus 2024"    value={latest.surplus}  unit="L" color={C.success}  icon="📈" delay={80}  />
        <StatCard label="Research Grants" value={latest.grants}   unit="L" color={C.warn}    icon="🏆" delay={160} />
      </div>
      <GlassCard title="💹 Revenue vs Expenses (₹ Lakhs)" delay={100}>
        <ResponsiveContainer width="100%" height={240}>
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="year" fontSize={12} stroke={C.muted} />
            <YAxis fontSize={12} stroke={C.muted} />
            <Tooltip contentStyle={TOOLTIP_STYLE} formatter={v=>`₹${v}L`} />
            <Legend wrapperStyle={{ fontSize:11, color: C.muted }} />
            <Bar dataKey="revenue"  fill={C.accent}  name="Revenue"  radius={[5,5,0,0]} />
            <Bar dataKey="expenses" fill={C.danger}   name="Expenses" radius={[5,5,0,0]} />
            <Line type="monotone" dataKey="surplus" stroke={C.success} strokeWidth={2.5} dot={{ r:4, fill:C.success }} name="Surplus" />
          </ComposedChart>
        </ResponsiveContainer>
      </GlassCard>
      <div style={g2}>
        <GlassCard title="📊 Surplus Growth" delay={150}>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="gSurplus" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={C.success} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={C.success} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="year" fontSize={11} stroke={C.muted} />
              <YAxis fontSize={11} stroke={C.muted} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={v=>`₹${v}L`} />
              <Area type="monotone" dataKey="surplus" stroke={C.success} fill="url(#gSurplus)" strokeWidth={2.5} name="Surplus" />
            </AreaChart>
          </ResponsiveContainer>
        </GlassCard>
        <GlassCard title="🏆 Research Grants" delay={200}>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="gGrants" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={C.warn} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={C.warn} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="year" fontSize={11} stroke={C.muted} />
              <YAxis fontSize={11} stroke={C.muted} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={v=>`₹${v}L`} />
              <Area type="monotone" dataKey="grants" stroke={C.warn} fill="url(#gGrants)" strokeWidth={2.5} name="Grants" />
            </AreaChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>
      <AIInsights section="financial" />
    </div>
  );
}

// ── PAGE: AT-RISK STUDENTS ────────────────────────────────────────────────────
function AtRiskPage() {
  const [filter, setFilter] = useState('all');
  const endpoint = filter==='all' ? '/api/students/at-risk' : `/api/students/at-risk?risk=${filter}`;
  const { data, loading, error } = useData(endpoint);

  const riskCounts = data ? {
    high:   data.data?.filter(s=>s.risk==='high').length  || 0,
    medium: data.data?.filter(s=>s.risk==='medium').length || 0,
  } : {};

  return (
    <div>
      <SectionHeader title="At-Risk Student Predictor" sub="Students flagged for low GPA or attendance — enabling early intervention." />

      {data && (
        <div style={g3}>
          <StatCard label="Total At-Risk"    value={data.total}       unit=" students" color={C.danger}  icon="⚠️" delay={0}   />
          <StatCard label="High Risk"        value={riskCounts.high}  unit=""          color={C.danger}  icon="🚨" delay={80}  />
          <StatCard label="Medium Risk"      value={riskCounts.medium}unit=""          color={C.warn}    icon="⚡" delay={160} />
        </div>
      )}

      {/* Filter pills */}
      <div style={{ display:'flex', gap:8, marginBottom:18 }}>
        {[['all','All'],['high','High Risk'],['medium','Medium Risk']].map(([v,l])=>(
          <button key={v} onClick={()=>setFilter(v)} style={{ padding:'7px 18px', borderRadius:20, border:'1px solid', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit', transition:'all .15s',
            background: filter===v ? C.danger : 'rgba(255,71,87,0.08)',
            borderColor: filter===v ? C.danger : 'rgba(255,71,87,0.25)',
            color: filter===v ? '#fff' : C.danger,
          }}>{l}</button>
        ))}
      </div>

      {loading ? <Loading /> : error ? <ErrorMsg msg={error} /> : (
        <GlassCard title={`⚠️ At-Risk Students (${data?.total || 0} total)`} delay={150} style={{ borderColor:'rgba(255,71,87,0.2)' }}>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', fontSize:13, borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
                  {['ID','Dept','Year','GPA','Attendance','Backlogs','Risk Level'].map(h=>
                    <th key={h} style={{ textAlign:'left', padding:'8px 14px', color: C.muted, fontWeight:700, fontSize:11, textTransform:'uppercase', letterSpacing:'.05em' }}>{h}</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {data?.data?.map((s,i)=>(
                  <tr key={s.id} style={{ borderBottom:'1px solid rgba(255,255,255,0.04)', animation:`fadeInUp 0.3s ease ${i*25}ms both`, transition:'background .1s' }}
                    onMouseEnter={e=>e.currentTarget.style.background='rgba(255,71,87,0.06)'}
                    onMouseLeave={e=>e.currentTarget.style.background=''}
                  >
                    <td style={{ padding:'9px 14px', fontFamily:'monospace', color: C.muted, fontSize:11 }}>{s.id}</td>
                    <td style={{ padding:'9px 14px', fontWeight:700 }}>{s.dept}</td>
                    <td style={{ padding:'9px 14px' }}>Year {s.year}</td>
                    <td style={{ padding:'9px 14px' }}>
                      <span style={{ color: s.gpa < 5.5 ? C.danger : C.warn, fontWeight:700 }}>{s.gpa}</span>
                    </td>
                    <td style={{ padding:'9px 14px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <div style={{ width:60, height:4, borderRadius:2, background:'rgba(255,255,255,0.1)', overflow:'hidden' }}>
                          <div style={{ height:'100%', width:`${s.attendance}%`, background: s.attendance<55?C.danger:C.warn, borderRadius:2 }} />
                        </div>
                        <span style={{ color: s.attendance<55?C.danger:C.warn, fontWeight:700 }}>{s.attendance}%</span>
                      </div>
                    </td>
                    <td style={{ padding:'9px 14px', color: s.backlogs > 2 ? C.danger : C.muted }}>{s.backlogs}</td>
                    <td style={{ padding:'9px 14px' }}><Badge status={s.risk} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}
    </div>
  );
}

// ── EXPORT SNAPSHOT ───────────────────────────────────────────────────────────
function ExportButton() {
  const [loading, setLoading] = useState(false);
  async function exportData() {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/api/snapshot`);
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type:'application/json' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = `sc003-snapshot-${new Date().toISOString().slice(0,10)}.json`;
      a.click(); URL.revokeObjectURL(url);
    } finally { setLoading(false); }
  }
  return (
    <button onClick={exportData} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:10, border:`1px solid rgba(0,212,170,0.3)`, background:'rgba(0,212,170,0.08)', color: C.accent2, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit', transition:'all .15s', marginTop:'auto' }}
      onMouseEnter={e=>{e.currentTarget.style.background='rgba(0,212,170,0.16)';}}
      onMouseLeave={e=>{e.currentTarget.style.background='rgba(0,212,170,0.08)';}}
    >
      {loading ? '⏳' : '⬇️'} Export Snapshot
    </button>
  );
}

// ── NAV CONFIG ────────────────────────────────────────────────────────────────
const NAV = [
  { id:'overview',    label:'Overview',             icon:'🏠' },
  { id:'academic',    label:'Academic Performance', icon:'📊' },
  { id:'departments', label:'Dept Comparison',      icon:'🏛️' },
  { id:'enrollment',  label:'Enrollment Trends',    icon:'📈' },
  { id:'kpis',        label:'KPI Monitoring',       icon:'🎯' },
  { id:'faculty',     label:'Faculty',              icon:'👩‍🏫' },
  { id:'financial',   label:'Financial',            icon:'💰' },
  { id:'atrisk',      label:'At-Risk Students',     icon:'⚠️' },
];

// ── ROOT APP ──────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState('overview');
  const { data: summary } = useData('/api/summary');
  const { data: alerts  } = useData('/api/alerts?resolved=false');

  const pages = {
    overview:    <OverviewPage    onNavigate={setPage} />,
    academic:    <AcademicPage   />,
    departments: <DeptPage       />,
    enrollment:  <EnrollmentPage />,
    kpis:        <KpiPage        />,
    faculty:     <FacultyPage    />,
    financial:   <FinancialPage  />,
    atrisk:      <AtRiskPage     />,
  };

  return (
    <div style={{ display:'flex', minHeight:'100vh', position:'relative', zIndex:1 }}>
      {/* ── Sidebar ── */}
      <aside style={{ width:240, background:'rgba(8,8,24,0.95)', backdropFilter:'blur(20px)', display:'flex', flexDirection:'column', position:'sticky', top:0, height:'100vh', overflowY:'auto', flexShrink:0, borderRight:'1px solid rgba(255,255,255,0.06)', zIndex:10 }}>

        {/* Logo */}
        <div style={{ padding:'28px 22px 22px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
            <div style={{ width:32, height:32, borderRadius:9, background:`linear-gradient(135deg,${C.accent},${C.accent2})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, boxShadow:`0 4px 12px rgba(108,99,255,0.4)` }}>📡</div>
            <div>
              <div style={{ fontSize:9, color: C.accent2, fontWeight:700, letterSpacing:'.12em', textTransform:'uppercase' }}>SC003 · Sathakathon 2.0</div>
            </div>
          </div>
          <div style={{ fontSize:14, fontWeight:800, color:'#fff', lineHeight:1.35 }}>Decision Support<br/>Analytics</div>
        </div>

        {/* Live stats */}
        {summary && (
          <div style={{ padding:'14px 22px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
            {[
              ['Students',   summary.totalStudents?.toLocaleString(), ''],
              ['Faculty',    summary.totalFaculty,                    ''],
              ['Departments',summary.departments,                     ''],
              ['Avg GPA',    summary.avgGPA,                         '/10'],
              ['Placement',  summary.placementRate,                   '%'],
              ['Active Alerts', alerts?.length || 0,                  ' 🔴'],
            ].map(([l, v, u]) => (
              <div key={l} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                <span style={{ fontSize:11, color: C.muted }}>{l}</span>
                <span style={{ fontSize:11, fontWeight:700, color: l==='Active Alerts' && alerts?.length>0 ? C.danger : '#fff' }}>{v}{u}</span>
              </div>
            ))}
            <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:8 }}>
              <span className="live-dot" />
              <span style={{ fontSize:10, color: C.muted }}>Live data</span>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav style={{ padding:'12px 12px', flex:1 }}>
          {NAV.map(item => {
            const isActive = page === item.id;
            const alertBadge = item.id==='kpis' && alerts?.length > 0;
            return (
              <button key={item.id} id={`nav-${item.id}`} onClick={()=>setPage(item.id)}
                style={{ display:'flex', alignItems:'center', justifyContent:'space-between', width:'100%', textAlign:'left', padding:'9px 14px', borderRadius:10, marginBottom:2, fontSize:13, fontWeight:600, border:'none', cursor:'pointer', fontFamily:'inherit', transition:'all .15s',
                  background: isActive ? `linear-gradient(135deg,${C.accent}22,${C.accent2}11)` : 'transparent',
                  color: isActive ? '#fff' : C.muted,
                  borderLeft: isActive ? `3px solid ${C.accent}` : '3px solid transparent',
                  boxShadow: isActive ? `inset 0 0 20px rgba(108,99,255,0.1)` : 'none',
                }}
                onMouseEnter={e=>{ if(!isActive) e.currentTarget.style.background='rgba(255,255,255,0.05)'; e.currentTarget.style.color='#fff'; }}
                onMouseLeave={e=>{ if(!isActive) { e.currentTarget.style.background='transparent'; e.currentTarget.style.color=C.muted; } }}
              >
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <span style={{ fontSize:15 }}>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {alertBadge && <span style={{ background:C.danger, color:'#fff', fontSize:10, fontWeight:800, padding:'1px 7px', borderRadius:10, minWidth:18, textAlign:'center' }}>{alerts.length}</span>}
              </button>
            );
          })}
        </nav>

        {/* Export + footer */}
        <div style={{ padding:'14px 16px', borderTop:'1px solid rgba(255,255,255,0.06)' }}>
          <ExportButton />
          <div style={{ fontSize:9, color:'rgba(255,255,255,0.15)', marginTop:12, textAlign:'center', letterSpacing:'.05em' }}>
            SATHAKATHON 2.0 · SC003<br/>Decision Support Analytics
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main key={page} style={{ flex:1, padding:'40px 44px', overflowY:'auto', minHeight:'100vh' }}>
        {pages[page]}
      </main>
    </div>
  );
}
