import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    'GOOD': 'badge-good', 'MODERATE': 'badge-moderate',
    'NEEDS ATTENTION': 'badge-attention', 'CRITICAL': 'badge-critical',
  };
  return <span className={`badge ${map[status] || 'badge-moderate'}`}>{status}</span>;
}

function TrendIcon({ trend }: { trend: string }) {
  const map: Record<string, { icon: string; color: string }> = {
    'Improving':       { icon: '↗', color: 'var(--green-light)' },
    'Stable':          { icon: '→', color: 'var(--gold)' },
    'Deteriorating':   { icon: '↘', color: 'var(--rust-light)' },
    'Insufficient Data':{ icon: '?', color: 'var(--text-muted)' },
  };
  const { icon, color } = map[trend] || { icon: '?', color: 'var(--text-muted)' };
  return <span style={{ color, fontWeight: 700 }}>{icon} {trend}</span>;
}

export default function MonumentsPage() {
  const [monuments, setMonuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/monuments')
      .then(r => r.json())
      .then(setMonuments)
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Head>
        <title>Monuments — DharoharAI</title>
        <meta name="description" content="View all heritage monuments tracked in the DharoharAI inspection system." />
      </Head>
      <Layout title="Monuments" subtitle="All heritage structures under monitoring">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <div className="spinner" style={{ width: 40, height: 40 }} />
          </div>
        ) : monuments.length === 0 ? (
          <div className="empty-state card">
            <div className="icon">🏛</div>
            <h3>No Monuments Yet</h3>
            <p>Monuments appear automatically after their first inspection.</p>
            <Link href="/inspect" style={{ marginTop: 16, display: 'inline-block' }}>
              <button className="btn btn-primary" id="btn-first-monument-inspection">Start Inspection</button>
            </Link>
          </div>
        ) : (
          <div className="table-wrap fade-in">
            <table>
              <thead>
                <tr>
                  <th>Monument</th>
                  <th>Location</th>
                  <th>Inspections</th>
                  <th>Latest Score</th>
                  <th>Status</th>
                  <th>Trend</th>
                  <th>Last Inspected</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {monuments.map((m) => (
                  <tr key={m.name}>
                    <td style={{ fontWeight: 600 }}>{m.name}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{m.location || '—'}</td>
                    <td>{m.totalInspections}</td>
                    <td>
                      <span style={{
                        fontFamily: 'Cinzel, serif', fontWeight: 700,
                        color: m.latestScore >= 80 ? 'var(--green-light)' :
                          m.latestScore >= 60 ? '#E8C040' : 'var(--rust-light)',
                      }}>
                        {m.latestScore}
                      </span>
                    </td>
                    <td><StatusBadge status={m.latestStatus} /></td>
                    <td><TrendIcon trend={m.trend} /></td>
                    <td style={{ color: 'var(--text-muted)' }}>{m.latestInspection}</td>
                    <td>
                      <Link href={`/monuments/${encodeURIComponent(m.name)}`}>
                        <button className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                          id={`btn-view-monument-${m.name.replace(/\s+/g, '-')}`}>
                          View →
                        </button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Layout>
    </>
  );
}
