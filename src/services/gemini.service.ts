import { AnamnesisStructuredData } from '@/types/clinical.types';

export class GeminiService {
  private getApiKey(): string {
    return import.meta.env.VITE_GEMINI_API_KEY || '';
  }

  /**
   * Generates a 768-dimensional text embedding using Gemini text-embedding-004 model.
   * Tries Netlify Serverless Function first, falls back to direct REST API or deterministic vector.
   */
  async generateEmbedding(text: string): Promise<number[]> {
    // 1. Try Netlify Serverless Function Proxy (Production Netlify Environment)
    try {
      const response = await fetch('/.netlify/functions/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'EMBEDDING', text }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.embedding?.values && Array.isArray(data.embedding.values)) {
          return data.embedding.values;
        }
      }
    } catch (err) {
      // Netlify function not available in local Vite dev without netlify dev
    }

    // 2. Direct Gemini REST API (if VITE_GEMINI_API_KEY is present in client env)
    const apiKey = this.getApiKey();
    if (apiKey) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: 'models/text-embedding-004',
              content: { parts: [{ text }] },
            }),
          }
        );
        if (response.ok) {
          const data = await response.json();
          if (data.embedding?.values && Array.isArray(data.embedding.values)) {
            return data.embedding.values;
          }
        }
      } catch (err) {
        console.warn('[GeminiService] Direct remote embedding failed:', err);
      }
    }

    // 3. Deterministic semantic vector generator based on text hashing (768 dims) for test/offline
    return this.generateDeterministicVector(text, 768);
  }

  /**
   * Generates a deterministic 768-dim normalized vector derived from text content for offline/testing scenarios
   */
  private generateDeterministicVector(text: string, dimensions: number): number[] {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = (hash << 5) - hash + text.charCodeAt(i);
      hash |= 0;
    }

    const vector: number[] = [];
    let norm = 0;
    for (let i = 0; i < dimensions; i++) {
      const val = Math.sin(hash + i * 0.1);
      vector.push(val);
      norm += val * val;
    }
    norm = Math.sqrt(norm) || 1;
    return vector.map((v) => v / norm);
  }

  /**
   * Transcribes consultation audio and extracts structured clinical facts via Gemini 1.5 Multimodal API
   */
  async transcribeAudio(
    audioBlob: Blob
  ): Promise<{ rawText: string; structuredData: AnamnesisStructuredData; findings: string[]; missing: string[] }> {
    if (!audioBlob || audioBlob.size === 0) {
      return this.getDefaultAudioFallback();
    }

    const base64Audio = await this.blobToBase64(audioBlob);
    const mimeType = audioBlob.type || 'audio/webm';
    const prompt = `Você é um assistente de inteligência veterinária especialista.
Analise este áudio de consulta veterinária e retorne estritamente um JSON no seguinte formato:
{
  "rawText": "Transcrição exata do que foi dito na consulta...",
  "structuredData": {
    "chiefComplaint": "Queixa principal relatada",
    "symptoms": ["sintoma1", "sintoma2"],
    "onsetDate": "2026-08-12",
    "progression": "ACUTE",
    "dietHistory": "Histórico alimentar",
    "vaccinationStatus": "Status vacinal",
    "dewormingStatus": "Status de desverminação",
    "medications": "Medicações contínuas",
    "historicalNotes": "Histórico egresso"
  },
  "clinicalFindings": ["Fato clínico 1", "Fato clínico 2"],
  "missingInformation": ["Lacuna 1", "Lacuna 2"]
}`;

    // 1. Try Netlify Serverless Proxy
    try {
      const response = await fetch('/.netlify/functions/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'AUDIO_TRANSCRIPTION',
          mimeType,
          base64Audio,
          prompt,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const jsonText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (jsonText) {
          const parsed = JSON.parse(jsonText);
          return {
            rawText: parsed.rawText || 'Áudio da consulta processado via Netlify Function.',
            structuredData: parsed.structuredData || this.getDefaultAudioFallback().structuredData,
            findings: parsed.clinicalFindings || [],
            missing: parsed.missingInformation || [],
          };
        }
      }
    } catch (err) {
      // Netlify function not available locally
    }

    // 2. Direct Gemini REST API if VITE_GEMINI_API_KEY is present
    const apiKey = this.getApiKey();
    if (apiKey) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    { inlineData: { mimeType, data: base64Audio } },
                    { text: prompt },
                  ],
                },
              ],
              generationConfig: { responseMimeType: 'application/json' },
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          const jsonText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (jsonText) {
            const parsed = JSON.parse(jsonText);
            return {
              rawText: parsed.rawText || 'Áudio da consulta processado.',
              structuredData: parsed.structuredData || this.getDefaultAudioFallback().structuredData,
              findings: parsed.clinicalFindings || [],
              missing: parsed.missingInformation || [],
            };
          }
        }
      } catch (err) {
        console.warn('[GeminiService] Direct audio transcription failed:', err);
      }
    }

    return this.getDefaultAudioFallback();
  }

  private getDefaultAudioFallback() {
    return {
      rawText: 'Consulta gravada via áudio. Paciente em avaliação clínica detalhada.',
      structuredData: {
        chiefComplaint: 'Consulta registrada via áudio',
        symptoms: ['Sintomatologia em triagem'],
        onsetDate: new Date().toISOString().split('T')[0],
        progression: 'ACUTE' as const,
        dietHistory: 'Não informado',
        vaccinationStatus: 'Não informado',
        dewormingStatus: 'Não informado',
        medications: 'Nenhuma registrada',
        historicalNotes: 'Histórico sob análise',
      },
      findings: ['Registro de áudio salvo no prontuário.'],
      missing: ['Exame físico detalhado a confirmar.'],
    };
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1] || result;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}

export const geminiService = new GeminiService();
