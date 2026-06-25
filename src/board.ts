import type { BoardItem } from './types'

const key = 'cognitive-studio-board'
const id = () => `board-${Date.now()}-${Math.random().toString(16).slice(2)}`

export class Board {
  private host: Element
  private items: BoardItem[]
  private saved: (items: BoardItem[]) => void

  constructor(host: Element, saved: (items: BoardItem[]) => void = () => {}) {
    this.host = host
    this.saved = saved
    this.items = JSON.parse(localStorage.getItem(key) || '[]') as BoardItem[]
    this.render()
  }

  get all() { return [...this.items] }

  replaceAll(items: BoardItem[]) {
    this.items = items
    this.save()
    this.render()
  }

  add(text: string, threadId: string) {
    const clean = text.trim()
    if (!clean) return
    this.items = [{ id: id(), text: clean, x: 90 + (this.items.length % 5) * 38, y: 90 + (this.items.length % 7) * 30, threadId, createdAt: new Date().toISOString() }, ...this.items]
    this.save()
    this.open()
  }

  toggle() { this.host.classList.toggle('open') }
  open() { this.host.classList.add('open') }
  close() { this.host.classList.remove('open') }

  private move(itemId: string, x: number, y: number) {
    const item = this.items.find(entry => entry.id === itemId)
    if (!item) return
    item.x = Math.max(10, x)
    item.y = Math.max(10, y)
    this.save()
  }

  private remove(itemId: string) {
    this.items = this.items.filter(item => item.id !== itemId)
    this.save()
    this.render()
  }

  private save() { localStorage.setItem(key, JSON.stringify(this.items)); this.saved(this.all) }

  private render() {
    this.host.innerHTML = `
      <div class="board-shell">
        <div class="drawer-title">
          <div><p class="eyebrow">Canvas board</p><h2>Floating sentences</h2></div>
          <button data-close aria-label="Close canvas board">×</button>
        </div>
        <div class="board-space">
          ${this.items.map(item => `<article class="board-card" data-board-item="${item.id}" style="left:${item.x}px;top:${item.y}px">
            <button data-remove-board="${item.id}" aria-label="Remove board sentence">×</button>
            <p>${this.escape(item.text)}</p>
          </article>`).join('')}
          ${this.items.length ? '' : '<p class="empty-state board-empty">Select text or focus a sentence, then use “To board”.</p>'}
        </div>
      </div>`
    this.host.querySelector('[data-close]')?.addEventListener('click', () => this.close())
    this.host.querySelectorAll<HTMLButtonElement>('[data-remove-board]').forEach(button => button.addEventListener('click', () => this.remove(button.dataset.removeBoard!)))
    this.host.querySelectorAll<HTMLElement>('[data-board-item]').forEach(card => this.makeDraggable(card))
  }

  private makeDraggable(card: HTMLElement) {
    card.addEventListener('pointerdown', (event) => {
      if ((event.target as HTMLElement).tagName === 'BUTTON') return
      card.setPointerCapture(event.pointerId)
      const startX = event.clientX
      const startY = event.clientY
      const left = card.offsetLeft
      const top = card.offsetTop
      const move = (next: PointerEvent) => {
        card.style.left = `${left + next.clientX - startX}px`
        card.style.top = `${top + next.clientY - startY}px`
      }
      const up = () => {
        card.removeEventListener('pointermove', move)
        this.move(card.dataset.boardItem!, card.offsetLeft, card.offsetTop)
      }
      card.addEventListener('pointermove', move)
      card.addEventListener('pointerup', up, { once: true })
    })
  }

  private escape(text: string) {
    const el = document.createElement('div')
    el.textContent = text
    return el.innerHTML
  }
}
