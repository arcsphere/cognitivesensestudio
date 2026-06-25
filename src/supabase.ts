import type { Bookmark } from './bookmarks'
import type { Thread } from './threads'
import type { ActionRoomData, BoardItem } from './types'

type Session = { access_token: string; refresh_token?: string; expires_at?: number; user?: { id: string; email?: string } }
type SyncSnapshot = { threads: Thread[]; bookmarks: Bookmark[]; board: BoardItem[]; actions: ActionRoomData[] }

const sessionKey = 'cognitive-studio-supabase-session'
const env = import.meta.env as Record<string, string | undefined>

export class SupabaseStore {
  readonly url = env.VITE_SUPABASE_URL?.replace(/\/$/, '') || ''
  readonly anonKey = env.VITE_SUPABASE_ANON_KEY || ''
  private session: Session | null = JSON.parse(localStorage.getItem(sessionKey) || 'null') as Session | null

  get configured() { return Boolean(this.url && this.anonKey) }
  get user() { return this.session?.user || null }
  get statusLabel() {
    if (!this.configured) return 'local only'
    return this.user?.email ? this.user.email : 'sync ready'
  }

  captureRedirectSession() {
    if (!location.hash.includes('access_token=')) return
    const params = new URLSearchParams(location.hash.slice(1))
    this.session = {
      access_token: params.get('access_token') || '',
      refresh_token: params.get('refresh_token') || undefined,
      expires_at: Number(params.get('expires_at')) || undefined,
    }
    history.replaceState(null, document.title, location.pathname + location.search)
    localStorage.setItem(sessionKey, JSON.stringify(this.session))
  }

  async hydrateUser() {
    if (!this.configured || !this.session?.access_token) return
    const response = await fetch(`${this.url}/auth/v1/user`, { headers: this.headers() })
    if (!response.ok) { this.signOut(); return }
    this.session.user = await response.json()
    localStorage.setItem(sessionKey, JSON.stringify(this.session))
  }

  signInWithGoogle() {
    if (!this.configured) return
    const redirectTo = encodeURIComponent(location.origin + location.pathname)
    location.href = `${this.url}/auth/v1/authorize?provider=google&redirect_to=${redirectTo}`
  }

  signOut() {
    this.session = null
    localStorage.removeItem(sessionKey)
  }

  async load(): Promise<Partial<SyncSnapshot>> {
    if (!this.configured || !this.user) return {}
    const [threads, bookmarks, board, actions] = await Promise.all([
      this.select<Thread>('threads'),
      this.select<Bookmark>('bookmarks'),
      this.select<BoardItem>('board_items'),
      this.select<ActionRoomData>('action_rooms'),
    ])
    return { threads, bookmarks, board, actions }
  }

  async save(snapshot: Partial<SyncSnapshot>) {
    if (!this.configured || !this.user) return
    try {
      await Promise.all([
        snapshot.threads ? this.upsert('threads', snapshot.threads) : undefined,
        snapshot.bookmarks ? this.upsert('bookmarks', snapshot.bookmarks) : undefined,
        snapshot.board ? this.upsert('board_items', snapshot.board) : undefined,
        snapshot.actions ? this.upsert('action_rooms', snapshot.actions) : undefined,
      ])
    } catch (error) {
      console.warn('Supabase sync failed; local cache preserved.', error)
    }
  }

  async remove(table: 'threads' | 'bookmarks' | 'board_items' | 'action_rooms', idColumn: string, id: string) {
    if (!this.configured || !this.user) return
    await fetch(`${this.url}/rest/v1/${table}?${idColumn}=eq.${encodeURIComponent(id)}`, { method: 'DELETE', headers: this.headers() })
  }

  private async select<T>(table: string): Promise<T[]> {
    const response = await fetch(`${this.url}/rest/v1/${table}?select=*`, { headers: this.headers() })
    if (!response.ok) return []
    return response.json()
  }

  private async upsert(table: string, rows: object[]) {
    if (!rows.length) return
    const userRows = rows.map(row => ({ ...row, user_id: this.user!.id }))
    await fetch(`${this.url}/rest/v1/${table}`, { method: 'POST', headers: { ...this.headers(), Prefer: 'resolution=merge-duplicates' }, body: JSON.stringify(userRows) })
  }

  private headers() {
    const token = this.session?.access_token || this.anonKey
    return { apikey: this.anonKey, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
  }
}
