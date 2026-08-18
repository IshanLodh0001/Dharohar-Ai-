import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { getAllInspections } from '../../lib/storage';

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    'GOOD': 'badge-good', 'MODERATE': 'badge-moderate',
    'NEEDS ATTENTION': 'badge-attention', 'CRITICAL': 'badge-critical',
  };
  return <span className={`badge ${map[status] || 'badge-moderate'}`}>{status}</span>;
}

export default function InspectionsPage() {
  const [inspections, setInspections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const data = getAllInspections();
      setInspections(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <>
      <Head>
        <title>Inspection History — DharoharAI</title>
        <meta name="description" content="View all heritage monument inspection records and AI analysis history." />
      </Head>
      <Layout title="Inspection History" subtitle="All recorded AI inspection reports">
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
          <Link href="/inspect">
            <button className="btn btn-primary" id="btn-new-inspection-history">+ New Inspection</button>
          </Link>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <div className="spinner" style={{ width: 40, height: 40 }} />
          </div>
        ) : inspections.length === 0 ? (
          <div className="empty-state card">
            <div className="icon">📋</div>
            <h3>No Inspections Yet</h3>
            <p>Start your first AI inspection to see records here.</p>
            <Link href="/inspect" style={{ marginTop: 16, display: 'inline-block' }}>
              <button className="btn btn-primary">Start Inspection</button>
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
                  <th>Detections</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {inspections.map((insp) => {
                  const r = insp.results;
                  const detected = [r.crack, r.corrosion, r.discoloration, r.buildingDamage, r.spalling, r.vegetation]
                    .filter(m => m?.detected).map(m => m.model).join(', ');
                  return (
                    <tr key={insp.id}>
                      <td style={{ fontWeight: 600 }}>{insp.monumentName}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{insp.location || '—'}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{insp.inspectionDate}</td>
                      <td>{insp.inspectorName || '—'}</td>
                      <td>
                        <span style={{
                          fontFamily: 'Cinzel, serif',
                          color: r.overallScore >= 80 ? 'var(--green-light)' :
                            r.overallScore >= 60 ? '#E8C040' : 'var(--rust-light)',
                          fontWeight: 700,
                        }}>
                          {r.overallScore}
                        </span>
                      </td>
                      <td><StatusBadge status={r.overallStatus} /></td>
                      <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)', maxWidth: 200 }}>
                        {detected || 'None'}
                      </td>
                      <td>
                        <Link href={`/inspections/${insp.id}`}>
                          <button className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                            id={`btn-view-insp-${insp.id}`}>
                            View →
                          </button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Layout>
    </>
  );
}
