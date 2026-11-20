import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { COLLECTIONS, type CollectionName, type Collections } from './types'
import { uid, nowIso } from './util'
import { defaultTheme } from './worlds'

/** Storage backend: on-device (IndexedDB) or Supabase (RLS-protected). */
export interface Backend {
  list<K extends CollectionName>(c: K): Promise<Collections[K][]>
  put<K extends CollectionName>(c: K, row: Collections[K]): Promise<void>
  remove(c: CollectionName, id: string): Promise<void>
  clearAll(): Promise<void>
}

export interface KV {
  get(key: string): Promise<unknown>
  set(key: string, value: unknown): Promise<void>
  clear(): Promise<void>
}

/** Local backend: each collection is one array under a KV key. */
export function localBackend(kv: KV): Backend {
  const read = async <K extends CollectionName>(c: K) => ((await kv.get(c)) as Collections[K][] | undefined) ?? []
  return {
    list: read,
    async put(c, row) {
      const rows = await read(c)
      const i = rows.findIndex((r) => r.id === row.id)
      if (i >= 0) rows[i] = row
      else rows.push(row)
      await kv.set(c, rows)
    },
    async remove(c, id) {
      await kv.set(c, (await read(c)).filter((r) => r.id !== id))
    },
    clearAll: () => kv.clear(),
  }
}

export function supabaseBackend(sb: SupabaseClient, userId: string): Backend {
  const idCol = (c: CollectionName) => (c === 'profiles' ? 'id' : 'user_id')
  const strip = (row: object) => {
    const { user_id: _u, ...rest } = row as Record<string, unknown>
    return rest
  }
  return {
    async list(c) {
      const { data, error } = await sb.from(c).select('*').order('created_at')
      if (error) throw error
      return (data ?? []).map(strip) as never
    },
    async put(c, row) {
      const payload = c === 'profiles' ? { ...row, id: userId } : { ...row, user_id: userId }
      const { error } = await sb.from(c).upsert(payload)
      if (error) throw error
    },
    async remove(c, id) {
      const { error } = await sb.from(c).delete().eq('id', id)
      if (error) throw error
    },
    async clearAll() {
      for (const c of COLLECTIONS) {
        const { error } = await sb.from(c).delete().eq(idCol(c), userId)
        if (error) throw error
      }
    },
  }
}

// ---- reactive cache over the active backend ----
let backend: Backend | null = null
const cache = new Map<CollectionName, unknown[]>()
const listeners = new Set<() => void>()
let version = 0
const emit = () => {
  version++
  listeners.forEach((l) => l())
}

export function setBackend(b: Backend | null) {
  backend = b
  cache.clear()
  emit()
}
export function getBackend(): Backend {
  if (!backend) throw new Error('Storage not ready')
  return backend
}

async function load(c: CollectionName) {
  if (cache.has(c)) return
  cache.set(c, [])
  try {
    cache.set(c, await getBackend().list(c))
  } catch (e) {
    cache.delete(c)
    throw e
  }
  emit()
}

export const db = {
  async all<K extends CollectionName>(c: K): Promise<Collections[K][]> {
    await load(c)
    return cache.get(c) as Collections[K][]
  },
  async save<K extends CollectionName>(c: K, partial: Partial<Collections[K]> & object): Promise<Collections[K]> {
    await load(c)
    const rows = cache.get(c) as Collections[K][]
    const prev = partial.id ? rows.find((r) => r.id === partial.id) : undefined
    const row = { ...(prev ?? { id: uid(), created_at: nowIso() }), ...partial } as Collections[K]
    await getBackend().put(c, row)
    cache.set(c, prev ? rows.map((r) => (r.id === row.id ? row : r)) : [...rows, row])
    emit()
    return row
  },
  async remove(c: CollectionName, id: string) {
    await getBackend().remove(c, id)
    cache.set(c, (cache.get(c) ?? []).filter((r) => (r as { id: string }).id !== id))
    emit()
  },
  async wipe() {
    await getBackend().clearAll()
    cache.clear()
    emit()
  },
}

const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

/** React hook: live rows of a collection. */
export function useCollection<K extends CollectionName>(c: K) {
  useSyncExternalStore(subscribe, () => version)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    if (backend) load(c).catch((e) => setError(String(e?.message ?? e)))
  }, [c])
  const rows = (cache.get(c) ?? []) as Collections[K][]
  const save = useCallback((p: Partial<Collections[K]> & object) => db.save(c, p), [c])
  const remove = useCallback((id: string) => db.remove(c, id), [c])
  return { rows, loading: !cache.has(c), error, save, remove }
}

// ---- local schema migrations (lazy, idempotent, never drop data) ----
export const LOCAL_SCHEMA = 2
export async function migrateLocal(kv: KV) {
  const v = ((await kv.get('schema_version')) as number | undefined) ?? 1
  if (v >= LOCAL_SCHEMA) return
  if (v < 2) {
    // v2 Goal Worlds: per-goal theme; goal_id on journal/routine/audio (null = "General" world).
    const goals = ((await kv.get('goals')) as Collections['goals'][] | undefined) ?? []
    if (goals.length) await kv.set('goals', goals.map((g) => ({ ...g, theme: g.theme ?? defaultTheme(g.category) })))
    for (const c of ['journal_entries', 'routine_blocks', 'audio_sessions'] as const) {
      const rows = ((await kv.get(c)) as { goal_id?: string | null }[] | undefined) ?? []
      if (rows.length) await kv.set(c, rows.map((r) => ({ ...r, goal_id: r.goal_id ?? null })))
    }
  }
  await kv.set('schema_version', LOCAL_SCHEMA)
}
