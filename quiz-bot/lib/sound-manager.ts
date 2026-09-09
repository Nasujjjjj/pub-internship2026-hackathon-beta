"use client"

let audioCtx: AudioContext | null = null

function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext()
  return audioCtx
}

function playTone(freqs: number[], durEach: number) {
  const ctx = getCtx()
  const gain = ctx.createGain()
  gain.gain.value = 0.15
  gain.connect(ctx.destination)
  let t = ctx.currentTime
  for (const f of freqs) {
    const osc = ctx.createOscillator()
    osc.type = "sine"
    osc.frequency.value = f
    osc.connect(gain)
    osc.start(t)
    osc.stop(t + durEach)
    t += durEach
  }
}

async function tryPlayFile(src: string): Promise<boolean> {
  return new Promise((resolve) => {
    const audio = new Audio(src)
    audio.volume = 0.4
    audio.oncanplaythrough = () => { audio.play().then(() => resolve(true)).catch(() => resolve(false)) }
    audio.onerror = () => resolve(false)
    setTimeout(() => resolve(false), 300)
  })
}

export async function playCorrect() {
  if (!(await tryPlayFile("/sound/se_correct.mp3"))) {
    playTone([880, 1320], 0.15)
  }
}

export async function playWrong() {
  if (!(await tryPlayFile("/sound/se_wrong.mp3"))) {
    playTone([220], 0.4)
  }
}

export async function playStreak() {
  if (!(await tryPlayFile("/sound/se_streak.mp3"))) {
    playTone([660, 880, 1100], 0.12)
  }
}

let bgmAudio: HTMLAudioElement | null = null

export function startBgm() {
  if (bgmAudio) { bgmAudio.play().catch(() => {}); return }
  bgmAudio = new Audio("/sound/bgm.mp3")
  bgmAudio.loop = true
  bgmAudio.volume = 0.25
  bgmAudio.play().catch(() => {})
}

export function stopBgm() {
  if (bgmAudio) { bgmAudio.pause(); bgmAudio.currentTime = 0 }
}

export function setMuted(muted: boolean) {
  if (bgmAudio) bgmAudio.muted = muted
}
