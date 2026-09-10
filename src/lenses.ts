import bundledLenses from '../lenses.json'

export type Lens = { id: string; name: string; description: string; prompt: string }
const promptKey = 'cognitive-studio-lens-prompts'
export async function loadLenses(): Promise<Lens[]> {
  try {
    const response = await fetch('/lenses.json')
    if (response.ok) return applyPromptOverrides(await response.json() as Lens[])
  } catch { /* use bundled definitions below */ }
  return applyPromptOverrides(bundledLenses as Lens[])
}
export function loadPromptOverrides() {
  try { return JSON.parse(localStorage.getItem(promptKey) || '{}') as Record<string, string> }
  catch { localStorage.removeItem(promptKey); return {} }
}
export function applyPromptOverrides(lenses: Lens[]) {
  const overrides = loadPromptOverrides()
  return lenses.map(lens => ({ ...lens, prompt: overrides[lens.id] || lens.prompt }))
}
export function savePromptOverrides(lenses: Lens[]) {
  localStorage.setItem(promptKey, JSON.stringify(Object.fromEntries(lenses.map(lens => [lens.id, lens.prompt]))))
}
export function renderLenses(host: Element, lenses: Lens[], run: (lens: Lens, card: HTMLButtonElement) => void) { host.innerHTML = ''; lenses.forEach(lens => { const card = document.createElement('button'); card.className = 'lens-card'; card.innerHTML = `<span class="lens-name">${lens.name}</span><span class="lens-description">${lens.description}</span><span class="lens-state"></span>`; card.addEventListener('click', () => run(lens, card)); host.append(card) }) }

export class PromptConfig {
  private host: Element
  private lenses: Lens[] = []
  private changed: (lenses: Lens[]) => void

  constructor(host: Element, changed: (lenses: Lens[]) => void) {
    this.host = host
    this.changed = changed
  }

  setLenses(lenses: Lens[]) { this.lenses = lenses; this.render() }
  toggle() { this.host.classList.toggle('open') }
  open() { this.host.classList.add('open') }
  close() { this.host.classList.remove('open') }

  private render() {
    this.host.innerHTML = `<div class="prompt-config">
      <div class="drawer-title"><div><p class="eyebrow">Prompt config</p><h2>Lens instructions</h2></div><button data-close aria-label="Close prompt config">×</button></div>
      <p class="drawer-note">Edits are stored locally and override <code>lenses.json</code>. Add or remove lens cards by editing <code>lenses.json</code>.</p>
      <div class="prompt-list">${this.lenses.map(lens => `<label><span>${this.escape(lens.name)}</span><small>${this.escape(lens.description)}</small><textarea data-lens="${lens.id}">${this.escape(lens.prompt)}</textarea></label>`).join('')}</div>
      <div class="drawer-actions"><button class="save-settings" data-save>Save prompts</button><button data-reset>Reset local edits</button></div>
    </div>`
    this.host.querySelector('[data-close]')?.addEventListener('click', () => this.close())
    this.host.querySelector('[data-save]')?.addEventListener('click', () => {
      this.host.querySelectorAll<HTMLTextAreaElement>('[data-lens]').forEach(field => {
        const lens = this.lenses.find(item => item.id === field.dataset.lens)
        if (lens) lens.prompt = field.value.trim()
      })
      savePromptOverrides(this.lenses)
      this.changed(this.lenses)
      this.close()
    })
    this.host.querySelector('[data-reset]')?.addEventListener('click', () => {
      localStorage.removeItem(promptKey)
      location.reload()
    })
  }

  private escape(text: string) {
    const el = document.createElement('div')
    el.textContent = text
    return el.innerHTML
  }
}
