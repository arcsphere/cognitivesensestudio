import type { ProviderConfig } from './llm'
const defaults: ProviderConfig = { provider: 'none', endpoint: '', key: '', model: '', temperature: .4, tokens: 600 }
export class Settings {
  value: ProviderConfig
  private host: Element
  private changed: (value: ProviderConfig) => void
  constructor(host: Element, changed: (value: ProviderConfig) => void) { this.host = host; this.changed = changed; this.value = { ...defaults, ...JSON.parse(localStorage.getItem('cognitive-studio-settings') || '{}') }; this.render() }
  set(value: ProviderConfig) { this.value = value; this.save(); this.render() }
  toggle() { this.host.classList.toggle('open') }
  open() { this.host.classList.add('open') }
  private save() { localStorage.setItem('cognitive-studio-settings', JSON.stringify(this.value)); this.changed(this.value) }
  private render() { this.host.innerHTML = `<div class="drawer"><div class="drawer-title"><h2>Model settings</h2><button data-close aria-label="Close settings">×</button></div><label>Provider<select data-key="provider"><option value="none">Choose provider</option><option value="ollama">Ollama</option><option value="lmstudio">LM Studio</option><option value="openai">OpenAI-compatible</option></select></label><label>Endpoint URL<input data-key="endpoint" placeholder="https://api.openai.com/v1" /></label><label>API key<input data-key="key" type="password" placeholder="Stored locally" /></label><label>Model name<input data-key="model" placeholder="gpt-4o-mini" /></label><label>Temperature <output>${this.value.temperature}</output><input data-key="temperature" type="range" min="0" max="1" step=".1" /></label><label>Max tokens <output>${this.value.tokens}</output><input data-key="tokens" type="range" min="200" max="2000" step="100" /></label><button class="save-settings">Save settings</button></div>`; this.host.querySelectorAll<HTMLInputElement | HTMLSelectElement>('[data-key]').forEach(field => { const key = field.dataset.key as keyof ProviderConfig; field.value = String(this.value[key]); field.addEventListener('input', () => { (this.value as Record<string, string | number>)[key] = field.type === 'range' ? Number(field.value) : field.value; const output = field.parentElement?.querySelector('output'); if (output) output.textContent = field.value }) }); this.host.querySelector('[data-close]')!.addEventListener('click', () => this.toggle()); this.host.querySelector('.save-settings')!.addEventListener('click', () => { this.save(); this.toggle() }) }
}
