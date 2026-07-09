const DEFAULT_TO_EMAIL = 'kota.nagahama1103@gmail.com';
const DEFAULT_FROM_EMAIL = '家庭防災設計 <onboarding@resend.dev>';

const ALLOWED_ORIGINS = new Set([
  'https://katei-bousai.jp',
  'https://www.katei-bousai.jp',
  'https://bousai-lp.vercel.app'
]);

function sendJson(res, statusCode, body) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (ALLOWED_ORIGINS.has(origin)) return true;
  try {
    const host = new URL(origin).hostname;
    return host === 'localhost' || host === '127.0.0.1' || host.endsWith('.vercel.app');
  } catch {
    return false;
  }
}

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeArray(value) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => normalizeText(item)).filter(Boolean);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatList(items) {
  return items.length > 0 ? items.join('、') : '未選択';
}

function buildMessage(data, req) {
  const rows = [
    ['メールアドレス', data.email],
    ['お名前', data.name],
    ['家族構成', data.familyType],
    ['一番困っていること', formatList(data.concerns)],
    ['ご相談可能な日時', data.preferredDate || '未入力'],
    ['送信日時', new Date().toLocaleString('ja-JP', {timeZone: 'Asia/Tokyo'})],
    ['送信元', req.headers.origin || '不明']
  ];

  const text = rows.map(([label, value]) => `${label}: ${value}`).join('\n');
  const htmlRows = rows.map(([label, value]) => (
    `<tr><th style="text-align:left;padding:10px;border:1px solid #dbe5e0;background:#f2fbf8;width:180px;">${escapeHtml(label)}</th><td style="padding:10px;border:1px solid #dbe5e0;white-space:pre-wrap;">${escapeHtml(value)}</td></tr>`
  )).join('');

  const html = `
    <div style="font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#14201f;line-height:1.7;">
      <h1 style="font-size:22px;">家庭防災設計 無料診断フォーム</h1>
      <p>LPの自前フォームから新しい申し込みがありました。</p>
      <table style="border-collapse:collapse;width:100%;max-width:760px;">${htmlRows}</table>
    </div>
  `;

  return {text, html};
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendJson(res, 405, {ok: false, error: 'Method not allowed'});
  }

  if (!isAllowedOrigin(req.headers.origin)) {
    return sendJson(res, 403, {ok: false, error: 'Forbidden'});
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  } catch {
    return sendJson(res, 400, {ok: false, error: 'Invalid JSON'});
  }

  if (normalizeText(body.website)) {
    return sendJson(res, 200, {ok: true});
  }

  const data = {
    email: normalizeText(body.email),
    name: normalizeText(body.name),
    familyType: normalizeText(body.familyType || body.family),
    concerns: normalizeArray(body.concerns && body.concerns.length ? body.concerns : body.consultation),
    preferredDate: normalizeText(body.preferredDate)
  };

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(data.email) || !data.name || !data.familyType || data.concerns.length === 0) {
    return sendJson(res, 400, {ok: false, error: 'Required fields are missing'});
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('RESEND_API_KEY is not set');
    return sendJson(res, 500, {ok: false, error: 'Mail service is not configured'});
  }

  const {text, html} = buildMessage(data, req);
  const to = process.env.RESEND_TO_EMAIL || DEFAULT_TO_EMAIL;
  const from = process.env.RESEND_FROM_EMAIL || DEFAULT_FROM_EMAIL;
  const subject = `【家庭防災設計】30分無料診断の申し込み: ${data.name}`;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from,
      to,
      reply_to: data.email,
      subject,
      text,
      html
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Resend API error:', response.status, errorText);
    return sendJson(res, 502, {ok: false, error: 'Failed to send email'});
  }

  return sendJson(res, 200, {ok: true});
};
