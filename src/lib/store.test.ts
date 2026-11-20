import { db, LOCAL_SCHEMA, localBackend, migrateLocal, setBackend, supabaseBackend, type KV } from './store'
import type { SupabaseClient } from '@supabase/supabase-js'

const memKV = (): KV => {
  const m = new Map<string, unknown>()
  return { get: async (k) => structuredClone(m.get(k)), set: async (k, v) => void m.set(k, structuredClone(v)), clear: async () => m.clear() }
}

describe('db over local backend', () => {
  beforeEach(() => setBackend(localBackend(memKV())))

  it('creates, updates, removes and wipes', async () => {
    const g = await db.save('goals', { title: 'Run 5k' })
    expect(g.id).toBeTruthy()
    expect(g.created_at).toBeTruthy()
    await db.save('goals', { id: g.id, title: 'Run 10k' })
    expect((await db.all('goals')).map((x) => x.title)).toEqual(['Run 10k'])
    await db.remove('goals', g.id)
    expect(await db.all('goals')).toHaveLength(0)
    await db.save('journal_entries', { body: 'x' })
    await db.wipe()
    expect(await db.all('journal_entries')).toHaveLength(0)
  })
})

describe('supabase backend', () => {
  it('always scopes writes to the signed-in user (RLS also enforces this)', async () => {
    const calls: { table: string; payload?: unknown; eq?: [string, string] }[] = []
    const sb = {
      from: (table: string) => ({
        upsert: async (payload: unknown) => (calls.push({ table, payload }), { error: null }),
        delete: () => ({ eq: async (c: string, v: string) => (calls.push({ table, eq: [c, v] }), { error: null }) }),
      }),
    } as unknown as SupabaseClient
    const b = supabaseBackend(sb, 'user-1')
    await b.put('goals', { id: 'g', user_id: 'attacker' } as never)
    await b.put('profiles', { id: 'someone-else' } as never)
    await b.clearAll()
    expect(calls[0].payload).toMatchObject({ user_id: 'user-1' })
    expect(calls[1].payload).toMatchObject({ id: 'user-1' })
    expect(calls.find((c) => c.table === 'profiles' && c.eq)?.eq).toEqual(['id', 'user-1'])
    expect(calls.find((c) => c.table === 'goals' && c.eq)?.eq).toEqual(['user_id', 'user-1'])
  })
})

describe('migrateLocal', () => {
  it('upgrades v1 data in place without losing rows, and is idempotent', async () => {
    const kv = memKV()
    await kv.set('goals', [{ id: 'g1', title: 'Save', category: 'finance' }, { id: 'g2', title: 'X', category: 'general', theme: 'love' }])
    await kv.set('journal_entries', [{ id: 'j1', body: 'hi' }])
    await migrateLocal(kv)
    const goals = (await kv.get('goals')) as { theme: string }[]
    expect(goals.map((g) => g.theme)).toEqual(['finance', 'love'])
    expect(await kv.get('journal_entries')).toEqual([{ id: 'j1', body: 'hi', goal_id: null }])
    expect(await kv.get('schema_version')).toBe(LOCAL_SCHEMA)
    await kv.set('goals', [{ id: 'g3', category: 'love' }])
    await migrateLocal(kv) // already migrated: no-op
    expect(await kv.get('goals')).toEqual([{ id: 'g3', category: 'love' }])
  })
})

describe('concurrent writes', () => {
  it('keeps every row when saves overlap', async () => {
    const kv = memKV()
    setBackend(localBackend(kv))
    await Promise.all([1, 2, 3, 4, 5].map((n) => db.save('journal_entries', { body: `e${n}` })))
    expect((await db.all('journal_entries')).length).toBe(5)
    expect(((await kv.get('journal_entries')) as unknown[]).length).toBe(5)
  })
})
