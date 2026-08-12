import { Handler } from '@netlify/functions';

export const handler: Handler = async (event) => {
  // 1. Enforce POST method
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  // 2. Read private GEMINI_API_KEY strictly from Netlify server environment
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'GEMINI_API_KEY não está configurada nas variáveis de ambiente do Netlify.' }),
    };
  }

  try {
    const payload = JSON.parse(event.body || '{}');
    const { action, text, mimeType, base64Audio, prompt } = payload;

    // A) GERAÇÃO DE EMBEDDING (text-embedding-004)
    if (action === 'EMBEDDING') {
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

      const data = await response.json();
      return {
        statusCode: response.status,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      };
    }

    // B) TRANSCRIÇÃO DE ÁUDIO MULTIMODAL (gemini-1.5-flash)
    if (action === 'AUDIO_TRANSCRIPTION') {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { inlineData: { mimeType: mimeType || 'audio/webm', data: base64Audio } },
                  { text: prompt },
                ],
              },
            ],
            generationConfig: { responseMimeType: 'application/json' },
          }),
        }
      );

      const data = await response.json();
      return {
        statusCode: response.status,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      };
    }

    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Ação não suportada. Use EMBEDDING ou AUDIO_TRANSCRIPTION.' }),
    };
  } catch (err: any) {
    console.error('[Netlify Gemini Function Error]:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message || 'Erro interno na função Netlify Gemini.' }),
    };
  }
};
