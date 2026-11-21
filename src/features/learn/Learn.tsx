import { Link } from 'react-router-dom'
import { Card, Page } from '../../components/ui'

type Topic = { title: string; works: string; limits: string; tryIt: { label: string; to: string }; sources: string }

/** Plain-language research summaries. Keep claims modest and sourced (see AGENTS.md content rules). */
const TOPICS: Topic[] = [
  {
    title: 'Neuroplasticity',
    works: 'Your brain physically adapts to what you repeatedly do. Learning to juggle increased grey matter in motion-processing areas within months, and London taxi drivers who memorised the city showed differences in the hippocampus. Repetition, attention and effort drive the change.',
    limits: 'Change comes from practice, not from passively hearing words. Sleep matters because it consolidates what you practised while awake.',
    tryIt: { label: 'Build a small daily habit', to: '/habits' },
    sources: 'Draganski et al., 2004 (Nature); Maguire et al., 2000 (PNAS); Walker & Stickgold, 2006 (Annual Review of Psychology).',
  },
  {
    title: 'Meditation & mindfulness',
    works: 'A large review of randomised trials found mindfulness meditation programmes give moderate improvements in anxiety, depression and pain. Slow breathing with longer exhales can help the body settle.',
    limits: 'Effects are similar in size to other active approaches (like exercise), and it isn’t a replacement for professional care.',
    tryIt: { label: 'Try a guided meditation', to: '/audio' },
    sources: 'Goyal et al., 2014 (JAMA Internal Medicine); Zaccaro et al., 2018 (Frontiers in Human Neuroscience).',
  },
  {
    title: 'Visualization & mental rehearsal',
    works: 'Mentally practising a skill improves real performance, especially for tasks with a thinking or planning component. Picturing the steps — including obstacles and how you’ll respond — works better than picturing only the happy ending.',
    limits: 'Fantasising only about the outcome can lower energy and effort. Rehearse the process, then act.',
    tryIt: { label: 'Rehearse in the Simulator', to: '/simulate' },
    sources: 'Driskell, Copper & Moran, 1994 (Journal of Applied Psychology); Oettingen, 2012 (European Review of Social Psychology); Taylor et al., 1998.',
  },
  {
    title: 'If-then plans & WOOP',
    works: '“If X happens, then I will do Y” plans roughly double follow-through on goals in many studies (a medium-to-large average effect). Mental contrasting — imagining the goal, then the real obstacle — strengthens commitment to goals that are achievable.',
    limits: 'Plans need to be specific and realistic; vague intentions don’t get the same benefit.',
    tryIt: { label: 'Add a cue to a habit', to: '/habits' },
    sources: 'Gollwitzer & Sheeran, 2006 (Advances in Experimental Social Psychology); Oettingen & Gollwitzer, 2010.',
  },
  {
    title: 'Affirmations',
    works: 'Self-affirmation — reflecting on your core values — can reduce defensiveness and stress and help people engage with difficult goals.',
    limits: 'Extreme positive statements (“I am perfect”) can make people with low self-esteem feel worse. Believable, growth-focused wording (“I’m learning to…”) works better — that’s why this app nudges you that way.',
    tryIt: { label: 'Write a believable affirmation', to: '/affirmations' },
    sources: 'Cohen & Sherman, 2014 (Annual Review of Psychology); Wood, Perunovic & Lee, 2009 (Psychological Science).',
  },
  {
    title: 'Sleep & listening at night',
    works: 'Sleep strengthens memories formed during the day, and cues replayed during sleep can modestly boost memories you already learned while awake (“targeted memory reactivation”). Calm audio at bedtime can make winding down easier.',
    limits: 'There’s no good evidence that hearing new affirmations while asleep changes your beliefs or rewires your brain. Use night audio to relax and reinforce what you practise by day.',
    tryIt: { label: 'Open night audio', to: '/audio' },
    sources: 'Hu et al., 2020 (Psychological Bulletin); Rasch & Born, 2013 (Physiological Reviews).',
  },
  {
    title: 'Manifestation',
    works: 'The useful parts of “manifesting” — getting clear on what you want, believing you can improve, and noticing opportunities — overlap with goal setting and self-efficacy, which are well supported.',
    limits: 'Thoughts don’t attract outcomes on their own. One study found people who strongly believed in manifesting expected more success but were also more drawn to risky financial choices. Pair intentions with action.',
    tryIt: { label: 'Turn a wish into a plan', to: '/goals/new' },
    sources: 'Dixon et al., 2023 (Personality and Social Psychology Bulletin); Bandura, 1997 (Self-efficacy).',
  },
]

export default function Learn() {
  return (
    <Page title="The science" subtitle="What research actually says about the ideas behind this app — the useful parts and the limits.">
      <ul className="space-y-4">
        {TOPICS.map((t) => (
          <Card as="li" key={t.title} className="space-y-3">
            <h2 className="text-xl">{t.title}</h2>
            <p><span className="font-semibold">What the evidence supports: </span>{t.works}</p>
            <p><span className="font-semibold">Limits: </span>{t.limits}</p>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Link to={t.tryIt.to} className="text-sm font-medium text-accent">{t.tryIt.label} →</Link>
              <p className="text-xs text-muted">Sources: {t.sources}</p>
            </div>
          </Card>
        ))}
      </ul>
      <p className="text-sm text-muted">These are short summaries for general education, not medical or psychological advice.</p>
    </Page>
  )
}
