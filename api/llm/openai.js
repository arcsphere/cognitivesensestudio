export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST required.' })
  if (!process.env.OPENAI_API_KEY) return res.status(503).json({ error: 'OPENAI_API_KEY is not configured on Vercel.' })
  const { prompt, text, model, temperature, maxTokens } = req.body || {}
  if (!prompt || !text) return res.status(400).json({ error: 'Prompt and text are required.' })
  const response = await fetch('https://api.openai.com/v1/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` }, body: JSON.stringify({ model: model || 'gpt-4o-mini', messages: [{ role: 'system', content: prompt }, { role: 'user', content: String(text).slice(0, 16000) }], temperature: Number(temperature ?? .4), max_tokens: Number(maxTokens ?? 600) }) })
  const data = await response.json()
  if (!response.ok) return res.status(response.status).json({ error: data.error?.message || 'OpenAI request failed.' })
  return res.status(200).json({ output: data.choices?.[0]?.message?.content || '' })
}
