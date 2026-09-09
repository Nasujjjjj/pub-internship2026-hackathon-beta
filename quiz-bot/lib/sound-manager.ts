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
const activeSE: HTMLAudioElement[] = []

export function preloadAll() {
  for (const src of ["/sound/se_correct.mp3", "/sound/se_wrong.mp3", "/sound/se_decide.mp3"]) {
    if (!preloaded.has(src)) {
      const a = new Audio(src)
      a.preload = "auto"
      a.load()
      preloaded.set(src, a)
    }
  }
}

function stopAllSE() {
  for (const a of activeSE) { a.pause(); a.currentTime = 0 }
  activeSE.length = 0
}

function playSE(src: string, volume = 0.4): Promise<boolean> {
  return new Promise((resolve) => {
    if (globalMuted) { resolve(false); return }
    stopAllSE()
    duckBgm()
    const cached = preloaded.get(src)
    if (cached && cached.readyState >= 2) {
      const clone = cached.cloneNode() as HTMLAudioElement
      clone.volume = volume
      activeSE.push(clone)
      clone.play().then(() => resolve(true)).catch(() => resolve(false))
      return
    }
    const audio = new Audio(src)
    audio.volume = volume
    activeSE.push(audio)
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
  if (!(await playSE("/sound/se_correct.mp3", 0.8))) playTone([880, 1320], 0.15)
}

export async function playWrong() {
  if (globalMuted) return
  if (!(await playSE("/sound/se_wrong.mp3", 1.0))) playTone([220], 0.4)
}

export async function playDecide() {
  if (globalMuted) return
  if (!(await playSE("/sound/se_decide.mp3", 0.5))) playTone([440, 660], 0.08)
}

// --- BGM (2 tracks) ---

const BGM_VOL = 0.7
const BGM_DUCK_VOL = 0.35
const BGM_DUCK_MS = 1000

let bgmGame: HTMLAudioElement | null = null
let bgmMenu: HTMLAudioElement | null = null
let duckTimer: ReturnType<typeof setTimeout> | null = null

function duckBgm() {
  if (bgmGame && !bgmGame.paused) bgmGame.volume = BGM_DUCK_VOL
  if (bgmMenu && !bgmMenu.paused) bgmMenu.volume = BGM_DUCK_VOL
  if (duckTimer) clearTimeout(duckTimer)
  duckTimer = setTimeout(() => {
    if (bgmGame && !bgmGame.paused) bgmGame.volume = BGM_VOL
    if (bgmMenu && !bgmMenu.paused) bgmMenu.volume = BGM_VOL
  }, BGM_DUCK_MS)
}

function stopTrack(track: HTMLAudioElement | null) {
  if (track) { track.pause(); track.currentTime = 0 }
}

export function startBgmGame() {
  stopTrack(bgmMenu)
  if (!bgmGame) {
    bgmGame = new Audio("/sound/bgm.mp3")
    bgmGame.loop = true
  }
  bgmGame.volume = BGM_VOL
  bgmGame.muted = globalMuted
  bgmGame.play().catch(() => {})
}

export function startBgmMenu() {
  stopTrack(bgmGame)
  if (!bgmMenu) {
    bgmMenu = new Audio("/sound/bgm_menu.mp3")
    bgmMenu.loop = true
  }
  bgmMenu.volume = BGM_VOL
  bgmMenu.muted = globalMuted
  bgmMenu.play().catch(() => {})
}

export function stopAllBgm() {
  stopTrack(bgmGame)
  stopTrack(bgmMenu)
}

export function setMuted(muted: boolean) {
  globalMuted = muted
  if (bgmGame) bgmGame.muted = muted
  if (bgmMenu) bgmMenu.muted = muted
}
