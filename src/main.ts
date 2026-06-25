import './style.css'
import { ActionRoom } from './actionRoom'
import { Board } from './board'
import { Bookmarks } from './bookmarks'
import { Canvas } from './canvas'
import { detectProvider, runLens, type ProviderConfig } from './llm'
import { loadLenses, PromptConfig, renderLenses, type Lens } from './lenses'
import { Results } from './result'
import { Settings } from './settings'
import { SupabaseStore } from './supabase'
import { Threads } from './threads'

const app = document.querySelector<HTMLDivElement>('#app')!
const version = '0.3.0'

app.innerHTML = `
  <header class="topbar"><a class="wordmark" href="#">Cognitive <em>Studio</em></a><span id="thread-status" class="thread-status">Untitled thread</span><span id="auth-status" class="auth-status">local only</span><span id="model-status" class="model-status">○ detecting model</span><div class="topbar-actions"><button id="auth-toggle" class="auth-button">Sign in</button><button id="board-toggle" class="icon-button" aria-label="Open canvas board">□</button><button id="museum-toggle" class="icon-button" aria-label="Open sentence museum">▧</button><button id="prompt-toggle" class="icon-button" aria-label="Configure lens prompts">✎</button><button id="theme-toggle" class="icon-button" aria-label="Switch theme">◐</button><button id="settings-toggle" class="icon-button" aria-label="Open settings">⚙</button></div></header>
  <main class="studio">
    <nav id="threads" class="thread-panel" aria-label="Writing threads"></nav>
    <section class="canvas-panel" aria-label="Writing canvas">
      <div class="canvas-toolbar"><div class="view-toggle" role="group" aria-label="Canvas view"><button data-view="edit" class="active">Edit</button><button data-view="sentence">Sentence</button></div><span id="word-count">0 words</span><div class="canvas-actions"><button id="copy-canvas">Copy</button><button id="to-board">To board</button><button id="action-room-toggle">Action room</button><button id="regain-context">Regain context</button><button id="clear-canvas">Clear thread</button></div></div>
      <div id="canvas-area"></div>
      <div id="trim-warning" class="trim-warning" hidden>Text trimmed to fit local model — focus a sentence instead.</div>
      <div id="result-tray"></div>
    </section>
    <aside class="lens-panel"><div class="lens-heading"><div><p class="eyebrow">Choose a lens</p><h1>Look again</h1></div><p>One lens. One action.</p></div><div id="lenses" class="lens-list" aria-label="Writing lenses"></div><div id="history"></div></aside>
  </main>
  <footer class="app-footer"><span>v${version}</span><span>Created by <a href="https://bostonsense.com" target="_blank" rel="noreferrer">Boston Sense</a></span></footer>
  <div id="settings-drawer"></div>
  <div id="prompt-drawer"></div>
  <div id="museum-drawer"></div>
  <div id="board-drawer"></div>
  <div id="action-room-drawer"></div>
  <div id="llm-blocker" class="llm-blocker" hidden><div><span class="spinner"></span><p>Running lens…</p></div></div>`

const settings = new Settings(document.querySelector('#settings-drawer')!, (config) => updateStatus(config))
const store = new SupabaseStore()
let threads: Threads
let bookmarks: Bookmarks
let board: Board
let actionRoom: ActionRoom
const canvas = new Canvas(document.querySelector('#canvas-area')!, document.querySelector('#word-count')!, (text) => threads?.updateText(text), (sentence) => bookmarks?.add(threads.active.id, threads.active.title, sentence))
const results = new Results(document.querySelector('#result-tray')!, document.querySelector('#history')!, (output) => canvas.append(output))
threads = new Threads(document.querySelector('#threads')!, (thread) => { canvas.setText(thread.text); updateThreadStatus() }, (items) => store.save({ threads: items }), (threadId) => store.remove('threads', 'id', threadId))
bookmarks = new Bookmarks(document.querySelector('#museum-drawer')!, (threadId) => threads.activate(threadId), (items) => store.save({ bookmarks: items }))
board = new Board(document.querySelector('#board-drawer')!, (items) => store.save({ board: items }))
actionRoom = new ActionRoom(document.querySelector('#action-room-drawer')!, (items) => store.save({ actions: items }))
const promptConfig = new PromptConfig(document.querySelector('#prompt-drawer')!, (updated) => {
  lenses = updated
  renderLenses(document.querySelector('#lenses')!, lenses, run)
})
let config: ProviderConfig = settings.value
let lenses: Lens[] = []

