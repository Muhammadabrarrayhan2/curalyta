/**
 * AI Service — Anthropic Claude integration
 *
 * GRACEFUL FALLBACK: If ANTHROPIC_API_KEY is not configured, the service
 * reports as disabled and throws a user-friendly error. The rest of the
 * platform continues to function fully without AI.
 */

import Anthropic from '@anthropic-ai/sdk';
import { config } from '../../config';
import { ServiceUnavailableError } from '../../lib/errors';
import { logger } from '../../lib/logger';
import type { Patient, Observation, VitalSign } from '@prisma/client';

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!config.ai.enabled) {
    throw new ServiceUnavailableError(
      'AI Assistant belum dikonfigurasi. Hubungi administrator untuk mengaktifkan.'
    );
  }
  if (!client) {
    client = new Anthropic({ apiKey: config.ai.apiKey });
  }
  return client;
}

const SYSTEM_PROMPT_CLINICAL = `Anda adalah asisten klinis untuk dokter yang menggunakan Curalyta, sebuah platform kesehatan digital.

Peran Anda:
- Membantu dokter memahami kondisi pasien melalui ringkasan, insight, dan analisis pola
- Menyiapkan ringkasan SOAP dan temuan klinis yang terstruktur
- Mengidentifikasi pola dari riwayat pasien lintas kunjungan
- Memberikan pertimbangan klinis non-diagnostik (decision support)

Aturan penting:
1. Anda TIDAK membuat diagnosis final — keputusan diagnostik dan terapeutik adalah wewenang dokter
2. Gunakan bahasa klinis yang tepat namun mudah dibaca
3. Strukturkan jawaban dengan jelas (gunakan heading atau bullet points bila perlu)
4. Selalu tampilkan ketidakpastian ketika data tidak cukup
5. Jawab dalam bahasa Indonesia kecuali diminta sebaliknya
6. Jika pertanyaan di luar konteks klinis, jawab dengan ringkas dan arahkan kembali

Ingatkan pengguna pada akhir jawaban yang kritis bahwa rekomendasi ini bersifat support, bukan pengganti penilaian klinis.`;

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const aiService = {
  isEnabled(): boolean {
    return config.ai.enabled;
  },

  /**
   * Generic chat completion.
   */
  async chat(
    messages: ChatMessage[],
    opts: { systemPrompt?: string; maxTokens?: number } = {}
  ): Promise<string> {
    const c = getClient();

    try {
      const response = await c.messages.create({
        model: config.ai.model,
        max_tokens: opts.maxTokens ?? 1500,
        system: opts.systemPrompt ?? SYSTEM_PROMPT_CLINICAL,
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      });

      const text = response.content
        .filter((b): b is Anthropic.TextBlock => b.type === 'text')
        .map((b) => b.text)
        .join('\n')
        .trim();

      return text || 'Maaf, tidak ada respons yang dihasilkan. Coba pertanyaan lain.';
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      logger.error('AI service error', { message });

      if (
        message.toLowerCase().includes('api key') ||
        message.toLowerCase().includes('authentication')
      ) {
        throw new ServiceUnavailableError(
          'Konfigurasi AI bermasalah. Hubungi administrator.'
        );
      }
      if (message.toLowerCase().includes('rate')) {
        throw new ServiceUnavailableError(
          'AI sedang sibuk, coba lagi beberapa saat.'
        );
      }

      throw new ServiceUnavailableError(
        'AI tidak dapat merespons saat ini. Silakan coba lagi.'
      );
    }
  },

  /**
   * Builds a structured clinical context string for a specific patient.
   */
  buildPatientContext(
    patient: Patient,
    observations: Observation[],
    vitals: VitalSign[]
  ): string {
    const lines: string[] = [];

    lines.push(`PASIEN: ${patient.name}`);
    const age = Math.floor(
      (Date.now() - patient.dateOfBirth.getTime()) /
        (365.25 * 24 * 60 * 60 * 1000)
    );
    lines.push(`Usia: ${age} tahun`);
    lines.push(
      `Jenis kelamin: ${
        patient.gender === 'MALE' ? 'Laki-laki' : patient.gender === 'FEMALE' ? 'Perempuan' : 'Lainnya'
      }`
    );
    if (patient.bloodType) lines.push(`Golongan darah: ${patient.bloodType}`);
    if (patient.allergies) lines.push(`Alergi: ${patient.allergies}`);
    if (patient.chronicConditions)
      lines.push(`Kondisi kronis: ${patient.chronicConditions}`);

    if (vitals.length) {
      lines.push(`\nVITAL SIGNS TERBARU (${vitals.length} catatan):`);
      vitals.slice(0, 5).forEach((v) => {
        const parts: string[] = [];
        if (v.heartRate) parts.push(`HR ${v.heartRate}/min`);
        if (v.systolicBP)
          parts.push(`TD ${v.systolicBP}/${v.diastolicBP ?? '—'} mmHg`);
        if (v.temperature) parts.push(`Suhu ${v.temperature}°C`);
        if (v.oxygenSaturation) parts.push(`SpO₂ ${v.oxygenSaturation}%`);
        if (v.respirationRate) parts.push(`RR ${v.respirationRate}/min`);
        lines.push(
          `  · ${v.date.toISOString().split('T')[0]}: ${parts.join(', ') || '—'}`
        );
      });
    }

    if (observations.length) {
      lines.push(`\nOBSERVASI/SOAP NOTES (${observations.length} catatan terbaru):`);
      observations.slice(0, 5).forEach((o) => {
        lines.push(`  · ${o.date.toISOString().split('T')[0]}:`);
        if (o.subjective) lines.push(`     S: ${o.subjective}`);
        if (o.objective) lines.push(`     O: ${o.objective}`);
        if (o.assessment) lines.push(`     A: ${o.assessment}`);
        if (o.plan) lines.push(`     P: ${o.plan}`);
      });
    }

    return lines.join('\n');
  },

  async summarizePatient(
    patient: Patient,
    observations: Observation[],
    vitals: VitalSign[],
    anomalies: { metric: string; value: number; direction: string; zScore: number }[]
  ): Promise<string> {
    const context = this.buildPatientContext(patient, observations, vitals);
    const anomalyText = anomalies.length
      ? `\n\nANOMALI TERDETEKSI (z-score ≥ 2):\n${anomalies
          .map((a) => `· ${a.metric}: nilai ${a.direction} (z=${a.zScore})`)
          .join('\n')}`
      : '';

    const prompt = `Berdasarkan data pasien berikut, berikan ringkasan klinis terstruktur.

Format yang diinginkan:
**Ringkasan Kondisi** (2-3 kalimat gambaran umum)
**Temuan Signifikan** (bullet points)
**Pola yang Teridentifikasi** (jika ada)
**Pertimbangan Klinis** (non-diagnostik, untuk direview dokter)

Data pasien:
${context}${anomalyText}`;

    return this.chat([{ role: 'user', content: prompt }]);
  },
};
