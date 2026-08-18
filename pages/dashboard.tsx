import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import Layout from '../components/Layout';

interface Stats {
  totalMonuments: number;
  totalInspections: number;
  criticalMonuments: number;
  needsAttention: number;
  averageConditionScore: number;
  recentInspections: any[];
}

function ScoreRing({ score }: { score: number }) {
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? '#5E9474' : score >= 60 ? '#E8C040' : score >= 40 ? '#E87040' : '#E84040';

  return (
    <div className="score-ring">
      <svg viewBox="0 0 110 110">
        <circle cx="55" cy="55" r={radius} fill="none" stroke="var(--bg-surface)" strokeWidth="10" />
        <circle
          cx="55" cy="55" r={radius} fill="none"
          stroke={color} strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <div className="score-ring-text">
        <span className="score-number">{score}</span>
        <span className="score-label">Score</span>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    'GOOD': 'badge-good',
    'MODERATE': 'badge-moderate',
    'NEEDS ATTENTION': 'badge-attention',
    'CRITICAL': 'badge-critical',
  };
  return <span className={`badge ${map[status] || 'badge-moderate'}`}>{status}</span>;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/inspections?stats=true')
      .then(r => r.json())
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Head>
        <title>Dashboard — DharoharAI</title>
        <meta name="description" content="Heritage monument inspection dashboard — overview of all monuments and inspection data." />
      </Head>
      <Layout title="Heritage Dashboard" subtitle="Overview of monument health and inspection data">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
            <div className="spinner" style={{ width: 40, height: 40 }} />
          </div>
        ) : (
          <>
            {/* ── Stat Cards ── */}
            <div className="stat-grid">
              {[
                { icon: '🏛', value: stats?.totalMonuments ?? 0,          label: 'Total Monuments' },
                { icon: '📋', value: stats?.totalInspections ?? 0,        label: 'Total Inspections' },
                { icon: '🚨', value: stats?.criticalMonuments ?? 0,        label: 'Critical Monuments' },
                { icon: '⚠️', value: stats?.needsAttention ?? 0,          label: 'Needs Attention' },
                { icon: '📊', value: `${stats?.averageConditionScore ?? 0}`, label: 'Avg Condition Score' },
              ].map((s) => (
                <div className="stat-card fade-in" key={s.label}>
                  <div className="stat-icon">{s.icon}</div>
                  <div className="stat-value">{s.value}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              ))}
            </div>

            {/* ── Quick Actions ── */}
            <div className="ornament">
              <span className="ornament-text">Quick Actions</span>
            </div>

            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 32 }}>
              <Link href="/inspect">
                <button className="btn btn-primary btn-lg" id="btn-new-inspection">
                  🔍 New AI Inspection
                </button>
              </Link>
              <Link href="/monuments">
                <button className="btn btn-secondary btn-lg" id="btn-view-monuments">
                  🏛 View Monuments
                </button>
              </Link>
              <Link href="/timeline">
                <button className="btn btn-secondary btn-lg" id="btn-timeline">
                  📈 Deterioration Timeline
                </button>
              </Link>
            </div>

            {/* ── Recent Inspections ── */}
            <div className="ornament">
              <span className="ornament-text">Recent Inspections</span>
            </div>

            {!stats?.recentInspections?.length ? (
              <div className="empty-state card">
                <div className="icon">🏛</div>
                <h3>No Inspections Yet</h3>
                <p>Run your first AI inspection to see results here.</p>
                <Link href="/inspect" style={{ marginTop: 16, display: 'inline-block' }}>
                  <button className="btn btn-primary" id="btn-first-inspection">Start Inspection</button>
                </Link>
              </div>
            ) : (
              <div className="table-wrap fade-in">
                <table>
                  <thead>
                    <tr>
                      <th>Monument</th>
                      <th>Location</th>
                      <th>Date</th>
                      <th>Inspector</th>
                      <th>Score</th>
                      <th>Status</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentInspections.map((insp: any) => (
                      <tr key={insp.id}>
                        <td style={{ fontWeight: 600 }}>{insp.monumentName}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{insp.location || '—'}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{insp.inspectionDate}</td>
                        <td>{insp.inspectorName || '—'}</td>
                        <td>
                          <div className="score-bar-wrap">
                            <div className="score-bar" style={{ width: 60 }}>
                              <div
                                className="score-bar-fill"
                                style={{
                                  width: `${insp.results?.overallScore ?? 0}%`,
                                  background: (insp.results?.overallScore ?? 0) >= 80 ? 'var(--green-light)' :
                                    (insp.results?.overallScore ?? 0) >= 60 ? '#E8C040' : 'var(--rust-light)',
                                }}
                              />
                            </div>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                              {insp.results?.overallScore ?? '—'}
                            </span>
                          </div>
                        </td>
                        <td><StatusBadge status={insp.results?.overallStatus ?? 'MODERATE'} /></td>
                        <td>
                          <Link href={`/inspections/${insp.id}`}>
                            <span style={{ color: 'var(--gold)', fontSize: '0.8rem', cursor: 'pointer' }}>
                              View →
                            </span>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </Layout>
    </>
  );
}