async function updateStatus(next = config) {
  config = next
  const badge = document.querySelector('#model-status')!
  badge.textContent = config.provider === 'none' ? '○ no model — configure' : `● ${config.model || 'model'} — ${config.provider === 'ollama' || config.provider === 'lmstudio' ? 'local' : 'cloud'}`
  badge.classList.toggle('available', config.provider !== 'none')
}

function updateThreadStatus() {
  const status = document.querySelector('#thread-status')!
  const thread = threads.active
  status.textContent = thread.archivedText ? `${thread.title} · archived context available` : thread.title
}

function updateAuthStatus() {
  document.querySelector('#auth-status')!.textContent = store.statusLabel
  document.querySelector('#auth-toggle')!.textContent = store.user ? 'Sign out' : 'Sign in'
}

function selectedText() {
  return canvas.selectedText() || canvas.focusedSentence() || canvas.text
}

function setBusy(busy: boolean, label = 'Running lens…') {
  const blocker = document.querySelector<HTMLDivElement>('#llm-blocker')!
  blocker.hidden = !busy
  blocker.querySelector('p')!.textContent = label
  document.querySelectorAll<HTMLButtonElement>('.lens-card').forEach(button => button.disabled = busy)
}

async function boot() {
  store.captureRedirectSession()
  await store.hydrateUser()
  updateAuthStatus()
  const remote = await store.load()
  if (remote.threads?.length) threads.replaceAll(remote.threads)
  if (remote.bookmarks?.length) bookmarks.replaceAll(remote.bookmarks)
  if (remote.board?.length) board.replaceAll(remote.board)
  if (remote.actions?.length) actionRoom.replaceAll(remote.actions)
  const detected = await detectProvider(config)
  if (detected.provider !== 'none') { settings.set(detected); config = detected }
  updateStatus(config)
  canvas.setText(threads.active.text)
  updateThreadStatus()
  if (config.provider === 'none') settings.open()
  lenses = await loadLenses()
  promptConfig.setLenses(lenses)
  renderLenses(document.querySelector('#lenses')!, lenses, run)
}

async function run(lens: Lens, card: HTMLButtonElement) {
  const text = selectedText().trim()
  if (!text) return
  const { text: fitted, trimmed } = canvas.fitToTokenLimit(text)
  document.querySelector<HTMLDivElement>('#trim-warning')!.hidden = !trimmed
  card.classList.add('running'); card.querySelector('.lens-state')!.textContent = 'running…'
  setBusy(true, `Running ${lens.name}…`)
  try {
    if (config.provider === 'none') throw new Error('No model configured. Open settings to connect a local or cloud model.')
    const output = await runLens(config, lens.prompt, fitted)
    results.show({ lens: lens.name, output, time: new Date() })
  } catch (error) {
    results.show({ lens: lens.name, output: error instanceof Error ? error.message : 'The lens could not run.', time: new Date() })
  } finally { card.classList.remove('running'); card.querySelector('.lens-state')!.textContent = ''; setBusy(false) }
}

document.querySelectorAll<HTMLButtonElement>('[data-view]').forEach(button => button.addEventListener('click', () => canvas.setView(button.dataset.view as 'edit' | 'sentence')))
document.querySelector('#copy-canvas')!.addEventListener('click', () => navigator.clipboard.writeText(canvas.text))
document.querySelector('#to-board')!.addEventListener('click', () => board.add(selectedText(), threads.active.id))
document.querySelector('#action-room-toggle')!.addEventListener('click', () => actionRoom.open(threads.active.id, threads.active.title))
document.querySelector('#clear-canvas')!.addEventListener('click', () => { if (canvas.text && confirm('Clear context for this thread only? The last canvas state will be archived locally.')) threads.clearActiveContext() })
document.querySelector('#regain-context')!.addEventListener('click', () => threads.regainActiveContext())
document.querySelector('#settings-toggle')!.addEventListener('click', () => settings.toggle())
document.querySelector('#auth-toggle')!.addEventListener('click', () => { if (store.user) { store.signOut(); updateAuthStatus() } else store.signInWithGoogle() })
document.querySelector('#prompt-toggle')!.addEventListener('click', () => promptConfig.toggle())
document.querySelector('#museum-toggle')!.addEventListener('click', () => bookmarks.toggle())
document.querySelector('#board-toggle')!.addEventListener('click', () => board.toggle())
document.querySelector('#theme-toggle')!.addEventListener('click', () => document.body.dataset.theme = document.body.dataset.theme === 'ink' ? 'light' : 'ink')
document.addEventListener('keydown', e => { if (e.key === 'Escape') results.dismiss() })
boot()
