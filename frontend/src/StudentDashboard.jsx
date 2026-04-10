import { useState, useEffect, useCallback } from 'react';
import { ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis, Tooltip } from 'recharts';

const API = import.meta.env.VITE_API_URL ?? '';

const C = {
  accent:  '#6c63ff',
  accent2: '#00d4aa',
  warn:    '#ff9f43',
  danger:  '#ff4757',
  success: '#2ed573',
  muted:   '#7878a0',
};

function Loading() {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:80, gap:16, width:'100%' }}>
      <div style={{ width:36, height:36, border:`3px solid rgba(108,99,255,0.2)`, borderTop:`3px solid ${C.accent}`, borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
      <span style={{ color: C.muted, fontSize:13 }}>Loading profile…</span>
    </div>
  );
}

function ErrorMsg({ msg }) {
  return (
    <div style={{ padding:'20px 24px', borderRadius:12, background:'rgba(255,71,87,0.1)', color:'#ff6b7a', border:'1px solid rgba(255,71,87,0.25)', fontSize:14 }}>
      ⚠️ Error: {msg}. Please try again later.
    </div>
  );
}

function StatCard({ label, value, unit = '', color, icon, delay = 0 }) {
  return (
    <div className="glass animate-in" style={{
      padding:'22px 24px', borderRadius:16,
      animation: `fadeInUp 0.5s ease ${delay}ms both`,
      cursor:'default', transition:'transform .2s, box-shadow .2s',
      position:'relative', overflow:'hidden', flex:1
    }}
    onMouseEnter={e => { e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow=`0 12px 40px rgba(108,99,255,0.2)`; }}
    onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow=''; }}
    >
      <div style={{ position:'absolute', top:-20, right:-20, width:80, height:80, borderRadius:'50%', background: color, opacity:.12, filter:'blur(20px)', pointerEvents:'none' }} />
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div>
          <div style={{ fontSize:11, color: C.muted, textTransform:'uppercase', letterSpacing:'.08em', fontWeight:600, marginBottom:10 }}>{label}</div>
          <div style={{ fontSize:32, fontWeight:800, color, lineHeight:1 }}>
            {value}<span style={{ fontSize:14, fontWeight:500, opacity:.7, marginLeft:2 }}>{unit}</span>
          </div>
        </div>
        <div style={{ fontSize:28, opacity:.8 }}>{icon}</div>
      </div>
    </div>
  );
}

