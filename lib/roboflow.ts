/**
 * Roboflow API integration — SERVER SIDE ONLY
 * The ROBOFLOW_API_KEY is never exposed to the client.
 *
 * Endpoint rules:
 *  - Workflows  → POST https://detect.roboflow.com/infer/workflows/{workspace}/{workflow_id}
 *                  Body JSON: { api_key, inputs: { image, classes }, use_cache }
 *  - Inference  → POST https://detect.roboflow.com/{model_id}?api_key=...
 *                  Body: raw base64 string, Content-Type: application/x-www-form-urlencoded
 */

const API_KEY = process.env.NEXT_PUBLIC_ROBOFLOW_API_KEY!;
const WORKFLOW_BASE = 'https://detect.roboflow.com';
const INFER_BASE    = 'https://detect.roboflow.com';

export interface RoboflowPrediction {
  class: string;
  confidence: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  points?: Array<{ x: number; y: number }>;
  detection_id?: string;
}

export interface ModelResult {
  model: string;
  status: 'success' | 'error';
  detected: boolean;
  predictions: RoboflowPrediction[];
  confidence?: number;
  severity: 'None' | 'Low' | 'Medium' | 'High';
  count: number;
  score: number; // 0–100, higher = healthier
  message?: string;
}

// ─── Response parsing helpers ──────────────────────────────────────────

function extractPredictions(data: any, targetClass?: string): RoboflowPrediction[] {
  let preds: RoboflowPrediction[] = [];

  // Format A: { outputs: [{ predictions: { predictions: [...] } }] }
  if (data?.outputs && Array.isArray(data.outputs)) {
    for (const out of data.outputs) {
      if (out?.predictions?.predictions && Array.isArray(out.predictions.predictions)) {
        preds = out.predictions.predictions;
        break;
      }
      if (out?.predictions && Array.isArray(out.predictions)) {
        preds = out.predictions;
        break;
      }
      // Walk all keys of the output object
      for (const key of Object.keys(out || {})) {
        if (out[key]?.predictions && Array.isArray(out[key].predictions)) {
          preds = out[key].predictions;
          break;
        }
      }
      if (preds.length) break;
    }
  }

  // Format B: { predictions: [...] }
  if (!preds.length && data?.predictions && Array.isArray(data.predictions)) {
    preds = data.predictions;
  }

  // Format C: direct array
  if (!preds.length && Array.isArray(data)) {
    preds = data;
  }

  // Filter by target class (case-insensitive)
  if (targetClass && preds.length) {
    const lower = targetClass.toLowerCase();
    const filtered = preds.filter((p) => (p.class ?? '').toLowerCase() === lower);
    return filtered.length > 0 ? filtered : preds;
  }

  return preds;
}

function calcSeverity(count: number, avgConf: number): 'None' | 'Low' | 'Medium' | 'High' {
  if (count === 0) return 'None';
  if (count <= 2 && avgConf < 0.55) return 'Low';
  if (count <= 5 && avgConf < 0.75) return 'Medium';
  return 'High';
}

function calcScore(count: number, avgConf: number): number {
  if (count === 0) return 100;
  const countPenalty = Math.min(count * 8, 50);
  const confPenalty  = Math.round(avgConf * 30);
  return Math.max(0, 100 - countPenalty - confPenalty);
}

function buildResult(model: string, predictions: RoboflowPrediction[]): ModelResult {
  const count = predictions.length;
  const avgConf = count > 0
    ? predictions.reduce((s, p) => s + (p.confidence ?? 0), 0) / count
    : 0;
  return {
    model,
    status: 'success',
    detected: count > 0,
    predictions,
    confidence: count > 0 ? Math.round(avgConf * 1000) / 10 : undefined,
    severity: calcSeverity(count, avgConf),
    count,
    score: calcScore(count, avgConf),
  };
}

// ─── Workflow API (serverless.roboflow.com) ────────────────────────────

async function runWorkflow(
  workspace: string,
  workflowId: string,
  base64Image: string,
  classes: string
): Promise<RoboflowPrediction[]> {
  // Matches the Roboflow inference-sdk: POST {api_url}/infer/workflows/{workspace}/{workflow_id}
  // api_key goes in the JSON body along with inputs
  const url = `${WORKFLOW_BASE}/infer/workflows/${workspace}/${workflowId}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: API_KEY,
      inputs: {
        image: { type: 'base64', value: base64Image },
        classes,
      },
      use_cache: true,
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Workflow ${workflowId} HTTP ${response.status}: ${text.slice(0, 300)}`);
  }

  const data = await response.json();
  return extractPredictions(data, classes);
}

// ─── Inference API (detect.roboflow.com) ──────────────────────────────
// The hosted detection endpoint expects the raw base64 string as the request body
// with Content-Type: application/x-www-form-urlencoded.

async function runInference(modelId: string, base64Image: string): Promise<RoboflowPrediction[]> {
  const url = `${INFER_BASE}/${modelId}?api_key=${API_KEY}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: base64Image, // raw base64 string — NOT JSON
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Inference ${modelId} HTTP ${response.status}: ${text.slice(0, 300)}`);
  }

  const data = await response.json();
  return extractPredictions(data);
}

// ─── Six Model Runners ─────────────────────────────────────────────────

