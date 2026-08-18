/**
 * LocalStorage based storage for inspections.
 * Replaces the server-side JSON file approach for GitHub Pages compatibility.
 */

import { AllModelResults } from './roboflow';

const STORAGE_KEY = 'dharohar_inspections_data';

export interface InspectionRecord {
  id: string;
  monumentName: string;
  location: string;
  inspectionDate: string;
  inspectorName: string;
  notes: string;
  imagePath: string; // Will just be empty string or local object URL in client-only mode
  imageWidth?: number;
  imageHeight?: number;
  results: AllModelResults;
  createdAt: string;
}

function readAll(): InspectionRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as InspectionRecord[];
  } catch {
    return [];
  }
}

function writeAll(records: InspectionRecord[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (err) {
    console.error('Failed to save to localStorage', err);
  }
}

export function saveInspection(record: InspectionRecord): void {
  const all = readAll();
  all.unshift(record); // newest first
  writeAll(all);
}

export function getAllInspections(): InspectionRecord[] {
  return readAll();
}

export function getInspectionById(id: string): InspectionRecord | null {
  return readAll().find((r) => r.id === id) ?? null;
}

export function getInspectionsByMonument(monumentName: string): InspectionRecord[] {
  return readAll().filter(
    (r) => r.monumentName.toLowerCase() === monumentName.toLowerCase()
  );
}

export interface MonumentSummary {
  name: string;
  location: string;
  latestScore: number;
  latestStatus: string;
  totalInspections: number;
  latestInspection: string;
  trend: 'Stable' | 'Improving' | 'Deteriorating' | 'Insufficient Data';
}

export function getAllMonuments(): MonumentSummary[] {
  const all = readAll();
  const byName = new Map<string, InspectionRecord[]>();

  for (const r of all) {
    const key = r.monumentName.toLowerCase();
    if (!byName.has(key)) byName.set(key, []);
    byName.get(key)!.push(r);
  }

  return Array.from(byName.values()).map((records) => {
    const sorted = [...records].sort(
      (a, b) => new Date(a.inspectionDate).getTime() - new Date(b.inspectionDate).getTime()
    );
    const latest = sorted[sorted.length - 1];

    let trend: MonumentSummary['trend'] = 'Insufficient Data';
    if (sorted.length >= 2) {
      const scores = sorted.map((r) => r.results.overallScore);
      const first = scores[0];
      const last = scores[scores.length - 1];
      const diff = last - first;
      if (Math.abs(diff) < 5) trend = 'Stable';
      else if (diff > 0) trend = 'Improving';
      else trend = 'Deteriorating';
    }

    return {
      name: latest.monumentName,
      location: latest.location,
      latestScore: latest.results.overallScore,
      latestStatus: latest.results.overallStatus,
      totalInspections: records.length,
      latestInspection: latest.inspectionDate,
      trend,
    };
  });
}

export function getDashboardStats() {
  const all = readAll();
  const monuments = getAllMonuments();

  const criticalCount = monuments.filter((m) => m.latestStatus === 'CRITICAL').length;
  const attentionCount = monuments.filter((m) => m.latestStatus === 'NEEDS ATTENTION').length;
  const avgScore =
    monuments.length > 0
      ? Math.round(monuments.reduce((s, m) => s + m.latestScore, 0) / monuments.length)
      : 0;

  return {
    totalMonuments: monuments.length,
    totalInspections: all.length,
    criticalMonuments: criticalCount,
    needsAttention: attentionCount,
    averageConditionScore: avgScore,
    recentInspections: all.slice(0, 5),
  };
}
