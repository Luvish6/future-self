import { useState } from 'react'
import { Button, Card, Field, Notice, Page, Section, Segmented } from '../../components/ui'
import { useSession } from '../../lib/session'
import { useProfile } from '../../lib/hooks'
import { db } from '../../lib/store'
import { idb } from '../../lib/idb'
import { COLLECTIONS } from '../../lib/types'
import { getTheme, setTheme, type Theme } from '../../lib/theme'
import { cleanText } from '../../lib/util'
import { CRISIS_MESSAGE } from '../../lib/engine/safety'

function CloudAccount() {
  const s = useSession()
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const run = async (fn: () => Promise<unknown>, ok: string) => {
    setBusy(true)
    setMsg('')
    try { await fn(); setMsg(ok) } catch (e) { setMsg((e as Error).message) } finally { setBusy(false) }
  }

  if (!s.cloudAvailable)
    return <p className="text-sm text-muted">Everything is stored privately on this device. Cloud sync can be enabled by whoever hosts this app (Supabase configuration).</p>
  if (s.mode === 'cloud')
    return (
      <div className="space-y-3">
        <p className="text-sm">Signed in as <span className="font-medium">{s.email}</span>. Your data syncs to your private account (row-level security: only you can read it). Voice recordings still stay on this device.</p>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="soft" disabled={busy} onClick={() => run(async () => setMsg(`Copied ${await s.copyDeviceDataToCloud()} items.`), '')}>Copy this device’s data to my account</Button>
          <Button size="sm" variant="ghost" onClick={() => run(s.signOut, 'Signed out.')}>Sign out</Button>
          <Button size="sm" variant="danger" disabled={busy} onClick={() => confirm('Permanently delete your cloud account and all synced data? This cannot be undone.') && run(s.deleteCloudAccount, 'Account deleted.')}>Delete cloud account</Button>
        </div>
        {msg && <p role="status" className="text-sm text-muted">{msg}</p>}
      </div>
    )
  return (
    <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); run(() => s.signIn(email, pw), 'Signed in.') }}>
      <p className="text-sm text-muted">Optional: sign in to sync across devices. Without an account, data stays on this device only.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Email">{(id) => <input id={id} type="email" autoComplete="email" className="field" required value={email} onChange={(e) => setEmail(e.target.value)} />}</Field>
        <Field label="Password" hint="At least 8 characters.">{(id) => <input id={id} type="password" autoComplete="current-password" minLength={8} className="field" required value={pw} onChange={(e) => setPw(e.target.value)} />}</Field>
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={busy}>Sign in</Button>
        <Button size="sm" variant="soft" disabled={busy || pw.length < 8 || !email} onClick={() => run(() => s.signUp(email, pw), 'Check your email to confirm your account.')}>Create account</Button>
      </div>
      {msg && <p role="status" className="text-sm text-muted">{msg}</p>}
    </form>
  )
}

export default function Settings() {
  const { profile, saveProfile } = useProfile()
  const { mode } = useSession()
  const [theme, setT] = useState<Theme>(getTheme())
  const [name, setName] = useState(profile?.display_name ?? '')
  const [status, setStatus] = useState('')

  const exportData = async () => {
    const data: Record<string, unknown> = { exported_at: new Date().toISOString(), app: 'future-self', version: 1 }
    for (const c of COLLECTIONS) data[c] = await db.all(c)
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }))
    const a = Object.assign(document.createElement('a'), { href: url, download: `future-self-${new Date().toISOString().slice(0, 10)}.json` })
    a.click()
    URL.revokeObjectURL(url)
  }
  const importData = async (file: File) => {
    try {
      if (file.size > 20 * 1024 * 1024) throw new Error('File too large.')
      const data = JSON.parse(await file.text())
      if (data?.app !== 'future-self') throw new Error('Not a Future Self export.')
      let n = 0
      for (const c of COLLECTIONS) {
        if (!Array.isArray(data[c])) continue
        for (const row of data[c]) if (row && typeof row.id === 'string') { await db.save(c, row); n++ }
      }
      setStatus(`Imported ${n} items.`)
    } catch (e) {
      setStatus(`Import failed: ${(e as Error).message}`)
    }
  }
  const wipe = async () => {
    if (!confirm(`Delete ALL your Future Self data${mode === 'cloud' ? ' in your cloud account' : ' on this device'}? This cannot be undone. Consider exporting first.`)) return
    await db.wipe()
    await idb.clear('blobs')
    try { Object.keys(localStorage).filter((k) => k.startsWith('fs:')).forEach((k) => localStorage.removeItem(k)) } catch { /* ignore */ }
    setStatus('All data deleted.')
  }

  return (
    <Page title="Settings & privacy">
      <Section title="Appearance">
        <Segmented label="Theme" value={theme} onChange={(t) => { setT(t); setTheme(t) }} options={[{ value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }, { value: 'system', label: 'System' }]} />
      </Section>

      <Section title="Profile">
        <Card>
          <form className="flex items-end gap-2" onSubmit={(e) => { e.preventDefault(); saveProfile({ display_name: cleanText(name, 80) }).then(() => setStatus('Name saved.')) }}>
            <div className="flex-1"><Field label="Display name">{(id) => <input id={id} className="field" maxLength={80} value={name} onChange={(e) => setName(e.target.value)} />}</Field></div>
            <Button type="submit" variant="soft">Save</Button>
          </form>
        </Card>
      </Section>

      <Section title="Account & sync"><Card><CloudAccount /></Card></Section>

      <Section title="Your data">
        <Card className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="soft" onClick={exportData}>Export all data (JSON)</Button>
            <label className="inline-flex cursor-pointer items-center rounded-full px-3 py-1.5 text-sm text-muted hover:bg-surface-2 hover:text-ink">
              Import…<input type="file" accept="application/json" className="sr-only" onChange={(e) => e.target.files?.[0] && importData(e.target.files[0])} />
            </label>
            <Button size="sm" variant="danger" onClick={wipe}>Delete all data</Button>
          </div>
          <p className="text-xs text-muted">Exports don’t include voice recordings. Deleting removes journals, goals, habits, recordings and settings{mode === 'cloud' ? ' from your account' : ' from this browser'}.</p>
          {status && <p role="status" className="text-sm">{status}</p>}
        </Card>
      </Section>

      <Section title="Privacy">
        <Card className="space-y-2 text-sm leading-relaxed">
          <p><strong>What we store:</strong> only what you enter — goals, answers, habits, journal entries, vision board items and session history.</p>
          <p><strong>Where:</strong> by default in this browser (IndexedDB). If you sign in, in your private Supabase account protected by row-level security. Voice recordings never leave this device.</p>
          <p><strong>AI:</strong> the Advisor and all personalization run locally using templates. Nothing is sent to any AI provider.</p>
          <p><strong>No tracking:</strong> no analytics, ads or third-party trackers.</p>
          <p><strong>Shared devices:</strong> anyone with access to this browser profile can open local data. Use a private profile or cloud sign-in on shared devices.</p>
        </Card>
      </Section>

      <Section title="About">
        <Card className="space-y-2 text-sm leading-relaxed">
          <p>Future Self is a free personal-development tool drawing on evidence-informed ideas: self-efficacy, implementation intentions, mental contrasting (WOOP), mental rehearsal, habit formation and future-self continuity.</p>
          <p>It does not guarantee outcomes and is not medical, psychological, or financial advice or treatment. Visualization and affirmations can support motivation and planning; they don’t make goals happen on their own.</p>
        </Card>
        <div className="mt-3"><Notice tone="warn">{CRISIS_MESSAGE}</Notice></div>
      </Section>
    </Page>
  )
}
