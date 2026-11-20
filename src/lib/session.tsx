import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { idb } from './idb'
import { localBackend, migrateLocal, setBackend, supabaseBackend, type KV } from './store'
import { COLLECTIONS } from './types'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
export const supabase: SupabaseClient | null = url && key ? createClient(url, key) : null

const idbKV: KV = {
  get: (k) => idb.get('kv', k),
  set: (k, v) => idb.set('kv', k, v),
  clear: () => idb.clear('kv'),
}
export const local = localBackend(idbKV)

interface SessionCtx {
  ready: boolean
  mode: 'local' | 'cloud'
  email: string | null
  cloudAvailable: boolean
  signIn(email: string, password: string): Promise<void>
  signUp(email: string, password: string): Promise<void>
  signOut(): Promise<void>
  copyDeviceDataToCloud(): Promise<number>
  deleteCloudAccount(): Promise<void>
}
const Ctx = createContext<SessionCtx | null>(null)

export function SessionProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [user, setUser] = useState<{ id: string; email: string | null } | null>(null)

  useEffect(() => {
    let unsub = () => {}
    const migrated = migrateLocal(idbKV).catch((e) => console.error('Local migration failed', e))
    if (!supabase) {
      migrated.then(() => {
        setBackend(local)
        setReady(true)
      })
      return
    }
    const apply = (u: { id: string; email?: string } | null | undefined) => {
      setUser(u ? { id: u.id, email: u.email ?? null } : null)
      setBackend(u ? supabaseBackend(supabase!, u.id) : local)
      setReady(true)
    }
    migrated.then(() => {
      supabase!.auth.getSession().then(({ data }) => apply(data.session?.user))
      const { data } = supabase!.auth.onAuthStateChange((_e, s) => apply(s?.user))
      unsub = () => data.subscription.unsubscribe()
    })
    return () => unsub()
  }, [])

  const need = () => {
    if (!supabase) throw new Error('Cloud sync is not configured.')
    return supabase
  }
  const value: SessionCtx = {
    ready,
    mode: user ? 'cloud' : 'local',
    email: user?.email ?? null,
    cloudAvailable: !!supabase,
    async signIn(email, password) {
      const { error } = await need().auth.signInWithPassword({ email, password })
      if (error) throw error
    },
    async signUp(email, password) {
      const { error } = await need().auth.signUp({ email, password })
      if (error) throw error
    },
    async signOut() {
      await need().auth.signOut()
    },
    async copyDeviceDataToCloud() {
      if (!user) throw new Error('Sign in first.')
      const cloud = supabaseBackend(need(), user.id)
      let n = 0
      for (const c of COLLECTIONS) {
        for (const row of await local.list(c)) {
          await cloud.put(c, row)
          n++
        }
      }
      return n
    },
    async deleteCloudAccount() {
      const sb = need()
      // Security-definer RPC deletes auth.users row; ON DELETE CASCADE removes all user data.
      const { error } = await sb.rpc('delete_my_account')
      if (error) throw error
      await sb.auth.signOut()
    },
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useSession() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useSession outside provider')
  return c
}
