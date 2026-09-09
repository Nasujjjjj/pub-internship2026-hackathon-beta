"use client"

import { useMemo } from "react"

const ALL_PARROTS = [
  "partyparrot", "discoparrot", "fastparrot", "shuffleparrot", "hdrparrot",
  "ultrafastparrot", "aussieparrot", "loveparrot", "pizzaparrot",
  "opensourceparrot", "hamburgerparrot", "gothparrot", "dealwithitparrot",
  "middleparrot", "reverseparrot", "shufflepartyparrot",
]

function rng(seed: number) {
  let s = seed
  return () => { s = (s * 16807 + 0) % 2147483647; return s / 2147483647 }
}

interface ParrotRainProps {
  count: number
  override?: string // force all parrots to this name
}

export function ParrotRain({ count, override }: ParrotRainProps) {
  const birds = useMemo(() => {
    const r = rng(42)
    return Array.from({ length: count }, (_, i) => {
      const name = ALL_PARROTS[Math.floor(r() * ALL_PARROTS.length)]
      const left = r() * 95
      const top = r() * 85
      const size = 48 + r() * 80
      const bounceD = 0.5 + r() * 0.4
      const driftD = 4 + r() * 4
      const delay = r() * -3
      const rotate = (r() - 0.5) * 30
      const flip = r() > 0.5
      return { id: i, name, left, top, size, bounceD, driftD, delay, rotate, flip }
    })
  }, [count])

  return (
    <div className="parrot-rain-container">
      {birds.map((b) => (
        <img
          key={b.id}
          src={`/gif/party_parrot/${override ?? b.name}.gif`}
          alt=""
          className="parrot-bird"
          style={{
            left: `${b.left}%`,
            top: `${b.top}%`,
            width: `${b.size}px`,
            animationDuration: `${b.bounceD}s, ${b.driftD}s`,
            animationDelay: `${b.delay}s, ${b.delay * 1.3}s`,
            transform: `rotate(${b.rotate}deg) ${b.flip ? "scaleX(-1)" : ""}`,
          }}
        />
      ))}
    </div>
  )
}
