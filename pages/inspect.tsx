import Head from 'next/head';
import Link from 'next/link';
import { useRef, useState, useCallback, useEffect } from 'react';
import Layout from '../components/Layout';

type StepStatus = 'pending' | 'running' | 'done' | 'error';

interface ProgressStep {
  id: string;
  label: string;
  status: StepStatus;
  detail?: string;
}

const MODEL_ICONS: Record<string, string> = {
  'Crack': '🔓',
  'Corrosion': '🦠',
  'Discoloration': '🎨',
  'Building Damage': '🏚',
  'Spalling': '🪨',
  'Vegetation Growth': '🌿',
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
          style={{ transition: 'stroke-dashoffset 1s ease', transform: 'rotate(-90deg)', transformOrigin: '65px 65px' }} />
      </svg>
      <div className="score-ring-text">
        <span className="score-number" style={{ fontSize: '2.2rem' }}>{score}</span>
        <span className="score-label">/ 100</span>
      </div>
    </div>
  );
}

function ResultCard({ result }: { result: any }) {
  const icon = MODEL_ICONS[result.model] || '📊';
  const cls = result.status === 'error' ? 'error-card' : result.detected ? 'detected' : 'not-detected';

  return (
    <div className={`result-card fade-in ${cls}`}>
      <div className="result-card-header">
        <div className="result-card-title">{icon} {result.model}</div>
        {result.status === 'error' ? (
          <span className="result-detection-badge" style={{ background: 'rgba(90,80,64,0.3)', color: 'var(--text-muted)' }}>Error</span>
        ) : (
          <span className={`result-detection-badge ${result.detected ? 'detected-true' : 'detected-false'}`}>
            {result.detected ? 'Detected' : 'Not Detected'}
          </span>
        )}
      </div>

      {result.status === 'error' ? (
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 8 }}>
          {result.message || 'Model unavailable'}
        </div>
      ) : (
        <>
          <div className="result-stat">
            <span className="result-stat-label">Detections</span>
            <span className="result-stat-value">{result.count}</span>
          </div>
          {result.confidence !== undefined && (
            <div className="result-stat">
              <span className="result-stat-label">Avg Confidence</span>
              <span className="result-stat-value">{result.confidence}%</span>
            </div>
          )}
          <div className="result-stat">
            <span className="result-stat-label">Severity</span>
            <span className="result-stat-value" style={{
              color: result.severity === 'High' ? 'var(--rust-light)' :
                result.severity === 'Medium' ? '#E8C040' :
                result.severity === 'Low' ? 'var(--gold)' : 'var(--green-light)'
            }}>{result.severity}</span>
          </div>
          <div className="result-stat">
            <span className="result-stat-label">Health Score</span>
            <span className="result-stat-value">{result.score}/100</span>
          </div>
        </>
      )}
    </div>
  );
}

function ImageWithOverlay({ imageSrc, results }: { imageSrc: string; results: any }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imgDims, setImgDims] = useState({ w: 0, h: 0 });

  useEffect(() => {
    if (!imageSrc || !results) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const img = new Image();
    img.onload = () => {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      setImgDims({ w: img.naturalWidth, h: img.naturalHeight });
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);

      // Overlay bounding boxes from all model results
      const colorMap: Record<string, string> = {
        'crack': '#E84040',
        'corrosion': '#E87040',
        'discoloration': '#E8C040',
        'building damage': '#E840A0',
        'spalling': '#A040E8',
        'vegetation growth': '#40E840',
      };

      const modelKeys = ['crack', 'corrosion', 'discoloration', 'buildingDamage', 'spalling', 'vegetation'];
      for (const key of modelKeys) {
        const modelResult = results[key];
        if (!modelResult?.predictions?.length) continue;

        const name = modelResult.model.toLowerCase();
        const color = colorMap[name] || '#C8A050';
        ctx.strokeStyle = color;
        ctx.lineWidth = Math.max(2, img.naturalWidth / 300);
        ctx.fillStyle = color + '33';
        ctx.font = `${Math.max(12, img.naturalWidth / 50)}px Inter`;

        for (const pred of modelResult.predictions) {
          if (pred.x !== undefined && pred.y !== undefined && pred.width && pred.height) {
            const x = pred.x - pred.width / 2;
            const y = pred.y - pred.height / 2;
            ctx.fillRect(x, y, pred.width, pred.height);
            ctx.strokeRect(x, y, pred.width, pred.height);

            // Label
            const label = `${pred.class || modelResult.model} ${pred.confidence ? Math.round(pred.confidence * 100) + '%' : ''}`;
            ctx.fillStyle = color;
            ctx.fillText(label, x, y > 20 ? y - 4 : y + pred.height + 14);
            ctx.fillStyle = color + '33';
          } else if (pred.points?.length) {
            // Segmentation polygon
            ctx.beginPath();
            ctx.moveTo(pred.points[0].x, pred.points[0].y);
            for (let i = 1; i < pred.points.length; i++) {
              ctx.lineTo(pred.points[i].x, pred.points[i].y);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
          }
        }
      }
    };
    img.src = imageSrc;
  }, [imageSrc, results]);

  return (
    <div className="image-analysis-wrap">
      <canvas ref={canvasRef} style={{ maxWidth: '100%', maxHeight: 500 }} />
    </div>
  );
}

