export type Bookmark = {
  id: string
  threadId: string
  threadTitle: string
  text: string
  createdAt: string
}

const key = 'cognitive-studio-bookmarks'
const id = () => `bookmark-${Date.now()}-${Math.random().toString(16).slice(2)}`

export class Bookmarks {
  private host: Element
  private items: Bookmark[]
  private reopen: (threadId: string) => void
  private saved: (items: Bookmark[]) => void

  constructor(host: Element, reopen: (threadId: string) => void, saved: (items: Bookmark[]) => void = () => {}) {
    this.host = host
    this.reopen = reopen
    this.saved = saved
    this.items = JSON.parse(localStorage.getItem(key) || '[]') as Bookmark[]
    this.render()
  }

  get all() { return [...this.items] }

  replaceAll(items: Bookmark[]) {
    this.items = items.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    this.save()
    this.render()
  }

  add(threadId: string, threadTitle: string, text: string) {
    const normalized = text.trim()
    if (!normalized) return
    const exists = this.items.some(item => item.threadId === threadId && item.text === normalized)
    if (!exists) this.items = [{ id: id(), threadId, threadTitle, text: normalized, createdAt: new Date().toISOString() }, ...this.items]
    this.save()
    this.render()
  }

  toggle() { this.host.classList.toggle('open') }
  open() { this.host.classList.add('open') }
  close() { this.host.classList.remove('open') }

  private save() { localStorage.setItem(key, JSON.stringify(this.items)); this.saved(this.all) }

  private render() {
    this.host.innerHTML = `
      <div class="museum">
        <div class="drawer-title">
          <div>
            <p class="eyebrow">Museum</p>
            <h2>Favorite sentences</h2>
          </div>
          <button data-close aria-label="Close sentence museum">×</button>
        </div>
        <div class="museum-grid">
          ${this.items.length ? this.items.map(item => `<article class="sentence-art">
            <p>${this.escape(item.text)}</p>
            <footer>
              <button data-open-thread="${item.threadId}">${this.escape(item.threadTitle)}</button>
              <time>${new Date(item.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</time>
            </footer>
          </article>`).join('') : '<p class="empty-state">Bookmark sentences from Sentence view. They will gather here.</p>'}
        </div>
      </div>`
    this.host.querySelector('[data-close]')?.addEventListener('click', () => this.close())
    this.host.querySelectorAll<HTMLButtonElement>('[data-open-thread]').forEach(button => button.addEventListener('click', () => { this.reopen(button.dataset.openThread!); this.close() }))
  }

  private escape(text: string) {
    const el = document.createElement('div')
    el.textContent = text
    return el.innerHTML
  }
}
