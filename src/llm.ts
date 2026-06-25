export type ProviderConfig = { provider: 'none' | 'ollama' | 'lmstudio' | 'openai'; endpoint: string; key: string; model: string; temperature: number; tokens: number }
const preferred = ['mistral', 'llama3', 'phi3', 'gemma']
const pick = (models: string[]) => models.sort((a, b) => (preferred.findIndex(p => a.toLowerCase().includes(p)) + 10) % 10 - (preferred.findIndex(p => b.toLowerCase().includes(p)) + 10) % 10)[0] || ''
export async function detectProvider(config: ProviderConfig): Promise<ProviderConfig> {
  if (config.provider === 'openai') return config
  try { const r = await fetch('http://localhost:11434/api/tags'); if (r.ok) { const data = await r.json(); const model = pick(data.models?.map((m: { name: string }) => m.name) || []); if (model) return { ...config, provider: 'ollama', endpoint: 'http://localhost:11434', model } } } catch { /* unavailable */ }
  try { const r = await fetch('http://localhost:1234/v1/models'); if (r.ok) { const data = await r.json(); const model = pick(data.data?.map((m: { id: string }) => m.id) || []); if (model) return { ...config, provider: 'lmstudio', endpoint: 'http://localhost:1234/v1', model } } } catch { /* unavailable */ }
  return config
}
export async function runLens(config: ProviderConfig, prompt: string, text: string): Promise<string> {
  const url = config.provider === 'ollama' ? `${config.endpoint}/api/generate` : `${config.endpoint.replace(/\/$/, '')}/chat/completions`
  const body = config.provider === 'ollama' ? { model: config.model, prompt: `${prompt}\n\nText:\n"${text}"`, stream: false, options: { temperature: config.temperature, num_predict: config.tokens } } : { model: config.model, messages: [{ role: 'system', content: prompt }, { role: 'user', content: text }], max_tokens: config.tokens, temperature: config.temperature }
  const headers: HeadersInit = { 'Content-Type': 'application/json' }; if (config.key) headers.Authorization = `Bearer ${config.key}`
  const r = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) }); if (!r.ok) throw new Error(`Model request failed (${r.status}).`); const data = await r.json(); return (config.provider === 'ollama' ? data.response : data.choices?.[0]?.message?.content || '').trim()
}
