import Head from 'next/head';
import Layout from '../components/Layout';

const MODELS = [
  {
    name: 'Crack Detection',
    icon: '🔓',
    workflow: 'general-segmentation-api-14',
    class: 'Crack',
    description: 'Detects structural cracks in stone, concrete, or masonry surfaces using segmentation.',
  },
  {
    name: 'Corrosion Detection',
    icon: '🦠',
    workflow: 'general-segmentation-api-13',
    class: 'Corrosion',
    description: 'Identifies corrosion and rust on metal structural components and reinforcements.',
  },
  {
    name: 'Discoloration Detection',
    icon: '🎨',
    workflow: 'general-segmentation-api-15',
    class: 'Discoloration',
    description: 'Identifies surface discoloration caused by moisture, biological growth, or chemical reactions.',
  },
  {
    name: 'Building Damage Detection',
    icon: '🏚',
    workflow: 'building-damage-detection-ahwco/2',
    class: 'Various',
    description: 'General structural damage detection using object detection on the full monument surface.',
  },
  {
    name: 'Spalling Detection',
    icon: '🪨',
    workflow: 'building-damage-detection-ahwco/2',
    class: 'Spalling',
    description: 'Detects spalling — detachment of surface material — only if the class appears in the building damage model response.',
  },
  {
    name: 'Vegetation Growth Detection',
    icon: '🌿',
    workflow: 'general-segmentation-api-18',
    class: 'vegetation',
    description: 'Detects vegetation growth on monument surfaces, which can cause root damage and moisture retention.',
  },
];

const CONDITIONS = [
  { range: '80–100', status: 'GOOD',           color: 'var(--status-good-text)',       desc: 'Monument is in good condition. Routine monitoring recommended.' },
  { range: '60–79',  status: 'MODERATE',        color: 'var(--status-moderate-text)',   desc: 'Minor deterioration present. Plan for preventive maintenance.' },
  { range: '40–59',  status: 'NEEDS ATTENTION', color: 'var(--status-attention-text)',  desc: 'Significant deterioration. Professional assessment required soon.' },
  { range: '0–39',   status: 'CRITICAL',        color: 'var(--status-critical-text)',   desc: 'Severe deterioration. Immediate intervention required.' },
];

export default function DocumentationPage() {
  return (
    <>
      <Head>
        <title>Documentation — DharoharAI</title>
        <meta name="description" content="Technical documentation for DharoharAI — AI models, scoring system, and platform guide." />
      </Head>
      <Layout title="Documentation" subtitle="Technical reference for the DharoharAI platform">
        {/* Platform Overview */}
        <div className="card" style={{ marginBottom: 32 }}>
          <h2 style={{ fontFamily: 'Cinzel, serif', color: 'var(--gold-light)', fontSize: '1.1rem', marginBottom: 12 }}>
            Platform Overview
          </h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
            DharoharAI is an AI-powered heritage monument inspection platform. It uses six real Roboflow 
            machine learning models to analyse uploaded monument images and detect structural and biological 
            deterioration in real time. Results are stored, tracked over time, and used to generate 
            actionable conservation recommendations.
          </p>
        </div>

        {/* AI Models */}
        <div className="ornament"><span className="ornament-text">AI Models</span></div>
        <div className="result-grid" style={{ marginBottom: 32 }}>
          {MODELS.map((m) => (
            <div key={m.name} className="card">
              <div className="card-title">{m.icon} {m.name}</div>
              <div style={{ marginTop: 10, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                {m.description}
              </div>
              <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div className="result-stat">
                  <span className="result-stat-label">Model / Workflow</span>
                  <span className="result-stat-value" style={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>{m.workflow}</span>
                </div>
                <div className="result-stat">
                  <span className="result-stat-label">Target Class</span>
                  <span className="result-stat-value">{m.class}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Scoring System */}
        <div className="ornament"><span className="ornament-text">Condition Scoring</span></div>
        <div className="card" style={{ marginBottom: 32 }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.7 }}>
            Each model returns a per-category health score (0–100) based on the number of detections 
            and their confidence. The overall score is the average of all six model scores.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {CONDITIONS.map((c) => (
              <div key={c.status} style={{ display: 'flex', gap: 16, alignItems: 'flex-start', padding: '12px 16px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', borderLeft: `3px solid ${c.color}` }}>
                <div style={{ minWidth: 60, fontFamily: 'Cinzel, serif', color: c.color, fontWeight: 700 }}>{c.range}</div>
                <div style={{ minWidth: 130 }}><span className={`badge badge-${c.status.toLowerCase().replace(' ', '-')}`}>{c.status}</span></div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{c.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Workflow */}
        <div className="ornament"><span className="ornament-text">Inspection Workflow</span></div>
        <div className="card" style={{ marginBottom: 32 }}>
          {[
            ['1', 'Upload Image', 'Upload a clear photograph of the monument from the AI Inspection page.'],
            ['2', 'Enter Metadata', 'Provide monument name, location, date, inspector name, and optional notes.'],
            ['3', 'AI Analysis', 'Click "Analyze Monument" — the image is sent to all 6 Roboflow models on the server.'],
            ['4', 'View Results', 'Real detection results are displayed with confidence scores, severity, and detection count.'],
            ['5', 'Review Recommendations', 'AI-generated recommendations are based on actual detected defects.'],
            ['6', 'Track Over Time', 'Each inspection is saved. Run subsequent inspections to track deterioration trends.'],
          ].map(([num, title, desc]) => (
            <div key={num} style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', background: 'var(--gold-dark)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'Cinzel, serif', fontSize: '0.8rem', color: '#0C0902', flexShrink: 0, marginTop: 2,
              }}>{num}</div>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{title}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* API Reference */}
        <div className="ornament"><span className="ornament-text">API Reference</span></div>
        <div className="card">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { method: 'POST', path: '/api/inspect', desc: 'Run AI analysis on an uploaded monument image.' },
              { method: 'GET',  path: '/api/inspections', desc: 'List all inspection records.' },
              { method: 'GET',  path: '/api/inspections?stats=true', desc: 'Get dashboard statistics.' },
              { method: 'GET',  path: '/api/inspections/[id]', desc: 'Get a single inspection by ID.' },
              { method: 'GET',  path: '/api/monuments', desc: 'List all monuments with condition summaries.' },
              { method: 'GET',  path: '/api/monuments/[name]', desc: 'Get all inspections for a specific monument.' },
            ].map((ep) => (
              <div key={ep.path} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <span style={{
                  minWidth: 52, padding: '2px 8px', borderRadius: 4,
                  background: ep.method === 'POST' ? 'rgba(200,160,80,0.2)' : 'rgba(61,107,80,0.2)',
                  color: ep.method === 'POST' ? 'var(--gold-light)' : 'var(--green-light)',
                  fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: 700, textAlign: 'center',
                }}>{ep.method}</span>
                <span style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{ep.path}</span>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>— {ep.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </Layout>
    </>
  );
}
