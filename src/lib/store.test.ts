import { db, localBackend, setBackend, supabaseBackend, type KV } from './store'
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
