export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST required.' })
  if (!process.env.GEMINI_API_KEY) return res.status(503).json({ error: 'GEMINI_API_KEY is not configured on Vercel.' })
  const { prompt, text, model, temperature, maxTokens } = req.body || {}
  if (!prompt || !text) return res.status(400).json({ error: 'Prompt and text are required.' })
  const selectedModel = encodeURIComponent(model || 'gemini-2.5-flash')
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: `${prompt}\n\nText:\n${String(text).slice(0, 16000)}` }] }], generationConfig: { temperature: Number(temperature ?? .4), maxOutputTokens: Number(maxTokens ?? 600) } }) })
  const data = await response.json()
  if (!response.ok) return res.status(response.status).json({ error: data.error?.message || 'Gemini request failed.' })
  return res.status(200).json({ output: data.candidates?.[0]?.content?.parts?.map(part => part.text || '').join('') || '' })
}
