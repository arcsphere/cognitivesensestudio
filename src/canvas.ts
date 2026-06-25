export class Canvas {
  private textarea: HTMLTextAreaElement
  private sentences: string[] = []
  private selected = ''
  private focused = ''
  private view: 'edit' | 'sentence' = 'edit'
  private sentenceView: HTMLDivElement
  private count: Element
  private changed: (text: string) => void
  private bookmark?: (sentence: string) => void
  constructor(host: Element, count: Element, changed: (text: string) => void, bookmark?: (sentence: string) => void) {
    this.count = count
    this.changed = changed
    this.bookmark = bookmark
    this.textarea = document.createElement('textarea'); this.textarea.placeholder = 'Write what is here. Fragments are welcome.'; this.textarea.setAttribute('aria-label', 'Writing canvas')
    this.sentenceView = document.createElement('div'); this.sentenceView.className = 'sentence-view'; this.sentenceView.hidden = true
    host.append(this.textarea, this.sentenceView)
    this.textarea.addEventListener('input', () => this.update())
    ;['select', 'keyup', 'mouseup'].forEach(event => this.textarea.addEventListener(event, () => this.captureSelection()))
    this.update()
  }
  get text() { return this.textarea.value }
  selectedText() { return this.selected }
  focusedSentence() { return this.focused }
  append(output: string) { this.textarea.value += `${this.text ? '\n\n' : ''}— ${output}`; this.update(); this.setView('edit') }
  setText(text: string) { this.textarea.value = text; this.focused = ''; this.selected = ''; this.update(); this.setView('edit') }
  clear() { this.textarea.value = ''; this.update() }
  setView(view: 'edit' | 'sentence') { this.view = view; this.textarea.hidden = view === 'sentence'; this.sentenceView.hidden = view !== 'sentence'; document.querySelectorAll('[data-view]').forEach(b => b.classList.toggle('active', (b as HTMLElement).dataset.view === view)); if (view === 'sentence') this.renderSentences(); else this.textarea.focus() }
  fitToTokenLimit(text: string) { const words = text.trim().split(/\s+/); return { text: words.slice(0, 800).join(' '), trimmed: words.length > 800 } }
  private captureSelection() { this.selected = this.textarea.value.slice(this.textarea.selectionStart, this.textarea.selectionEnd) }
  private update() { const n = this.text.trim() ? this.text.trim().split(/\s+/).length : 0; this.count.textContent = `${n} word${n === 1 ? '' : 's'}`; this.sentences = this.text.match(/[^.!?\n]+[.!?]?/g)?.map(s => s.trim()).filter(Boolean) || []; if (this.focused && !this.sentences.includes(this.focused)) this.focused = ''; if (this.view === 'sentence') this.renderSentences(); this.changed(this.text) }
  private renderSentences() {
    this.sentenceView.innerHTML = ''
    this.sentences.forEach((sentence, i) => {
      const row = document.createElement('div')
      row.className = `sentence-row ${this.focused && this.focused !== sentence ? 'dim' : ''}`
      const b = document.createElement('button')
      b.className = `sentence-block ${this.focused === sentence ? 'focused' : ''}`
      b.textContent = sentence
      b.addEventListener('click', () => { this.focused = sentence; this.renderSentences() })
      const mark = document.createElement('button')
      mark.className = 'bookmark-button'
      mark.type = 'button'
      mark.title = 'Bookmark sentence'
      mark.setAttribute('aria-label', 'Bookmark sentence')
      mark.textContent = '☆'
      mark.addEventListener('click', (event) => { event.stopPropagation(); this.bookmark?.(sentence); mark.textContent = '★' })
      if (!this.focused && i === 0) { this.focused = sentence; b.classList.add('focused') }
      row.append(b, mark)
      this.sentenceView.append(row)
    })
    if (!this.sentences.length) this.sentenceView.innerHTML = '<p class="empty-state">Nothing to focus yet.</p>'
  }
}
