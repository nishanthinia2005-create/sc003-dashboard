import { useState } from 'react';

const C = {
  accent:  '#6c63ff',
  accent2: '#00d4aa',
  muted:   '#7878a0',
};

export default function Login({ onLogin }) {
  const [role, setRole] = useState('staff');
  const [studentId, setStudentId] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (role === 'staff') {
      onLogin({ role: 'staff', name: 'Dr. Admin' });
    } else {
      if (!studentId) return;
      onLogin({ role: 'student', id: studentId.toUpperCase() });
    }
  };

  return (
    <div style={{ display:'flex', minHeight:'100vh', alignItems:'center', justifyContent:'center', background:'#080818', fontFamily:'Inter, sans-serif', width:'100%' }}>
      <div className="glass animate-in" style={{ width: 400, padding: 40, borderRadius: 24, boxShadow: '0 20px 60px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.05)', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-40, right:-40, width:150, height:150, borderRadius:'50%', background: C.accent, opacity:0.15, filter:'blur(40px)', pointerEvents:'none' }} />
        
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ width:48, height:48, margin:'0 auto 16px', borderRadius:14, background:`linear-gradient(135deg,${C.accent},${C.accent2})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, boxShadow:`0 8px 24px rgba(108,99,255,0.4)` }}>📡</div>
          <h1 style={{ fontSize:24, fontWeight:800, color:'#fff', marginBottom:8 }}>Institutional Portal</h1>
          <p style={{ fontSize:14, color: C.muted }}>Sign in to access your dashboard</p>
        </div>

        <div style={{ display:'flex', background:'rgba(255,255,255,0.05)', borderRadius:12, padding:4, marginBottom:24 }}>
          {['staff', 'student'].map(r => (
            <button key={r} type="button" onClick={() => setRole(r)} style={{ flex:1, padding:'10px 0', border:'none', background: role===r ? 'rgba(255,255,255,0.1)' : 'transparent', color: role===r ? '#fff' : C.muted, borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer', transition:'all 0.2s', textTransform:'capitalize', boxShadow: role===r ? '0 4px 12px rgba(0,0,0,0.2)' : 'none' }}>
              {r} Login
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {role === 'student' && (
            <div>
              <label style={{ display:'block', fontSize:12, color: C.muted, marginBottom:6, fontWeight:600 }}>Student ID</label>
              <input 
                type="text" 
                placeholder="e.g. STU-1002" 
                value={studentId}
                onChange={e => setStudentId(e.target.value)}
                autoFocus
                style={{ width:'100%', padding:'12px 16px', borderRadius:10, background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', color:'#fff', fontSize:14, outline:'none', boxSizing:'border-box' }}
              />
            </div>
          )}
          {role === 'staff' && (
            <div>
              <label style={{ display:'block', fontSize:12, color: C.muted, marginBottom:6, fontWeight:600 }}>Staff ID / Email (Demo Mode)</label>
              <input 
                type="text" 
                placeholder="Any credentials accepted" 
                disabled
                style={{ width:'100%', padding:'12px 16px', borderRadius:10, background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', color:'#e8e8f4', fontSize:14, boxSizing:'border-box' }}
              />
            </div>
          )}
          
          <button type="submit" style={{ width:'100%', padding:'14px', borderRadius:10, background:`linear-gradient(135deg,${C.accent},${C.accent2})`, color:'#fff', border:'none', fontSize:14, fontWeight:700, cursor:'pointer', marginTop:8, boxShadow:'0 8px 24px rgba(108,99,255,0.4)', transition:'transform 0.2s' }}
            onMouseEnter={e=>e.currentTarget.style.transform='translateY(-2px)'}
            onMouseLeave={e=>e.currentTarget.style.transform=''}
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
