import { lazy, Suspense, useEffect } from 'react'
import { startReminderLoop } from './lib/reminders'
import { BrowserRouter, Route, Routes, Link } from 'react-router-dom'
import { Layout, NAV } from './components/Layout'
import { Icon } from './components/Icon'
import { Page } from './components/ui'
import { SessionProvider, useSession } from './lib/session'
import Dashboard from './features/dashboard/Dashboard'

const Onboarding = lazy(() => import('./features/onboarding/Onboarding'))
const Goals = lazy(() => import('./features/goals/Goals'))
const NewGoal = lazy(() => import('./features/goals/NewGoal'))
const World = lazy(() => import('./features/worlds/World'))
const Affirmations = lazy(() => import('./features/affirmations/Affirmations'))
const Visualize = lazy(() => import('./features/visualize/Visualize'))
const Advisor = lazy(() => import('./features/advisor/Advisor'))
const Habits = lazy(() => import('./features/habits/Habits'))
const Routine = lazy(() => import('./features/routine/Routine'))
const NightAudio = lazy(() => import('./features/audio/NightAudio'))
const Journal = lazy(() => import('./features/journal/Journal'))
const Vision = lazy(() => import('./features/vision/VisionBoard'))
const ProgressPage = lazy(() => import('./features/progress/ProgressPage'))
const Settings = lazy(() => import('./features/settings/Settings'))

function More() {
  return (
    <Page title="More">
      <ul className="grid grid-cols-2 gap-3">
        {NAV.filter((n) => !n.primary).map((n) => (
          <li key={n.to}>
            <Link to={n.to} className="flex flex-col gap-3 rounded-2xl border border-line bg-surface/80 p-4 transition hover:border-accent">
              <span className="grid size-10 place-items-center rounded-full bg-accent-soft text-accent"><Icon name={n.icon} /></span>
              <span className="font-medium">{n.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </Page>
  )
}

function Gate() {
  const { ready } = useSession()
  useEffect(() => startReminderLoop(() => null), [])
  if (!ready) return <div className="grid min-h-dvh place-items-center text-muted">Loading…</div>
  return (
    <Suspense fallback={<div className="p-8 text-muted">Loading…</div>}>
      <Routes>
        <Route path="/onboarding" element={<Onboarding />} />
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="goals" element={<Goals />} />
          <Route path="goals/new" element={<NewGoal />} />
          <Route path="g/:goalId" element={<World />} />
          <Route path="affirmations" element={<Affirmations />} />
          <Route path="visualize" element={<Visualize />} />
          <Route path="advisor" element={<Advisor />} />
          <Route path="habits" element={<Habits />} />
          <Route path="routine" element={<Routine />} />
          <Route path="audio" element={<NightAudio />} />
          <Route path="journal" element={<Journal />} />
          <Route path="vision" element={<Vision />} />
          <Route path="progress" element={<ProgressPage />} />
          <Route path="settings" element={<Settings />} />
          <Route path="more" element={<More />} />
          <Route path="*" element={<Page title="Not found"><Link className="text-accent" to="/">Go home</Link></Page>} />
        </Route>
      </Routes>
    </Suspense>
  )
}

export default function App() {
  return (
    <SessionProvider>
      <BrowserRouter>
        <Gate />
      </BrowserRouter>
    </SessionProvider>
  )
}
