import type { ActionRoomData } from './types'

const key = 'cognitive-studio-action-rooms'
const blank = (threadId: string): ActionRoomData => ({
  threadId,
  context: '',
  world: '',
  trust: '',
  cannotTrust: '',
  swot: { strengths: '', weaknesses: '', opportunities: '', threats: '' },
  smart: { specific: '', measurable: '', achievable: '', relevant: '', timeBound: '' },
  updatedAt: new Date().toISOString(),
})

export class ActionRoom {
  private host: Element
  private rooms: ActionRoomData[]
  private threadId = ''
  private saved: (rooms: ActionRoomData[]) => void

  constructor(host: Element, saved: (rooms: ActionRoomData[]) => void = () => {}) {
    this.host = host
    this.saved = saved
    this.rooms = JSON.parse(localStorage.getItem(key) || '[]') as ActionRoomData[]
  }

  get all() { return [...this.rooms] }

  replaceAll(rooms: ActionRoomData[]) {
    this.rooms = rooms
    this.save()
  }

  open(threadId: string, title: string) {
    this.threadId = threadId
    if (!this.rooms.some(room => room.threadId === threadId)) this.rooms.push(blank(threadId))
    this.render(title)
    this.host.classList.add('open')
  }

  close() { this.host.classList.remove('open') }

  private current() {
    let room = this.rooms.find(entry => entry.threadId === this.threadId)
    if (!room) {
      room = blank(this.threadId)
      this.rooms.push(room)
    }
    return room
  }

  private update(path: string, value: string) {
    const room = this.current()
    if (path === 'context') room.context = value
    if (path === 'world') room.world = value
    if (path === 'trust') room.trust = value
    if (path === 'cannotTrust') room.cannotTrust = value
    if (path === 'swot.strengths') room.swot.strengths = value
    if (path === 'swot.weaknesses') room.swot.weaknesses = value
    if (path === 'swot.opportunities') room.swot.opportunities = value
    if (path === 'swot.threats') room.swot.threats = value
    if (path === 'smart.specific') room.smart.specific = value
    if (path === 'smart.measurable') room.smart.measurable = value
    if (path === 'smart.achievable') room.smart.achievable = value
    if (path === 'smart.relevant') room.smart.relevant = value
    if (path === 'smart.timeBound') room.smart.timeBound = value
    room.updatedAt = new Date().toISOString()
    this.save()
  }

  private save() { localStorage.setItem(key, JSON.stringify(this.rooms)); this.saved(this.all) }

  private render(title: string) {
    const room = this.current()
    this.host.innerHTML = `
      <div class="action-room">
        <div class="drawer-title">
          <div><p class="eyebrow">Action room</p><h2>${this.escape(title)}</h2></div>
          <button data-close aria-label="Close action room">×</button>
        </div>
        <section class="action-grid">
          ${this.textarea('context', 'Context', room.context)}
          ${this.textarea('world', 'The world', room.world)}
          ${this.textarea('trust', 'What I can trust', room.trust)}
          ${this.textarea('cannotTrust', 'What I cannot trust', room.cannotTrust)}
        </section>
        <h3>SWOT grid</h3>
        <section class="action-grid four">
          ${this.textarea('swot.strengths', 'Strengths', room.swot.strengths)}
          ${this.textarea('swot.weaknesses', 'Weaknesses', room.swot.weaknesses)}
          ${this.textarea('swot.opportunities', 'Opportunities', room.swot.opportunities)}
          ${this.textarea('swot.threats', 'Threats', room.swot.threats)}
        </section>
        <h3>SMART indicators</h3>
        <section class="action-grid">
          ${this.textarea('smart.specific', 'Specific', room.smart.specific)}
          ${this.textarea('smart.measurable', 'Measurable', room.smart.measurable)}
          ${this.textarea('smart.achievable', 'Achievable', room.smart.achievable)}
          ${this.textarea('smart.relevant', 'Relevant', room.smart.relevant)}
          ${this.textarea('smart.timeBound', 'Time-bound', room.smart.timeBound)}
        </section>
      </div>`
    this.host.querySelector('[data-close]')?.addEventListener('click', () => this.close())
    this.host.querySelectorAll<HTMLTextAreaElement>('[data-field]').forEach(field => field.addEventListener('input', () => this.update(field.dataset.field!, field.value)))
  }

  private textarea(field: string, label: string, value: string) {
    return `<label><span>${label}</span><textarea data-field="${field}">${this.escape(value)}</textarea></label>`
  }

  private escape(text: string) {
    const el = document.createElement('div')
    el.textContent = text
    return el.innerHTML
  }
}
