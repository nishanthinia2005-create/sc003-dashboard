// AI Insights Panel — add this as a floating button or sidebar section
// Uses the Anthropic API to generate plain-English summaries of dashboard data
//
// Usage: import AIInsights from './AIInsights'; then <AIInsights data={yourData}/>

import { useState } from 'react';

export default function AIInsights({ data, label = 'Get AI insights' }) {
  const [insight, setInsight] = useState('');
  const [loading, setLoading] = useState(false);

  async function fetchInsight() {
    setLoading(true);
    setInsight('');
    try {
      const res = await fetch('http://localhost:4000/api/ai-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data }),
      });
      const json = await res.json();
      setInsight(json.insight);
    } catch {
      setInsight('Could not load AI insights. Check your API key in the backend.');
    }
    setLoading(false);
  }

  return (
    <div style={{ marginTop: 16 }}>
      <button onClick={fetchInsight} disabled={loading} style={{
        background: '#534AB7', color: '#fff', border: 'none',
        borderRadius: 8, padding: '9px 16px', fontSize: 13,
        cursor: loading ? 'wait' : 'pointer', fontWeight: 500,
      }}>
        {loading ? 'Analysing...' : label}
      </button>
      {insight && (
        <div style={{
          marginTop: 12, padding: '14px 16px',
          background: '#EEEDFE', borderRadius: 10,
          fontSize: 14, lineHeight: 1.6, color: '#3C3489'
        }}>
          {insight}
        </div>
      )}
    </div>
  );
}

// ── ADD THIS ROUTE TO server.js ───────────────────────────────────────────
/*
const Anthropic = require('@anthropic-ai/sdk');
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

app.post('/api/ai-insight', async (req, res) => {
  const { data } = req.body;
  const msg = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 300,
    messages: [{
      role: 'user',
      content: `You are an institutional analytics advisor. Given this data: ${JSON.stringify(data)}
      Write 3 bullet points of actionable insights for the admin. Be concise and specific.`
    }]
  });
  res.json({ insight: msg.content[0].text });
});
*/
