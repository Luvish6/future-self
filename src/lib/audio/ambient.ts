/**
 * Procedurally generated background sounds via Web Audio — no downloaded assets, no licensing issues.
 */
export type Ambient = 'none' | 'rain' | 'ocean' | 'brown' | 'pink'
export const AMBIENTS: { value: Ambient; label: string }[] = [
  { value: 'none', label: 'Silence' },
  { value: 'rain', label: 'Rain' },
  { value: 'ocean', label: 'Ocean' },
  { value: 'brown', label: 'Deep' },
  { value: 'pink', label: 'Soft' },
]

function noiseBuffer(ctx: AudioContext, kind: 'brown' | 'pink' | 'white') {
  const len = ctx.sampleRate * 4
  const buf = ctx.createBuffer(2, len, ctx.sampleRate)
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch)
    let last = 0, b0 = 0, b1 = 0, b2 = 0
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1
      if (kind === 'brown') {
        last = (last + 0.02 * w) / 1.02
        d[i] = last * 3.5
      } else if (kind === 'pink') {
        b0 = 0.997 * b0 + w * 0.029591
        b1 = 0.985 * b1 + w * 0.032534
        b2 = 0.95 * b2 + w * 0.048056
        d[i] = (b0 + b1 + b2 + w * 0.05) * 0.6
      } else d[i] = w * 0.4
    }
  }
  return buf
}

export function createAmbient() {
  let ctx: AudioContext | null = null
  let master: GainNode | null = null
  let nodes: AudioNode[] = []
  let vol = 0.4

  const stopNodes = () => {
    nodes.forEach((n) => {
      try { (n as AudioScheduledSourceNode).stop?.() } catch { /* already stopped */ }
      n.disconnect()
    })
    nodes = []
  }

  return {
    async play(kind: Ambient) {
      stopNodes()
      if (kind === 'none') return
      ctx ??= new AudioContext()
      await ctx.resume()
      if (!master) {
        master = ctx.createGain()
        master.connect(ctx.destination)
      }
      master.gain.value = vol
      const src = ctx.createBufferSource()
      src.buffer = noiseBuffer(ctx, kind === 'rain' ? 'white' : kind === 'ocean' ? 'pink' : kind)
      src.loop = true
      const filter = ctx.createBiquadFilter()
      filter.type = kind === 'rain' ? 'bandpass' : 'lowpass'
      filter.frequency.value = kind === 'rain' ? 2500 : kind === 'ocean' ? 700 : 900
      filter.Q.value = kind === 'rain' ? 0.4 : 0.7
      const g = ctx.createGain()
      g.gain.value = kind === 'rain' ? 0.5 : 1
      src.connect(filter).connect(g).connect(master)
      nodes.push(src, filter, g)
      if (kind === 'ocean') {
        // Slow LFO swells imitate waves (~10s cycle).
        const lfo = ctx.createOscillator()
        const depth = ctx.createGain()
        lfo.frequency.value = 0.1
        depth.gain.value = 0.45
        g.gain.value = 0.55
        lfo.connect(depth).connect(g.gain)
        lfo.start()
        nodes.push(lfo, depth)
      }
      src.start()
    },
    setVolume(v: number) {
      vol = v
      if (master && ctx) master.gain.setTargetAtTime(v, ctx.currentTime, 0.1)
    },
    fadeOut(seconds: number) {
      if (master && ctx) master.gain.setTargetAtTime(0, ctx.currentTime, seconds / 4)
      setTimeout(stopNodes, seconds * 1000)
    },
    stop: stopNodes,
    close() {
      stopNodes()
      ctx?.close()
      ctx = null
      master = null
    },
  }
}
