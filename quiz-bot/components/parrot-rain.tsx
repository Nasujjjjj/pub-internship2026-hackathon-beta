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
  override?: string
}

export function ParrotRain({ count, override }: ParrotRainProps) {
  const birds = useMemo(() => {
    const r = rng(42)
    const small = Math.round(count * 0.625)  // 25/40
    const mid = Math.round(count * 0.25)      // 10/40
    const big = count - small - mid            // 5/40

    return Array.from({ length: count }, (_, i) => {
      const name = ALL_PARROTS[Math.floor(r() * ALL_PARROTS.length)]
      const left = r() * 95
      const top = r() * 85

      let size: number
      let tier: "small" | "mid" | "big"
      if (i < small) {
        size = 24 + r() * 56    // 24–80
        tier = "small"
      } else if (i < small + mid) {
        size = 100 + r() * 100  // 100–200
        tier = "mid"
      } else {
        size = 260 + r() * 160  // 260–420
        tier = "big"
      }

      // smaller = faster bounce
      const bounceD = 0.3 + (size / 420) * 0.6   // 0.3s–0.9s
      const driftD = 3 + (size / 420) * 5         // 3s–8s
      const delay = r() * -3
      const rotate = (r() - 0.5) * 30
      const flip = r() > 0.5
      // z-index inversely proportional to size: small on top, big behind
      const z = tier === "big" ? 0 : tier === "mid" ? 1 : 2
      const opacity = tier === "big" ? 0.5 : 1

      return { id: i, name, left, top, size, bounceD, driftD, delay, rotate, flip, z, opacity }
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
            zIndex: b.z,
            opacity: b.opacity,
          }}
        />
      ))}
    </div>
  )
}
