/**
 * Optional in-app reminders. Without a push server, notifications fire only while the app
 * (or its tab) is open — the UI says so. Settings live in localStorage (device-only, non-sensitive).
 */
const KEY = 'fs:reminder'
export interface ReminderSettings { enabled: boolean; time: string; lastShown?: string }

export function getReminder(): ReminderSettings {
  try {
    return { enabled: false, time: '08:00', ...JSON.parse(localStorage.getItem(KEY) || '{}') }
  } catch {
    return { enabled: false, time: '08:00' }
  }
}
export function setReminder(r: ReminderSettings) {
  try { localStorage.setItem(KEY, JSON.stringify(r)) } catch { /* ignore */ }
}

export function startReminderLoop(getText: () => string | null) {
  const tick = () => {
    const r = getReminder()
    if (!r.enabled || typeof Notification === 'undefined' || Notification.permission !== 'granted') return
    const now = new Date()
    const today = now.toDateString()
    const [h, m] = r.time.split(':').map(Number)
    if (r.lastShown !== today && now.getHours() * 60 + now.getMinutes() >= h * 60 + m) {
      new Notification('Future Self', { body: getText() ?? 'A moment for your affirmation and today’s small step.', icon: '/icon.svg' })
      setReminder({ ...r, lastShown: today })
    }
  }
  tick()
  const id = setInterval(tick, 60_000)
  return () => clearInterval(id)
}
