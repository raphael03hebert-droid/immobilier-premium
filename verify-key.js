const crypto = require('node:crypto');

function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  try { return JSON.parse(req.body || '{}'); } catch { return {}; }
}

module.exports = function verifyKey(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Méthode non autorisée.' });
  }
  const supplied = String(readBody(req).key || '');
  const expected = String(process.env.CRM_ACCESS_KEY || '');
  if (!expected || !supplied || supplied.length > 256) return res.status(403).json({ ok: false, error: 'Clé invalide.' });
  const left = crypto.createHash('sha256').update(supplied, 'utf8').digest();
  const right = crypto.createHash('sha256').update(expected, 'utf8').digest();
  const valid = crypto.timingSafeEqual(left, right);
  return res.status(valid ? 200 : 403).json({ ok: valid, error: valid ? undefined : 'Clé invalide.' });
};
