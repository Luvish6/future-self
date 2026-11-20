import { playlistSteps } from './playlist'
import type { Affirmation, Visualization } from '../types'

const affs = [
  { id: 'a1', text: 'I can pause.', audio_key: null },
  { id: 'a2', text: 'I can speak.', audio_key: 'rec-2' },
] as Affirmation[]
const vizs = [{ id: 'v1', title: 'Rehearsal', script: 'Breathe [pause 3]' }] as Visualization[]

describe('playlistSteps', () => {
  it('keeps order, prefers recordings and skips deleted items', () => {
    const steps = playlistSteps({ items: [{ type: 'visualization', id: 'v1' }, { type: 'affirmation', id: 'a2' }, { type: 'affirmation', id: 'gone' }, { type: 'affirmation', id: 'a1' }] }, affs, vizs)
    expect(steps.map((s) => s.kind)).toEqual(['tts', 'audio', 'tts'])
    expect(steps[1]).toEqual({ kind: 'audio', key: 'rec-2', label: 'I can speak.' })
    expect(steps[2]).toMatchObject({ text: 'I can pause. [pause 4]' })
  })
})
