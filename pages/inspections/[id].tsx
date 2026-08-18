import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';

const MODEL_ICONS: Record<string, string> = {
  'Crack': '🔓', 'Corrosion': '🦠', 'Discoloration': '🎨',
  'Building Damage': '🏚', 'Spalling': '🪨', 'Vegetation Growth': '🌿',
};

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    'GOOD': 'badge-good', 'MODERATE': 'badge-moderate',
    'NEEDS ATTENTION': 'badge-attention', 'CRITICAL': 'badge-critical',
  };
  return <span className={`badge ${map[status] || 'badge-moderate'}`}>{status}</span>;
}

function ScoreRing({ score }: { score: number }) {
  const radius = 54;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (score / 100) * circ;
  const color = score >= 80 ? '#5E9474' : score >= 60 ? '#E8C040' : score >= 40 ? '#E87040' : '#E84040';

  return (
    <div className="score-ring" style={{ width: 140, height: 140 }}>
      <svg viewBox="0 0 130 130">
        <circle cx="65" cy="65" r={radius} fill="none" stroke="var(--bg-surface)" strokeWidth="12" />
        <circle cx="65" cy="65" r={radius} fill="none" stroke={color} strokeWidth="12"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transform: 'rotate(-90deg)', transformOrigin: '65px 65px' }} />
      </svg>
      <div className="score-ring-text">
        <span className="score-number" style={{ fontSize: '2.2rem' }}>{score}</span>
        <span className="score-label">/ 100</span>
      </div>
    </div>
  );
}

export default function InspectionDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    fetch(`/api/inspections/${id}`)
      .then(r => { if (!r.ok) throw new Error('Not found'); return r.json(); })
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <Layout title="Inspection Report">
      <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
        <div className="spinner" style={{ width: 40, height: 40 }} />
      </div>
    </Layout>
  );

  if (error || !data) return (
    <Layout title="Inspection Report">
      <div className="alert alert-error">{error || 'Inspection not found'}</div>
    </Layout>
  );

  const r = data.results;

  return (
    <>
      <Head>
        <title>{data.monumentName} — Inspection Report — DharoharAI</title>
        <meta name="description" content={`AI inspection report for ${data.monumentName} on ${data.inspectionDate}`} />
      </Head>
      <Layout title="Inspection Report" subtitle={`${data.monumentName} — ${data.inspectionDate}`}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          <Link href="/inspections"><button className="btn btn-secondary" id="btn-back-to-inspections">← Back to History</button></Link>
          <Link href={`/monuments/${encodeURIComponent(data.monumentName)}`}>
            <button className="btn btn-secondary" id="btn-view-monument">View Monument →</button>
          </Link>
        </div>

        {/* Overview */}
        <div className="grid-2" style={{ marginBottom: 32 }}>
          <div className="card">
            <div className="card-title">Monument Information</div>
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                ['Monument', data.monumentName],
                ['Location', data.location || '—'],
                ['Inspection Date', data.inspectionDate],
                ['Inspector', data.inspectorName || '—'],
                ['Inspection ID', data.id],
                ['Recorded At', new Date(data.createdAt).toLocaleString()],
              ].map(([label, value]) => (
                <div key={label} className="result-stat">
                  <span className="result-stat-label">{label}</span>
                  <span className="result-stat-value" style={{ textAlign: 'right', maxWidth: '60%', wordBreak: 'break-all' }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, justifyContent: 'center' }}>
            <div className="card-title" style={{ alignSelf: 'flex-start' }}>Overall Condition</div>
            <ScoreRing score={r.overallScore} />
            <StatusBadge status={r.overallStatus} />
          </div>
        </div>

        {/* Monument Image */}
        {data.imagePath && (
          <div className="card" style={{ marginBottom: 32 }}>
            <div className="card-title">📷 Monument Image</div>
            <div style={{ marginTop: 12, borderRadius: 'var(--radius-md)', overflow: 'hidden', background: '#000', maxHeight: 500, display: 'flex', justifyContent: 'center' }}>
              <img src={data.imagePath} alt={data.monumentName} style={{ maxWidth: '100%', maxHeight: 500, objectFit: 'contain' }} />
            </div>
          </div>
        )}

        {/* Notes */}
        {data.notes && (
          <div className="card" style={{ marginBottom: 32 }}>
            <div className="card-title">📝 Inspector Notes</div>
            <p style={{ marginTop: 8, color: 'var(--text-primary)', lineHeight: 1.7 }}>{data.notes}</p>
          </div>
        )}

        {/* Model Results */}
        <div className="ornament"><span className="ornament-text">AI Model Results</span></div>
        <div className="result-grid" style={{ marginBottom: 32 }}>
          {(['crack', 'corrosion', 'discoloration', 'buildingDamage', 'spalling', 'vegetation'] as const).map(key => {
            const m = r[key];
            if (!m) return null;
            const icon = MODEL_ICONS[m.model] || '📊';
            const cls = m.status === 'error' ? 'error-card' : m.detected ? 'detected' : 'not-detected';
            return (
              <div key={key} className={`result-card ${cls}`}>
                <div className="result-card-header">
                  <div className="result-card-title">{icon} {m.model}</div>
                  {m.status === 'error' ? (
                    <span className="result-detection-badge" style={{ background: 'rgba(90,80,64,0.3)', color: 'var(--text-muted)' }}>Error</span>
                  ) : (
                    <span className={`result-detection-badge ${m.detected ? 'detected-true' : 'detected-false'}`}>
                      {m.detected ? 'Detected' : 'Not Detected'}
                    </span>
                  )}
                </div>
                {m.status === 'error' ? (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 8 }}>{m.message}</p>
                ) : (
                  <>
                    {[
                      ['Detections', m.count],
                      ['Avg Confidence', m.confidence !== undefined ? `${m.confidence}%` : '—'],
                      ['Severity', m.severity],
                      ['Health Score', `${m.score}/100`],
                    ].map(([label, value]) => (
                      <div key={String(label)} className="result-stat">
                        <span className="result-stat-label">{label}</span>
                        <span className="result-stat-value">{value}</span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Recommendations */}
        {r.recommendations?.length > 0 && (
          <>
            <div className="ornament"><span className="ornament-text">Recommendations</span></div>
            <div className="recommendation-list">
              {r.recommendations.map((rec: string, i: number) => (
                <div key={i} className="recommendation-item">
                  <span className="recommendation-icon">→</span>
                  {rec}
                </div>
              ))}
            </div>
          </>
        )}
      </Layout>
    </>
  );
}
