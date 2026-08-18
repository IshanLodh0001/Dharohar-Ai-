import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    'GOOD': 'badge-good', 'MODERATE': 'badge-moderate',
    'NEEDS ATTENTION': 'badge-attention', 'CRITICAL': 'badge-critical',
  };
  return <span className={`badge ${map[status] || 'badge-moderate'}`}>{status}</span>;
}

function ScoreBar({ score }: { score: number }) {
  const color = score >= 80 ? 'var(--green-light)' : score >= 60 ? '#E8C040' : 'var(--rust-light)';
  return (
    <div className="score-bar-wrap">
      <div className="score-bar" style={{ flex: 1 }}>
        <div className="score-bar-fill" style={{ width: `${score}%`, background: color }} />
      </div>
      <span style={{ fontFamily: 'Cinzel, serif', fontSize: '0.9rem', color, fontWeight: 700, minWidth: 32 }}>
        {score}
      </span>
    </div>
  );
}

export default function MonumentDetail() {
  const router = useRouter();
  const { name } = router.query;
  const [inspections, setInspections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!name) return;
    fetch(`/api/monuments/${encodeURIComponent(name as string)}`)
      .then(r => r.json())
      .then((data) => {
        const sorted = [...data].sort(
          (a: any, b: any) => new Date(a.inspectionDate).getTime() - new Date(b.inspectionDate).getTime()
        );
        setInspections(sorted);
      })
      .finally(() => setLoading(false));
  }, [name]);

  const latest = inspections[inspections.length - 1];

  // Deterioration trend
  let trend = '';
  let trendColor = 'var(--text-muted)';
  if (inspections.length < 2) {
    trend = 'Not enough inspection history to determine deterioration.';
  } else {
    const scores = inspections.map(i => i.results.overallScore);
    const first = scores[0], last = scores[scores.length - 1];
    const diff = last - first;
    if (Math.abs(diff) < 5) { trend = 'Stable'; trendColor = 'var(--gold)'; }
    else if (diff > 0) { trend = 'Improving'; trendColor = 'var(--green-light)'; }
    else { trend = 'Deteriorating'; trendColor = 'var(--rust-light)'; }
  }

  return (
    <>
      <Head>
        <title>{name} — Monument Detail — DharoharAI</title>
        <meta name="description" content={`Inspection history and deterioration timeline for ${name}`} />
      </Head>
      <Layout title={String(name || 'Monument')} subtitle="Monument detail and inspection history">
        <div style={{ marginBottom: 20 }}>
          <Link href="/monuments">
            <button className="btn btn-secondary" id="btn-back-monuments">← Back to Monuments</button>
          </Link>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <div className="spinner" style={{ width: 40, height: 40 }} />
          </div>
        ) : inspections.length === 0 ? (
          <div className="empty-state card">
            <div className="icon">🏛</div>
            <h3>No Inspections Found</h3>
            <p>No inspections recorded for this monument.</p>
          </div>
        ) : (
          <>
            {/* Current Status */}
            {latest && (
              <div className="grid-2" style={{ marginBottom: 32 }}>
                <div className="card">
                  <div className="card-title">Latest Condition</div>
                  <div style={{ marginTop: 12 }}>
                    <ScoreBar score={latest.results.overallScore} />
                    <div style={{ marginTop: 12, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                      <StatusBadge status={latest.results.overallStatus} />
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Last inspected: {latest.inspectionDate}
                      </span>
                    </div>
                    {inspections.length >= 2 && (
                      <div style={{ marginTop: 12, fontSize: '0.875rem' }}>
                        Trend: <span style={{ color: trendColor, fontWeight: 600 }}>{trend}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="card">
                  <div className="card-title">Monument Info</div>
                  <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[
                      ['Location', latest.location || '—'],
                      ['Total Inspections', inspections.length],
                      ['First Inspection', inspections[0].inspectionDate],
                      ['Latest Inspection', latest.inspectionDate],
                    ].map(([label, value]) => (
                      <div key={String(label)} className="result-stat">
                        <span className="result-stat-label">{label}</span>
                        <span className="result-stat-value">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Deterioration Timeline */}
            <div className="ornament"><span className="ornament-text">Deterioration Timeline</span></div>

            {inspections.length < 2 ? (
              <div className="card" style={{ marginBottom: 32 }}>
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>
                  Not enough inspection history to determine deterioration.
                </p>
              </div>
            ) : (
              <div className="card" style={{ marginBottom: 32 }}>
                <div className="card-title">Score Over Time</div>
                <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {inspections.map((insp, i) => (
                    <div key={insp.id} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ minWidth: 100, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {insp.inspectionDate}
                      </div>
                      <div style={{ flex: 1 }}>
                        <ScoreBar score={insp.results.overallScore} />
                      </div>
                      <StatusBadge status={insp.results.overallStatus} />
                      <Link href={`/inspections/${insp.id}`}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--gold)', cursor: 'pointer' }}>View →</span>
                      </Link>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 20, padding: '12px 16px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)' }}>
                  <span style={{ fontSize: '0.875rem', color: trendColor, fontWeight: 600 }}>
                    Overall Trend: {trend}
                  </span>
                </div>
              </div>
            )}

            {/* Inspection History */}
            <div className="ornament"><span className="ornament-text">Inspection Records</span></div>
            <div className="timeline">
              {[...inspections].reverse().map((insp) => (
                <div className="timeline-item" key={insp.id}>
                  <div className="timeline-dot" />
                  <div className="timeline-date">{insp.inspectionDate}</div>
                  <div className="timeline-content">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                      <div>
                        <div style={{ fontWeight: 600, marginBottom: 4 }}>
                          Score: <span style={{ fontFamily: 'Cinzel, serif', color: 'var(--gold-light)' }}>
                            {insp.results.overallScore}
                          </span>
                        </div>
                        <StatusBadge status={insp.results.overallStatus} />
                        {insp.inspectorName && (
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
                            Inspector: {insp.inspectorName}
                          </div>
                        )}
                      </div>
                      <Link href={`/inspections/${insp.id}`}>
                        <button className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                          id={`btn-timeline-insp-${insp.id}`}>
                          View Report →
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Layout>
    </>
  );
}
