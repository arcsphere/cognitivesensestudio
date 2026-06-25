export type Thread = {
  id: string
  title: string
  text: string
  updatedAt: string
  archivedText?: string
  archivedAt?: string
}

const key = 'cognitive-studio-threads'

const now = () => new Date().toISOString()
const id = () => `thread-${Date.now()}-${Math.random().toString(16).slice(2)}`
const titleFrom = (text: string) => text.trim().split(/\s+/).slice(0, 7).join(' ') || 'Untitled thread'

export class Threads {
  private host: Element
  private changed: (thread: Thread) => void
  private saved: (threads: Thread[]) => void
  private removed: (threadId: string) => void
  private threads: Thread[]
  private activeId: string

  constructor(host: Element, changed: (thread: Thread) => void, saved: (threads: Thread[]) => void = () => {}, removed: (threadId: string) => void = () => {}) {
    this.host = host
    this.changed = changed
    this.saved = saved
    this.removed = removed
    this.threads = this.load()
    this.activeId = localStorage.getItem('cognitive-studio-active-thread') || this.threads[0].id
    this.render()
  }

  get active() { return this.threads.find(t => t.id === this.activeId) || this.threads[0] }
  get all() { return [...this.threads] }

  replaceAll(threads: Thread[]) {
    if (!threads.length) return
    this.threads = threads.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
    if (!this.threads.some(thread => thread.id === this.activeId)) this.activeId = this.threads[0].id
    localStorage.setItem('cognitive-studio-active-thread', this.activeId)
    this.save()
    this.render()
    this.changed(this.active)
  }

  updateText(text: string) {
    const thread = this.active
    thread.text = text
    thread.title = titleFrom(text)
    thread.updatedAt = now()
    this.save()
    this.render()
  }

  create() {
    const thread: Thread = { id: id(), title: 'Untitled thread', text: '', updatedAt: now() }
    this.threads = [thread, ...this.threads]
    this.activate(thread.id)
  }

  move(threadId: string, direction: -1 | 1) {
    const index = this.threads.findIndex(thread => thread.id === threadId)
    const target = index + direction
    if (index < 0 || target < 0 || target >= this.threads.length) return
    const next = [...this.threads]
    ;[next[index], next[target]] = [next[target], next[index]]
    this.threads = next
    this.save()
    this.render()
  }

  delete(threadId: string) {
    if (this.threads.length === 1) {
      this.clearActiveContext()
      return
    }
    this.threads = this.threads.filter(thread => thread.id !== threadId)
    if (this.activeId === threadId) this.activeId = this.threads[0].id
    this.removed(threadId)
    this.save()
    this.render()
    this.changed(this.active)
  }

  activate(threadId: string) {
    this.activeId = threadId
    localStorage.setItem('cognitive-studio-active-thread', threadId)
    this.save()
    this.render()
    this.changed(this.active)
  }

  clearActiveContext() {
    const thread = this.active
    if (thread.text.trim()) {
      thread.archivedText = thread.text
      thread.archivedAt = now()
    }
    thread.text = ''
    thread.title = 'Untitled thread'
    thread.updatedAt = now()
    this.save()
    this.render()
    this.changed(thread)
  }

  regainActiveContext() {
    const thread = this.active
    if (!thread.archivedText) return
    thread.text = thread.archivedText
    thread.title = titleFrom(thread.text)
    thread.updatedAt = now()
    this.save()
    this.render()
    this.changed(thread)
  }

  private load() {
    const stored = JSON.parse(localStorage.getItem(key) || '[]') as Thread[]
    return stored.length ? stored : [{ id: id(), title: 'Untitled thread', text: '', updatedAt: now() }]
  }

  private save() { localStorage.setItem(key, JSON.stringify(this.threads)); this.saved(this.all) }

  private render() {
    this.host.innerHTML = `
      <div class="thread-header">
        <span>Threads</span>
        <button data-thread-new aria-label="New thread">＋</button>
      </div>
      <div class="thread-list">
        ${this.threads.map(thread => `<div class="thread-item-wrap">
          <button class="thread-item ${thread.id === this.activeId ? 'active' : ''}" data-thread="${thread.id}">
            <span>${this.escape(thread.title)}</span>
            <small>${new Date(thread.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}${thread.archivedText ? ' · archived' : ''}</small>
          </button>
          <div class="thread-actions">
            <button data-move-up="${thread.id}" aria-label="Move thread up">↑</button>
            <button data-move-down="${thread.id}" aria-label="Move thread down">↓</button>
            <button data-delete-thread="${thread.id}" aria-label="Delete thread">×</button>
          </div>
        </div>`).join('')}
      </div>`
    this.host.querySelector('[data-thread-new]')?.addEventListener('click', () => this.create())
    this.host.querySelectorAll<HTMLButtonElement>('[data-thread]').forEach(button => button.addEventListener('click', () => this.activate(button.dataset.thread!)))
    this.host.querySelectorAll<HTMLButtonElement>('[data-move-up]').forEach(button => button.addEventListener('click', () => this.move(button.dataset.moveUp!, -1)))
    this.host.querySelectorAll<HTMLButtonElement>('[data-move-down]').forEach(button => button.addEventListener('click', () => this.move(button.dataset.moveDown!, 1)))
    this.host.querySelectorAll<HTMLButtonElement>('[data-delete-thread]').forEach(button => button.addEventListener('click', () => { if (confirm('Delete this thread?')) this.delete(button.dataset.deleteThread!) }))
  }

  private escape(text: string) {
    const el = document.createElement('div')
    el.textContent = text
    return el.innerHTML
  }
}
