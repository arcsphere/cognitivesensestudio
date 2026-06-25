type Item = { lens: string; output: string; time: Date }
export class Results {
  private history: Item[] = []
  private tray: Element
  private historyHost: Element
  private append: (output: string) => void
  constructor(tray: Element, historyHost: Element, append: (output: string) => void) { this.tray = tray; this.historyHost = historyHost; this.append = append; this.renderHistory() }
  show(item: Item) { this.history = [item, ...this.history.filter(i => i.output !== item.output)].slice(0, 5); this.tray.innerHTML = `<section class="result"><span class="eyebrow">${item.lens}</span><p>${this.escape(item.output)}</p><div><button data-action="append">append to canvas</button><button data-action="copy">copy output</button><button data-action="dismiss">dismiss</button></div></section>`; this.tray.querySelector('[data-action="append"]')!.addEventListener('click', () => this.append(`[${item.lens}]\n${item.output}`)); this.tray.querySelector('[data-action="copy"]')!.addEventListener('click', () => navigator.clipboard.writeText(item.output)); this.tray.querySelector('[data-action="dismiss"]')!.addEventListener('click', () => this.dismiss()); this.renderHistory() }
  dismiss() { this.tray.innerHTML = '' }
  private renderHistory() { this.historyHost.innerHTML = this.history.length ? `<details><summary>Recent results (${this.history.length})</summary>${this.history.map((item, i) => `<button class="history-item" data-history="${i}"><strong>${item.lens}</strong><span>${this.escape(item.output.slice(0, 60))} · ${item.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></button>`).join('')}</details>` : ''; this.historyHost.querySelectorAll<HTMLButtonElement>('[data-history]').forEach(b => b.addEventListener('click', () => this.show(this.history[Number(b.dataset.history)]))) }
  private escape(text: string) { const el = document.createElement('div'); el.textContent = text; return el.innerHTML.replace(/\n/g, '<br>') }
}
