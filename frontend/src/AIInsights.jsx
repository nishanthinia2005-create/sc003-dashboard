// AI Insights Panel — fetches from /api/ai-insight on the Express backend
// Usage: <AIInsights section="academic" />  (section = academic|departments|enrollment|kpis|faculty|financial)

import { useState } from 'react';

const API = import.meta.env.VITE_API_URL ?? '';

export default function AIInsights({ section = 'academic', label = 'Get AI Insights' }) {
  const [insight, setInsight] = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  async function fetchInsight() {
    setLoading(true);
    setInsight('');
    setError('');
    try {
      const res = await fetch(`${API}/api/ai-insight`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ section }),
      });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const json = await res.json();
      setInsight(json.insight);
    } catch (e) {
      setError('Could not load AI insights. Make sure the backend is running on port 4000.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ marginTop: 16 }}>
      <button
        id={`ai-btn-${section}`}
        onClick={fetchInsight}
        disabled={loading}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 7,
          background: 'linear-gradient(135deg,#534AB7,#7b73d3)',
          color: '#fff', border: 'none', borderRadius: 10,
          padding: '10px 18px', fontSize: 13, fontWeight: 600,
          cursor: loading ? 'wait' : 'pointer',
          transition: 'opacity .2s, transform .1s', fontFamily: 'inherit',
        }}
      >
        <span>✨</span>
        {loading ? 'Analysing…' : label}
      </button>

      {error && (
        <div style={{
          marginTop: 12, padding: '12px 16px',
          background: '#fcebeb', borderRadius: 10,
          fontSize: 13, color: '#a32d2d', border: '1px solid #f5c2c2',
        }}>
          {error}
        </div>
      )}

      {insight && !error && (
        <div style={{
          marginTop: 14, padding: '16px 18px',
          background: 'linear-gradient(135deg,#EEEDFE,#f0eeff)',
          borderRadius: 12, border: '1px solid #d5d0f5',
        }}>
          {insight.split('\n').map((line, i) => (
            <div key={i} style={{ fontSize: 14, lineHeight: 1.7, color: '#3C3489', marginBottom: i < insight.split('\n').length - 1 ? 8 : 0 }}>
              {line}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
