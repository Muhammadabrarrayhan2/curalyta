/**
 * Machine Learning / Clinical Scoring Module
 *
 * Implements evidence-based clinical heuristics:
 * - NEWS2 (National Early Warning Score 2) — validated early warning score
 * - Z-score anomaly detection on vital trends
 * - Linear regression trend detection
 * - Priority scoring combining NEWS2 + comorbidity + age
 * - Symptom pattern clustering from SOAP notes
 */

import type { VitalSign, Patient, Observation } from '@prisma/client';

export type News2Level = 'low' | 'medium' | 'high' | 'critical';

export interface News2Result {
  score: number;
  level: News2Level;
  breakdown: { label: string; points: number }[];
}

export interface AnomalyResult {
  metric: string;
  value: number;
  mean: number;
  zScore: number;
  direction: 'tinggi' | 'rendah';
}

export interface TrendResult {
  trend: 'stable' | 'rising' | 'falling';
  slope: number;
}

export interface PriorityResult {
  priority: number;
  news: News2Result;
}

export const ml = {
  /**
   * NEWS2 scoring — clinical thresholds from the Royal College of Physicians (2017).
   */
  computeNEWS2(v: Partial<VitalSign> | null | undefined): News2Result {
    if (!v) return { score: 0, level: 'low', breakdown: [] };

    let score = 0;
    const breakdown: { label: string; points: number }[] = [];

    if (v.respirationRate != null) {
      let s = 0;
      const rr = v.respirationRate;
      if (rr <= 8) s = 3;
      else if (rr <= 11) s = 1;
      else if (rr <= 20) s = 0;
      else if (rr <= 24) s = 2;
      else s = 3;
      score += s;
      if (s > 0) breakdown.push({ label: `Respirasi ${rr}/min`, points: s });
    }

    if (v.oxygenSaturation != null) {
      let s = 0;
      const spo2 = v.oxygenSaturation;
      if (spo2 <= 91) s = 3;
      else if (spo2 <= 93) s = 2;
      else if (spo2 <= 95) s = 1;
      else s = 0;
      score += s;
      if (s > 0) breakdown.push({ label: `SpO₂ ${spo2}%`, points: s });
    }

    if (v.systolicBP != null) {
      let s = 0;
      const sbp = v.systolicBP;
      if (sbp <= 90) s = 3;
      else if (sbp <= 100) s = 2;
      else if (sbp <= 110) s = 1;
      else if (sbp <= 219) s = 0;
      else s = 3;
      score += s;
      if (s > 0) breakdown.push({ label: `Tekanan ${sbp} mmHg`, points: s });
    }

    if (v.heartRate != null) {
      let s = 0;
      const hr = v.heartRate;
      if (hr <= 40) s = 3;
      else if (hr <= 50) s = 1;
      else if (hr <= 90) s = 0;
      else if (hr <= 110) s = 1;
      else if (hr <= 130) s = 2;
      else s = 3;
      score += s;
      if (s > 0) breakdown.push({ label: `Nadi ${hr}/min`, points: s });
    }

    if (v.temperature != null) {
      let s = 0;
      const t = v.temperature;
      if (t <= 35) s = 3;
      else if (t <= 36) s = 1;
      else if (t <= 38) s = 0;
      else if (t <= 39) s = 1;
      else s = 2;
      score += s;
      if (s > 0) breakdown.push({ label: `Suhu ${t}°C`, points: s });
    }

    if (v.consciousness && v.consciousness !== 'ALERT') {
      score += 3;
      breakdown.push({ label: `Kesadaran: ${v.consciousness}`, points: 3 });
    }

    let level: News2Level = 'low';
    if (score >= 7) level = 'critical';
    else if (score >= 5) level = 'high';
    else if (score >= 3) level = 'medium';

    return { score, level, breakdown };
  },

  /**
   * Priority = NEWS2 (weighted) + comorbidity + age risk.
   * Returns 0–100.
   */
  computePriority(
    patient: Pick<Patient, 'dateOfBirth' | 'chronicConditions'> | null,
    latestVitals: Partial<VitalSign> | null | undefined
  ): PriorityResult {
    const news = this.computeNEWS2(latestVitals);
    let score = news.score * 10;

    if (patient?.chronicConditions) {
      const c = patient.chronicConditions.toLowerCase();
      const conditions = [
        'diabetes',
        'hipertensi',
        'jantung',
        'ginjal',
        'copd',
        'asma',
        'stroke',
        'kanker',
      ];
      score += conditions.filter((x) => c.includes(x)).length * 4;
    }

    if (patient?.dateOfBirth) {
      const age = Math.floor(
        (Date.now() - patient.dateOfBirth.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
      );
      if (age >= 65) score += 8;
      else if (age >= 50) score += 4;
      else if (age <= 2) score += 6;
    }

    return { priority: Math.min(100, Math.round(score)), news };
  },

  /**
   * Anomaly detection using z-score on rolling window.
   * Flags metrics where |z| >= 2 (approx 95th percentile).
   */
  detectAnomalies(history: Partial<VitalSign>[]): AnomalyResult[] {
    if (!history || history.length < 4) return [];

    const metrics: (keyof VitalSign)[] = [
      'heartRate',
      'systolicBP',
      'temperature',
      'oxygenSaturation',
      'respirationRate',
    ];
    const out: AnomalyResult[] = [];

    for (const m of metrics) {
      const values = history
        .map((v) => v[m])
        .filter((v): v is number => typeof v === 'number' && !isNaN(v));

      if (values.length < 4) continue;

      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const variance =
        values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
      const std = Math.sqrt(variance);
      if (std === 0) continue;

      const latest = values[values.length - 1];
      const z = (latest - mean) / std;

      if (Math.abs(z) >= 2) {
        out.push({
          metric: m as string,
          value: latest,
          mean: Math.round(mean * 10) / 10,
          zScore: Math.round(z * 100) / 100,
          direction: z > 0 ? 'tinggi' : 'rendah',
        });
      }
    }

    return out;
  },

  /**
   * Linear regression slope to classify trend direction.
   */
  computeTrend(history: Partial<VitalSign>[], metric: keyof VitalSign): TrendResult {
    const points = history
      .map((v) => ({
        t: v.date ? new Date(v.date).getTime() : 0,
        y: typeof v[metric] === 'number' ? (v[metric] as number) : null,
      }))
      .filter((p): p is { t: number; y: number } => p.y !== null && p.t > 0)
      .sort((a, b) => a.t - b.t);

    if (points.length < 3) return { trend: 'stable', slope: 0 };

    const t0 = points[0].t;
    const xs = points.map((p) => (p.t - t0) / (1000 * 60 * 60 * 24));
    const ys = points.map((p) => p.y);

    const n = xs.length;
    const xMean = xs.reduce((a, b) => a + b, 0) / n;
    const yMean = ys.reduce((a, b) => a + b, 0) / n;

    let num = 0;
    let den = 0;
    for (let i = 0; i < n; i++) {
      num += (xs[i] - xMean) * (ys[i] - yMean);
      den += Math.pow(xs[i] - xMean, 2);
    }

    const slope = den === 0 ? 0 : num / den;
    const relativeSlope = Math.abs(slope / (yMean || 1));

    let trend: TrendResult['trend'] = 'stable';
    if (relativeSlope > 0.015) trend = slope > 0 ? 'rising' : 'falling';

    return { trend, slope: Math.round(slope * 1000) / 1000 };
  },

  /**
   * Symptom keyword clustering — counts medical term frequency across observations.
   */
  analyzeSymptoms(observations: Pick<Observation, 'subjective' | 'objective' | 'assessment'>[]): {
    category: string;
    mentions: number;
  }[] {
    const text = observations
      .map((o) =>
        [o.subjective, o.objective, o.assessment].filter(Boolean).join(' ')
      )
      .join(' ')
      .toLowerCase();

    if (!text.trim()) return [];

    const buckets: Record<string, string[]> = {
      Kardiovaskular: ['nyeri dada', 'jantung', 'palpitasi', 'berdebar', 'sesak'],
      Respirasi: ['batuk', 'sesak napas', 'dahak', 'pilek', 'flu'],
      Gastrointestinal: ['mual', 'muntah', 'diare', 'kembung', 'lambung', 'maag'],
      Muskuloskeletal: ['nyeri sendi', 'nyeri otot', 'punggung', 'kaku', 'pegal'],
      Neurologis: ['sakit kepala', 'pusing', 'vertigo', 'migrain', 'kebas', 'kesemutan'],
      Metabolik: ['lelah', 'berat badan turun', 'haus', 'gula darah'],
      Demam: ['demam', 'menggigil', 'berkeringat'],
    };

    const counts: Record<string, number> = {};
    for (const [category, keywords] of Object.entries(buckets)) {
      const c = keywords.reduce(
        (acc, kw) => acc + (text.split(kw).length - 1),
        0
      );
      if (c > 0) counts[category] = c;
    }

    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .map(([category, mentions]) => ({ category, mentions }));
  },
};