export default function StudentDashboard({ user, onLogout }) {
  const [data, setData] = useState(null);
  const [absences, setAbsences] = useState([]);
  const [dailyAttendance, setDailyAttendance] = useState([]);
  const [disputesHistory, setDisputesHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Dispute states
  const [disputeDate, setDisputeDate] = useState('');
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeStatus, setDisputeStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetch(`${API}/api/students/${user.id}`).then(r => { if(!r.ok) throw new Error(r.status); return r.json(); }),
      fetch(`${API}/api/students/${user.id}/absences`).then(r => { if(!r.ok) throw new Error(r.status); return r.json(); }),
      fetch(`${API}/api/disputes?studentId=${user.id}`).then(r => { if(!r.ok) throw new Error(r.status); return r.json(); }),
      fetch(`${API}/api/students/${user.id}/daily-attendance`).then(r => { if(!r.ok) throw new Error(r.status); return r.json(); })
    ])
      .then(([d, a, disp, daily]) => { 
        setData(d); 
        setAbsences(daily.filter(x => x.status === 'absent').map(x => x.date)); 
        setDisputesHistory(disp); 
        setDailyAttendance(daily);
        setError(null); 
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [user.id]);

  const handleDisputeSubmit = async (e) => {
    e.preventDefault();
    if (!disputeDate || !disputeReason) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/api/disputes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: user.id, dept: data.dept, date: disputeDate, reason: disputeReason })
      });
      if (!res.ok) throw new Error('Submission failed');
      // Refresh history
      fetch(`${API}/api/disputes?studentId=${user.id}`).then(r=>r.json()).then(setDisputesHistory);
      
      setDisputeStatus('success');
      setDisputeDate('');
      setDisputeReason('');
      setTimeout(() => setDisputeStatus(null), 5000);
    } catch (e) {
      setDisputeStatus('error');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => { load(); }, [load]);

  if (loading) return <div style={{ minHeight:'100vh', display:'flex', background:'#080818' }}><Loading /></div>;
  if (error)   return <div style={{ padding: 40, background:'#080818', minHeight:'100vh' }}><ErrorMsg msg={error} /></div>;

  const attendanceData = [{ name: 'Attendance', value: data.attendance, fill: data.attendance < 60 ? C.danger : data.attendance < 75 ? C.warn : C.success }];
  
  return (
    <div style={{ minHeight:'100vh', background:'#080818', color:'#fff', display:'flex', flexDirection:'column' }}>
      {/* Topbar */}
      <header style={{ padding:'20px 40px', background:'rgba(255,255,255,0.03)', borderBottom:'1px solid rgba(255,255,255,0.08)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:38, height:38, borderRadius:12, background:`linear-gradient(135deg,${C.accent},${C.accent2})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>👨‍🎓</div>
          <div>
            <h2 style={{ fontSize:16, fontWeight:800, margin:0 }}>{data.id}</h2>
            <div style={{ fontSize:12, color:C.muted }}>{data.dept} Department · Year {data.year}</div>
          </div>
        </div>
        <button onClick={onLogout} style={{ padding:'8px 16px', borderRadius:8, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.05)', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer', transition:'all 0.2s' }}
          onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.1)'}
          onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.05)'}
        >
          Logout
        </button>
      </header>

      {/* Main Content */}
      <main style={{ flex:1, padding:40, maxWidth:1000, margin:'0 auto', width:'100%' }}>
        
        <div style={{ marginBottom:32, animation:'fadeInUp 0.4s ease both' }}>
          <h1 style={{ fontSize:28, fontWeight:800, marginBottom:8 }}>Welcome back!</h1>
          <p style={{ color:C.muted, fontSize:14 }}>Here is your current academic standing.</p>
        </div>

        <div style={{ display:'flex', gap:16, marginBottom:24 }}>
          <StatCard label="Current GPA" value={data.gpa} unit="/ 10" color={data.gpa < 5.5 ? C.danger : C.accent} icon="📚" delay={50} />
          <StatCard label="Active Backlogs" value={data.backlogs} color={data.backlogs > 2 ? C.danger : data.backlogs > 0 ? C.warn : C.success} icon="📋" delay={100} />
        </div>

        <div style={{ display:'flex', gap:16 }}>
          {/* Attendance Radial */}
          <div className="glass animate-in" style={{ flex:1, padding:24, borderRadius:16, animation:`fadeInUp 0.5s ease 150ms both` }}>
            <div style={{ fontSize:11, color: C.muted, textTransform:'uppercase', letterSpacing:'.08em', fontWeight:600, marginBottom:10 }}>Attendance Metrics</div>
            <div style={{ position:'relative', height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="100%" barSize={20} data={attendanceData} startAngle={180} endAngle={0}>
                  <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                  <RadialBar background={{ fill: 'rgba(255,255,255,0.05)' }} dataKey="value" cornerRadius={10} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div style={{ position:'absolute', top:'55%', left:'50%', transform:'translate(-50%, -50%)', textAlign:'center' }}>
                <div style={{ fontSize:36, fontWeight:800, color: attendanceData[0].fill }}>{data.attendance}%</div>
                <div style={{ fontSize:12, color:C.muted }}>Present</div>
              </div>
            </div>
            {data.attendance < 60 && (
              <div style={{ marginTop: 16, padding:'12px 16px', background:'rgba(255,71,87,0.1)', borderRadius:8, color:C.danger, fontSize:13, display:'flex', gap:10, alignItems:'center', border:'1px solid rgba(255,71,87,0.2)' }}>
                <span style={{ fontSize:18 }}>⚠️</span>
                <div>Your attendance is critically low. Staff has been notified automatically.</div>
              </div>
            )}
            {data.attendance >= 60 && data.attendance < 75 && (
              <div style={{ marginTop: 16, padding:'12px 16px', background:'rgba(255,159,67,0.1)', borderRadius:8, color:C.warn, fontSize:13, display:'flex', gap:10, alignItems:'center', border:'1px solid rgba(255,159,67,0.2)' }}>
                <span style={{ fontSize:18 }}>⚡</span>
                <div>Warning: Attendance is falling below the 75% requirement.</div>
              </div>
            )}
            {data.attendance >= 75 && (
              <div style={{ marginTop: 16, padding:'12px 16px', background:'rgba(46,213,115,0.1)', borderRadius:8, color:C.success, fontSize:13, display:'flex', gap:10, alignItems:'center', border:'1px solid rgba(46,213,115,0.2)' }}>
                <span style={{ fontSize:18 }}>✅</span>
                <div>You are maintaining good attendance. Keep it up!</div>
              </div>
            )}
          </div>

          <div className="glass animate-in" style={{ flex:1, padding:24, borderRadius:16, animation:`fadeInUp 0.5s ease 200ms both` }}>
            <div style={{ fontSize:11, color: C.muted, textTransform:'uppercase', letterSpacing:'.08em', fontWeight:600, marginBottom:16 }}>Status & Alerts</div>
            
            <div style={{ padding:'16px', borderRadius:12, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', marginBottom:12 }}>
              <div style={{ fontSize:12, color:C.muted, marginBottom:4 }}>Institutional Risk Level</div>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ width:10, height:10, borderRadius:'50%', background: data.risk === 'high' ? C.danger : data.risk === 'medium' ? C.warn : C.success }} />
                <span style={{ fontWeight:700, textTransform:'uppercase' }}>{data.risk} Risk</span>
              </div>
            </div>

            {data.risk === 'high' && (
              <div style={{ padding:'16px', borderRadius:12, background:'rgba(255,71,87,0.05)', border:'1px dashed rgba(255,71,87,0.3)', color:'#fff', fontSize:13, lineHeight:1.5 }}>
                <strong style={{ color:C.danger, display:'block', marginBottom:4 }}>Mandatory Action Required</strong>
                Please schedule a meeting with your department counselor immediately. Your current academic standing is flagged for intervention.
              </div>
            )}
            {data.risk !== 'high' && (
              <div style={{ padding:'16px', borderRadius:12, background:'rgba(46,213,115,0.05)', border:'1px dashed rgba(46,213,115,0.3)', color:'#fff', fontSize:13, lineHeight:1.5 }}>
                <strong style={{ color:C.success, display:'block', marginBottom:4 }}>No Critical Actions</strong>
                You're currently in good standing. Keep engaging with your coursework!
              </div>
            )}
          </div>

        </div>

        </div>

        {/* 30-Day Daily Attendance */}
        <div className="glass animate-in" style={{ padding:24, borderRadius:16, animation:`fadeInUp 0.5s ease 220ms both`, marginTop: 16 }}>
          <div style={{ fontSize:15, fontWeight:800, marginBottom:16, display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontSize:18 }}>🗓️</span> 30-Day Attendance History
          </div>
          <div style={{ display:'flex', gap:6, overflowX:'auto', paddingBottom:8 }}>
            {dailyAttendance.map((day, i) => (
              <div 
                key={i} 
                title={`${day.date}: ${day.status.toUpperCase()}`}
                style={{ 
                  flexShrink:0, width:18, height:18, borderRadius:4, 
                  background: day.status === 'present' ? 'rgba(46,213,115,0.8)' : 'rgba(255,71,87,0.8)',
                  cursor:'crosshair', transition:'transform .1s', 
                  border:'1px solid rgba(255,255,255,0.1)'
                }}
                onMouseEnter={e => e.currentTarget.style.transform='scale(1.2)'}
                onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}
              />
            ))}
            {dailyAttendance.length === 0 && <div style={{ color:C.muted, fontSize:13 }}>Loading history...</div>}
          </div>
        </div>

        {/* Dispute Section */}
        <div className="glass animate-in" style={{ padding:24, borderRadius:16, animation:`fadeInUp 0.5s ease 250ms both`, marginTop: 16 }}>
          <div style={{ fontSize:16, fontWeight:800, marginBottom:16, display:'flex', alignItems:'center', gap:10 }}>
            <span>📅</span> Attendance Log & Disputes
          </div>
          <div style={{ display:'flex', gap:24, flexWrap:'wrap' }}>
            <div style={{ flex: 1, minWidth:250 }}>
              <div style={{ fontSize:11, color: C.muted, textTransform:'uppercase', letterSpacing:'.08em', fontWeight:600, marginBottom:12 }}>Recent Absences</div>
              {absences.length === 0 ? <div style={{ color:C.muted, fontSize:13 }}>No recent absences found.</div> : 
                <ul style={{ listStyle:'none', padding:0, margin:0, display:'flex', flexDirection:'column', gap:8 }}>
                  {absences.map(a => (
                    <li key={a} style={{ padding:'10px 14px', background:'rgba(255,255,255,0.03)', borderRadius:8, fontSize:13, display:'flex', justifyContent:'space-between' }}>
                      <span style={{ fontWeight:600 }}>Absent</span>
                      <span style={{ color:C.muted }}>{a}</span>
                    </li>
                  ))}
                </ul>
              }
            </div>

            <div style={{ flex: 1.5, minWidth: 300 }}>
              <div style={{ fontSize:11, color: C.muted, textTransform:'uppercase', letterSpacing:'.08em', fontWeight:600, marginBottom:12 }}>File a Complaint</div>
              <p style={{ fontSize:12, color:C.muted, marginBottom:16 }}>If you believe an absence was marked in error or due to partiality, file a dispute below. This will directly alert the department staff.</p>
              
              <form onSubmit={handleDisputeSubmit} style={{ display:'flex', flexDirection:'column', gap:12 }}>
                <div style={{ display:'flex', gap:12 }}>
                  <select value={disputeDate} onChange={e=>setDisputeDate(e.target.value)} required style={{ flex:1, padding:'10px', borderRadius:8, background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', color:'#fff', fontSize:13, outline:'none', WebkitAppearance:'none' }}>
                    <option value="" disabled>Select Date...</option>
                    {absences.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <textarea 
                  value={disputeReason} onChange={e=>setDisputeReason(e.target.value)} required
                  placeholder="Explain why this absence is incorrect..."
                  style={{ width:'100%', padding:'12px', borderRadius:8, background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', color:'#fff', fontSize:13, minHeight:80, outline:'none', resize:'vertical', boxSizing:'border-box', fontFamily:'inherit' }}
                />
                <button type="submit" disabled={submitting} style={{ padding:'10px', borderRadius:8, background:`linear-gradient(135deg,${C.accent},${C.accent2})`, color:'#fff', border:'none', fontSize:13, fontWeight:700, cursor:'pointer', opacity: submitting ? 0.7 : 1 }}>
                  {submitting ? 'Submitting...' : 'Submit Complaint'}
                </button>
                {disputeStatus === 'success' && <div style={{ color:C.success, fontSize:12, marginTop:4 }}>✓ Complaint submitted successfully. Staff has been notified.</div>}
                {disputeStatus === 'error' && <div style={{ color:C.danger, fontSize:12, marginTop:4 }}>⚠️ Error submitting complaint. Try again later.</div>}
              </form>
            </div>
          </div>
        </div>

        {/* My Past Complaints */}
        {disputesHistory.length > 0 && (
          <div className="glass animate-in" style={{ padding:24, borderRadius:16, animation:`fadeInUp 0.5s ease 300ms both`, marginTop: 16 }}>
            <div style={{ fontSize:15, fontWeight:800, marginBottom:16, display:'flex', alignItems:'center', gap:10 }}>
              My Past Complaints
            </div>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', fontSize:13, borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
                    {['Date Disputed', 'Reason Submitted', 'Status'].map(h=>
                      <th key={h} style={{ textAlign:'left', padding:'8px 14px', color: C.muted, fontWeight:700, fontSize:11, textTransform:'uppercase', letterSpacing:'.05em' }}>{h}</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {disputesHistory.map((d,i)=>(
                    <tr key={d.id} style={{ borderBottom:'1px solid rgba(255,255,255,0.04)', transition:'background .1s' }}>
                      <td style={{ padding:'10px 14px', fontWeight:700 }}>{d.date}</td>
                      <td style={{ padding:'10px 14px', color: C.muted }}>{d.reason}</td>
                      <td style={{ padding:'10px 14px' }}>
                        {d.status === 'approved' ? (
                          <span style={{ background:'rgba(46,213,115,0.15)', color:C.success, padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700 }}>Approved ✓</span>
                        ) : d.status === 'rejected' ? (
                          <span style={{ background:'rgba(255,71,87,0.15)', color:C.danger, padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700 }}>Rejected ✕</span>
                        ) : (
                          <span style={{ background:'rgba(255,159,67,0.15)', color:C.warn, padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700 }}>Pending ⏳</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