async function runCrack(base64Image: string): Promise<ModelResult> {
  try {
    const preds = await runWorkflow(
      'ishan-lodh-s-workspace', 'general-segmentation-api-14', base64Image, 'Crack'
    );
    return buildResult('Crack', preds);
  } catch (err: any) {
    return { model: 'Crack', status: 'error', detected: false, predictions: [], severity: 'None', count: 0, score: 100, message: err.message };
  }
}

async function runCorrosion(base64Image: string): Promise<ModelResult> {
  try {
    const preds = await runWorkflow(
      'ishan-lodh-s-workspace', 'general-segmentation-api-13', base64Image, 'Corrosion'
    );
    return buildResult('Corrosion', preds);
  } catch (err: any) {
    return { model: 'Corrosion', status: 'error', detected: false, predictions: [], severity: 'None', count: 0, score: 100, message: err.message };
  }
}

async function runDiscoloration(base64Image: string): Promise<ModelResult> {
  try {
    const preds = await runWorkflow(
      'ishan-lodh-s-workspace', 'general-segmentation-api-15', base64Image, 'Discoloration'
    );
    return buildResult('Discoloration', preds);
  } catch (err: any) {
    return { model: 'Discoloration', status: 'error', detected: false, predictions: [], severity: 'None', count: 0, score: 100, message: err.message };
  }
}

async function runBuildingDamage(base64Image: string): Promise<{ buildingDamage: ModelResult; spalling: ModelResult }> {
  try {
    const preds = await runInference('building-damage-detection-ahwco/2', base64Image);

    // Spalling is only reported if the class actually appears in the response
    const spallingPreds = preds.filter((p) => (p.class ?? '').toLowerCase() === 'spalling');
    const damagePreds   = preds.filter((p) => (p.class ?? '').toLowerCase() !== 'spalling');

    return {
      buildingDamage: buildResult('Building Damage', damagePreds),
      spalling:       buildResult('Spalling', spallingPreds),
    };
  } catch (err: any) {
    const errResult = (model: string): ModelResult => ({
      model, status: 'error', detected: false, predictions: [],
      severity: 'None', count: 0, score: 100, message: err.message,
    });
    return { buildingDamage: errResult('Building Damage'), spalling: errResult('Spalling') };
  }
}

async function runVegetation(base64Image: string): Promise<ModelResult> {
  try {
    const preds = await runWorkflow(
      'ishan-lodh-s-workspace', 'general-segmentation-api-18', base64Image, 'vegetation'
    );
    return buildResult('Vegetation Growth', preds);
  } catch (err: any) {
    return { model: 'Vegetation Growth', status: 'error', detected: false, predictions: [], severity: 'None', count: 0, score: 100, message: err.message };
  }
}

// ─── Main entry ────────────────────────────────────────────────────────

export interface AllModelResults {
  crack:        ModelResult;
  corrosion:    ModelResult;
  discoloration:ModelResult;
  buildingDamage:ModelResult;
  spalling:     ModelResult;
  vegetation:   ModelResult;
  overallScore:  number;
  overallStatus: 'GOOD' | 'MODERATE' | 'NEEDS ATTENTION' | 'CRITICAL';
  recommendations: string[];
}

export async function analyzeImage(base64Image: string): Promise<AllModelResults> {
  // Run all models in parallel (building damage covers spalling too)
  const [crack, corrosion, discoloration, buildingResults, vegetation] = await Promise.all([
    runCrack(base64Image),
    runCorrosion(base64Image),
    runDiscoloration(base64Image),
    runBuildingDamage(base64Image),
    runVegetation(base64Image),
  ]);

  const { buildingDamage, spalling } = buildingResults;
  const all = [crack, corrosion, discoloration, buildingDamage, spalling, vegetation];

  const successScores = all.filter(r => r.status === 'success').map(r => r.score);
  const overallScore  = successScores.length > 0
    ? Math.round(successScores.reduce((a, b) => a + b, 0) / successScores.length)
    : 0;

  const overallStatus =
    overallScore >= 80 ? 'GOOD' :
    overallScore >= 60 ? 'MODERATE' :
    overallScore >= 40 ? 'NEEDS ATTENTION' : 'CRITICAL';

  // Recommendations from actual detections only
  const recommendations: string[] = [];
  if (crack.detected)         recommendations.push('Crack detected — recommend professional structural inspection and crack sealing.');
  if (corrosion.detected)     recommendations.push('Corrosion detected — inspect affected metal components and perform corrosion treatment.');
  if (discoloration.detected) recommendations.push('Discoloration detected — investigate possible moisture or water intrusion.');
  if (buildingDamage.detected)recommendations.push('Building damage detected — recommend detailed structural assessment by a conservation engineer.');
  if (spalling.detected)      recommendations.push('Spalling detected — recommend professional inspection and repair of damaged surface material.');
  if (vegetation.detected)    recommendations.push('Vegetation growth detected — remove vegetation immediately and monitor root growth to prevent structural damage.');
  if (recommendations.length === 0)
    recommendations.push('No significant deterioration detected. Continue routine monitoring and preventive maintenance.');

  return { crack, corrosion, discoloration, buildingDamage, spalling, vegetation, overallScore, overallStatus, recommendations };
}
