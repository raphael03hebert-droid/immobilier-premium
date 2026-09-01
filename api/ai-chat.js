const rateWindow = new Map();
const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 20;

function bodyOf(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  try { return JSON.parse(req.body || '{}'); } catch { return {}; }
}

function cleanMessages(value) {
  if (!Array.isArray(value)) return [];
  return value
    .filter(item => item && (item.role === 'user' || item.role === 'assistant'))
    .slice(-24)
    .map(item => ({ role: item.role, content: String(item.content || '').trim().slice(0, 6000) }))
    .filter(item => item.content);
}

function clientKey(req) {
  return String(req.headers?.['x-forwarded-for'] || req.headers?.['x-real-ip'] || 'anonymous').split(',')[0].trim();
}

function outputText(response) {
  if (typeof response?.output_text === 'string' && response.output_text.trim()) return response.output_text.trim();
  return (response?.output || [])
    .flatMap(item => item?.content || [])
    .filter(item => item?.type === 'output_text' && item.text)
    .map(item => item.text)
    .join('\n')
    .trim();
}

const assistantInstructions = 'Tu es l’assistant professionnel de Geneviève Côté, courtière immobilière au Québec. Réponds en français, avec un ton clair, chaleureux et précis. Aide à organiser les suivis, préparer des courriels, résumer des dossiers et structurer des actions immobilières. Ne prétends jamais avoir consulté une donnée du CRM ou envoyé un courriel si elle ne t’a pas été fournie. Pour toute décision juridique, financière ou réglementaire, recommande une vérification professionnelle. Réponds directement et propose une prochaine action concrète quand c’est pertinent.';

function geminiText(response) {
  return (response?.candidates?.[0]?.content?.parts || [])
    .map(part => part?.text || '')
    .join('\n')
    .trim();
}

module.exports = async function aiChat(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Méthode non autorisée.' });
  }
  if (!process.env.GEMINI_API_KEY && !process.env.OPENAI_API_KEY) return res.status(503).json({ ok: false, error: 'Assistant IA non configuré sur le serveur.' });

  const now = Date.now();
  const key = clientKey(req);
  const recent = (rateWindow.get(key) || []).filter(time => now - time < WINDOW_MS);
  if (recent.length >= MAX_REQUESTS) return res.status(429).json({ ok: false, error: 'Trop de demandes. Réessayez dans une minute.' });
  recent.push(now); rateWindow.set(key, recent);

  const messages = cleanMessages(bodyOf(req).messages);
  if (!messages.length || messages[messages.length - 1].role !== 'user') return res.status(400).json({ ok: false, error: 'Ajoutez un message utilisateur.' });

  const transcript = messages.map(item => `${item.role === 'user' ? 'Utilisateur' : 'Assistant'} : ${item.content}`).join('\n\n');
  try {
    if (process.env.GEMINI_API_KEY) {
      const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: assistantInstructions }] },
          contents: messages.map(item => ({ role: item.role === 'assistant' ? 'model' : 'user', parts: [{ text: item.content }] })),
          generationConfig: { maxOutputTokens: 900, temperature: 0.7 }
        })
      });
      const data = await response.json();
      if (!response.ok) {
        const detail = data?.error?.message || 'La réponse Gemini a échoué.';
        return res.status(response.status >= 500 ? 502 : response.status).json({ ok: false, error: detail });
      }
      const reply = geminiText(data);
      if (!reply) return res.status(502).json({ ok: false, error: 'La réponse de l’assistant est vide.' });
      return res.status(200).json({ ok: true, reply });
    }

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-5.4',
        store: false,
        instructions: assistantInstructions,
        input: `Conversation à poursuivre :\n\n${transcript}`,
        text: { verbosity: 'medium' },
        max_output_tokens: 900
      })
    });
    const data = await response.json();
    if (!response.ok) {
      const detail = data?.error?.message || 'La réponse OpenAI a échoué.';
      return res.status(response.status >= 500 ? 502 : response.status).json({ ok: false, error: detail });
    }
    const reply = outputText(data);
    if (!reply) return res.status(502).json({ ok: false, error: 'La réponse de l’assistant est vide.' });
    return res.status(200).json({ ok: true, reply });
  } catch (error) {
    return res.status(502).json({ ok: false, error: error?.message || 'Impossible de joindre OpenAI.' });
  }
};