const initialSteps = (): ProgressStep[] => [
  { id: 'upload',       label: 'Image Uploaded',           status: 'pending' },
  { id: 'crack',        label: 'Crack Analysis',            status: 'pending' },
  { id: 'corrosion',    label: 'Corrosion Analysis',        status: 'pending' },
  { id: 'discoloration',label: 'Discoloration Analysis',    status: 'pending' },
  { id: 'buildingDamage',label: 'Building Damage Analysis', status: 'pending' },
  { id: 'spalling',     label: 'Spalling Analysis',         status: 'pending' },
  { id: 'vegetation',   label: 'Vegetation Analysis',       status: 'pending' },
  { id: 'condition',    label: 'Overall Condition Calculated', status: 'pending' },
];

export default function InspectPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [dragging, setDragging] = useState(false);

  const [form, setForm] = useState({
    monument_name: '', location: '', inspection_date: new Date().toISOString().split('T')[0],
    inspector_name: '', notes: '',
  });

  const [analyzing, setAnalyzing] = useState(false);
  const [steps, setSteps] = useState<ProgressStep[]>(initialSteps());
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const setStep = useCallback((id: string, status: StepStatus, detail?: string) => {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, status, detail } : s));
  }, []);

  const handleFile = (f: File) => {
    setImageFile(f);
    setImagePreview(URL.createObjectURL(f));
    setResult(null);
    setError('');
    setSteps(initialSteps());
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith('image/')) handleFile(f);
  }, []);

  const handleAnalyze = async () => {
    if (!imageFile) return;
    setAnalyzing(true);
    setResult(null);
    setError('');
    setSteps(initialSteps());

    // Step 1 — upload
    setStep('upload', 'running');

    const fd = new FormData();
    fd.append('image', imageFile);
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));

    // Mark all model steps as running
    const modelSteps = ['crack', 'corrosion', 'discoloration', 'buildingDamage', 'spalling', 'vegetation'];

    try {
      setStep('upload', 'done');
      modelSteps.forEach(id => setStep(id, 'running'));

      const resp = await fetch('/api/inspect', { method: 'POST', body: fd });
      const data = await resp.json();

      if (!resp.ok) throw new Error(data.error || 'Analysis failed');

      // Mark model steps done/error based on real results
      const r = data.results;
      const stepMap: Record<string, string> = {
        'crack': 'crack', 'corrosion': 'corrosion',
        'discoloration': 'discoloration', 'buildingDamage': 'buildingDamage',
        'spalling': 'spalling', 'vegetation': 'vegetation',
      };

      for (const [key, stepId] of Object.entries(stepMap)) {
        const modelResult = r[key];
        if (modelResult?.status === 'error') {
          setStep(stepId, 'error', modelResult.message);
        } else {
          setStep(stepId, 'done', modelResult?.detected ? `${modelResult.count} detection(s)` : 'None detected');
        }
      }

      setStep('condition', 'done', `Score: ${r.overallScore} — ${r.overallStatus}`);
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Unknown error');
      modelSteps.forEach(id => setStep(id, 'error'));
      setStep('condition', 'error');
    } finally {
      setAnalyzing(false);
    }
  };

  const dotContent = (status: StepStatus) => {
    if (status === 'done') return '✓';
    if (status === 'error') return '✗';
    if (status === 'running') return '⋯';
    return '○';
  };

  return (
    <>
      <Head>
        <title>AI Inspection — DharoharAI</title>
        <meta name="description" content="Upload a monument image and get real AI-powered structural analysis using 6 Roboflow models." />
      </Head>
      <Layout title="AI Monument Inspection" subtitle="Upload an image to run real AI analysis across 6 detection models">
        <div className="grid-2" style={{ alignItems: 'start' }}>

          {/* ── Left: Upload + Form ── */}
          <div>
            <div className="card" style={{ marginBottom: 24 }}>
              <div className="card-title">📷 Monument Image</div>

              {imagePreview ? (
                <div>
                  <div className="upload-preview" style={{ marginBottom: 12 }}>
                    <img src={imagePreview} alt="Uploaded monument" />
                  </div>
                  <button
                    id="btn-change-image"
                    className="btn btn-secondary"
                    onClick={() => { setImageFile(null); setImagePreview(''); setResult(null); setSteps(initialSteps()); }}
                    style={{ width: '100%' }}
                  >
                    Change Image
                  </button>
                </div>
              ) : (
                <div
                  id="upload-zone"
                  className={`upload-zone${dragging ? ' drag-over' : ''}`}
                  onDragOver={e => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="upload-icon">🏛</div>
                  <h3>Drop monument image here</h3>
                  <p>or click to browse — JPG, PNG, WebP (max 15 MB)</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    id="file-input"
                    onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
                  />
                </div>
              )}
            </div>

            <div className="card">
              <div className="card-title">📝 Inspection Details</div>

              <div className="form-group">
                <label className="form-label" htmlFor="monument-name">Monument Name *</label>
                <input id="monument-name" className="form-input" type="text"
                  placeholder="e.g. Qutub Minar" value={form.monument_name}
                  onChange={e => setForm(f => ({ ...f, monument_name: e.target.value }))} />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="location">Location</label>
                <input id="location" className="form-input" type="text"
                  placeholder="e.g. New Delhi, India" value={form.location}
                  onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
              </div>

              <div className="grid-2" style={{ gap: 16 }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="inspection-date">Inspection Date</label>
                  <input id="inspection-date" className="form-input" type="date"
                    value={form.inspection_date}
                    onChange={e => setForm(f => ({ ...f, inspection_date: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="inspector-name">Inspector Name</label>
                  <input id="inspector-name" className="form-input" type="text"
                    placeholder="Your name" value={form.inspector_name}
                    onChange={e => setForm(f => ({ ...f, inspector_name: e.target.value }))} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="notes">Notes</label>
                <textarea id="notes" className="form-input"
                  placeholder="Any additional observations..." value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>

              <button
                id="btn-analyze"
                className="btn btn-primary btn-lg"
                style={{ width: '100%', justifyContent: 'center' }}
                disabled={!imageFile || analyzing}
                onClick={handleAnalyze}
              >
                {analyzing ? <><div className="spinner" />  Analyzing…</> : '🔍 Analyze Monument'}
              </button>
            </div>
          </div>

          {/* ── Right: Progress + Results ── */}
          <div>
            {/* Progress Steps */}
            <div className="card" style={{ marginBottom: 24 }}>
              <div className="card-title">⚡ Analysis Progress</div>
              <div className="progress-list">
                {steps.map(step => (
                  <div key={step.id} className={`progress-item ${step.status === 'done' ? 'done' : step.status === 'running' ? 'running' : step.status === 'error' ? 'error' : ''}`}>
                    <div className={`progress-dot ${step.status}`}>
                      {dotContent(step.status)}
                    </div>
                    <span className="progress-label">{step.label}</span>
                    {step.detail && (
                      <span className="progress-status">{step.detail}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="alert alert-error" style={{ marginBottom: 24 }}>
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Results */}
            {result && (
              <>
                {/* Overall Score */}
                <div className="card fade-in" style={{ marginBottom: 24, textAlign: 'center' }}>
                  <div className="card-title">Overall Condition</div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, marginTop: 8 }}>
                    <ScoreRing score={result.results.overallScore} />
                    <StatusBadge status={result.results.overallStatus} />
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Inspection ID: {result.inspectionId}
                    </div>
                    <Link href={`/inspections/${result.inspectionId}`}>
                      <button className="btn btn-secondary" id="btn-view-full-report">View Full Report →</button>
                    </Link>
                  </div>
                </div>

                {/* Image with Overlay */}
                {imagePreview && (
                  <div className="card fade-in" style={{ marginBottom: 24 }}>
                    <div className="card-title">🖼 Detection Overlay</div>
                    <div style={{ marginTop: 8 }}>
                      <ImageWithOverlay imageSrc={imagePreview} results={result.results} />
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 8 }}>
                        Bounding boxes and regions overlay real model predictions.
                      </p>
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {result.results.recommendations?.length > 0 && (
                  <div className="card fade-in" style={{ marginBottom: 24 }}>
                    <div className="card-title">💡 Recommendations</div>
                    <div className="recommendation-list" style={{ marginTop: 8 }}>
                      {result.results.recommendations.map((rec: string, i: number) => (
                        <div key={i} className="recommendation-item">
                          <span className="recommendation-icon">→</span>
                          {rec}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Model Results Grid (below) */}
        {result && (
          <>
            <div className="ornament">
              <span className="ornament-text">Model Results</span>
            </div>
            <div className="result-grid">
              {['crack', 'corrosion', 'discoloration', 'buildingDamage', 'spalling', 'vegetation'].map(key => (
                <ResultCard key={key} result={result.results[key]} />
              ))}
            </div>
          </>
        )}
      </Layout>
    </>
  );
}
