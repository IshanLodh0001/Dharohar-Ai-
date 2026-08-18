import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { getAllMonuments, getAllInspections } from '../lib/storage';

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    'GOOD': 'badge-good', 'MODERATE': 'badge-moderate',
    'NEEDS ATTENTION': 'badge-attention', 'CRITICAL': 'badge-critical',
  };
  return <span className={`badge ${map[status] || 'badge-moderate'}`}>{status}</span>;
}

function TrendBadge({ trend }: { trend: string }) {
  const colorMap: Record<string, string> = {
    'Improving': 'var(--green-light)', 'Stable': 'var(--gold)',
    'Deteriorating': 'var(--rust-light)', 'Insufficient Data': 'var(--text-muted)',
  };
  const iconMap: Record<string, string> = {
    'Improving': '↗', 'Stable': '→', 'Deteriorating': '↘', 'Insufficient Data': '?',
  };
  return (
    <span style={{ color: colorMap[trend] || 'var(--text-muted)', fontWeight: 600 }}>
      {iconMap[trend]} {trend}
    </span>
  );
}

export default function TimelinePage() {
  const [monuments, setMonuments] = useState<any[]>([]);
  const [inspections, setInspections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const mons = getAllMonuments();
      const insps = getAllInspections();
      setMonuments(mons);
      setInspections(insps);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Group inspections by monument, sorted by date
  const byMonument: Record<string, any[]> = {};
  for (const insp of inspections) {
    const key = insp.monumentName.toLowerCase();
    if (!byMonument[key]) byMonument[key] = [];
    byMonument[key].push(insp);
  }
  for (const key of Object.keys(byMonument)) {
    byMonument[key].sort((a, b) => new Date(a.inspectionDate).getTime() - new Date(b.inspectionDate).getTime());
  }

  return (
    <>
      <Head>
        <title>Deterioration Timeline — DharoharAI</title>
        <meta name="description" content="Visualize deterioration trends across all heritage monuments over time." />
      </Head>
      <Layout title="Deterioration Timeline" subtitle="Historical condition trends across all monuments">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <div className="spinner" style={{ width: 40, height: 40 }} />
          </div>
        ) : monuments.length === 0 ? (
          <div className="empty-state card">
            <div className="icon">📈</div>
            <h3>No Timeline Data</h3>
            <p>Perform multiple inspections of the same monument to track deterioration over time.</p>
            <Link href="/inspect" style={{ marginTop: 16, display: 'inline-block' }}>
              <button className="btn btn-primary" id="btn-start-timeline-inspection">Start Inspection</button>
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            {monuments.map((monument) => {
              const key = monument.name.toLowerCase();
              const mInsps = byMonument[key] || [];
              return (
                <div key={monument.name} className="card fade-in">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
                    <div>
                      <div className="card-title">{monument.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>{monument.location}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                      <TrendBadge trend={monument.trend} />
                      <StatusBadge status={monument.latestStatus} />
                      <Link href={`/monuments/${encodeURIComponent(monument.name)}`}>
                        <button className="btn btn-secondary" style={{ padding: '5px 12px', fontSize: '0.78rem' }}
                          id={`btn-timeline-monument-${monument.name.replace(/\s+/g, '-')}`}>
                          Details →
                        </button>
                      </Link>
                    </div>
                  </div>

                  {mInsps.length < 2 ? (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', padding: '8px 0' }}>
                      Not enough inspection history to determine deterioration.
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {mInsps.map((insp, idx) => {
                        const prevScore = idx > 0 ? mInsps[idx - 1].results.overallScore : null;
                        const delta = prevScore !== null ? insp.results.overallScore - prevScore : null;
                        const score = insp.results.overallScore;
                        const barColor = score >= 80 ? 'var(--green-light)' : score >= 60 ? '#E8C040' : score >= 40 ? '#E87040' : '#E84040';

                        return (
                          <div key={insp.id} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <div style={{ minWidth: 110, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                              {insp.inspectionDate}
                            </div>
                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div className="score-bar" style={{ flex: 1 }}>
                                <div className="score-bar-fill" style={{ width: `${score}%`, background: barColor }} />
                              </div>
                              <span style={{ fontFamily: 'Cinzel, serif', fontSize: '0.85rem', color: barColor, minWidth: 28, fontWeight: 700 }}>
                                {score}
                              </span>
                            </div>
                            <StatusBadge status={insp.results.overallStatus} />
                            {delta !== null && (
                              <span style={{
                                fontSize: '0.75rem', fontWeight: 600, minWidth: 32,
                                color: delta > 0 ? 'var(--green-light)' : delta < 0 ? 'var(--rust-light)' : 'var(--text-muted)',
                              }}>
                                {delta > 0 ? `+${delta}` : delta < 0 ? `${delta}` : '='}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Layout>
    </>
  );
}
