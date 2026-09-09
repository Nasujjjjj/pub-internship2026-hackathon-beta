"use client"

let audioCtx: AudioContext | null = null
let globalMuted = false

function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext()
  return audioCtx
}

function playTone(freqs: number[], durEach: number) {
  if (globalMuted) return
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

const preloaded = new Map<string, HTMLAudioElement>()

export function preloadAll() {
  const files = ["/sound/se_correct.mp3", "/sound/se_wrong.mp3", "/sound/se_streak.mp3", "/sound/se_decide.mp3", "/sound/se_reveal.mp3"]
  for (const src of files) {
    if (!preloaded.has(src)) {
      const a = new Audio(src)
      a.preload = "auto"
      a.load()
      preloaded.set(src, a)
    }
  }
}

function tryPlayFile(src: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (globalMuted) { resolve(false); return }
    const cached = preloaded.get(src)
    if (cached && cached.readyState >= 2) {
      const clone = cached.cloneNode() as HTMLAudioElement
      clone.volume = 0.4
      clone.play().then(() => resolve(true)).catch(() => resolve(false))
      return
    }
    const audio = new Audio(src)
    audio.volume = 0.4
    let resolved = false
    const timer = setTimeout(() => {
      if (!resolved) { resolved = true; audio.oncanplaythrough = null; resolve(false) }
    }, 1500)
    audio.oncanplaythrough = () => {
      if (!resolved) { resolved = true; clearTimeout(timer); audio.play().then(() => resolve(true)).catch(() => resolve(false)) }
    }
    audio.onerror = () => {
      if (!resolved) { resolved = true; clearTimeout(timer); resolve(false) }
    }
  })
}

export async function playCorrect() {
  if (globalMuted) return
  if (!(await tryPlayFile("/sound/se_correct.mp3"))) playTone([880, 1320], 0.15)
}

export async function playWrong() {
  if (globalMuted) return
  if (!(await tryPlayFile("/sound/se_wrong.mp3"))) playTone([220], 0.4)
}

export async function playStreak() {
  if (globalMuted) return
  if (!(await tryPlayFile("/sound/se_streak.mp3"))) playTone([660, 880, 1100], 0.12)
}

export async function playDecide() {
  if (globalMuted) return
  if (!(await tryPlayFile("/sound/se_decide.mp3"))) playTone([440, 660], 0.08)
}

export async function playReveal() {
  if (globalMuted) return
  if (!(await tryPlayFile("/sound/se_reveal.mp3"))) playTone([330], 0.2)
}

// --- BGM (2 tracks) ---

let bgmGame: HTMLAudioElement | null = null
let bgmMenu: HTMLAudioElement | null = null

function stopTrack(track: HTMLAudioElement | null) {
  if (track) { track.pause(); track.currentTime = 0 }
}

export function startBgmGame() {
  stopTrack(bgmMenu)
  if (!bgmGame) {
    bgmGame = new Audio("/sound/bgm.mp3")
    bgmGame.loop = true
    bgmGame.volume = 0.25
  }
  bgmGame.muted = globalMuted
  bgmGame.play().catch(() => {})
}

export function startBgmMenu() {
  stopTrack(bgmGame)
  if (!bgmMenu) {
    bgmMenu = new Audio("/sound/bgm_menu.mp3")
    bgmMenu.loop = true
    bgmMenu.volume = 0.2
  }
  bgmMenu.muted = globalMuted
  bgmMenu.play().catch(() => {})
}

export function stopAllBgm() {
  stopTrack(bgmGame)
  stopTrack(bgmMenu)
}

// Legacy aliases
export function startBgm() { startBgmGame() }
export function stopBgm() { stopAllBgm() }

export function setMuted(muted: boolean) {
  globalMuted = muted
  if (bgmGame) bgmGame.muted = muted
  if (bgmMenu) bgmMenu.muted = muted
}
