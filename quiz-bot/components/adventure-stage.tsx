"use client"

import Image from "next/image"
import { createContext, useContext, useState } from "react"
import type React from "react"

export type RideState =
  | "parked"
  | "running"
  | "left-safe"
  | "right-safe"
  | "left-lava"
  | "right-lava"

const AdventureRideContext = createContext<
  { rideState: RideState; setRideState: (state: RideState) => void } | undefined
>(undefined)

export function useAdventureRide() {
  const context = useContext(AdventureRideContext)
  if (!context) throw new Error("useAdventureRide must be used inside AdventureStage")
  return context
}

export function AdventureStage({ children }: { children: React.ReactNode }) {
  const [rideState, setRideState] = useState<RideState>("parked")
  const isLava = rideState.endsWith("lava")

  return (
    <AdventureRideContext.Provider value={{ rideState, setRideState }}>
      <div className="adventure-stage" data-ride-state={rideState}>
        <div className="adventure-panorama" aria-hidden="true" />
        <div className="adventure-vignette" aria-hidden="true" />
        <div className="adventure-speed-lines" aria-hidden="true">
          {Array.from({ length: 10 }, (_, index) => (
            <span key={index} />
          ))}
        </div>

        <div className="adventure-fork" aria-hidden="true">
          <span className="adventure-fork-left" />
          <span className="adventure-fork-right" />
        </div>

        <div className="adventure-cart" aria-hidden="true">
          <Image
            src="/adventure/mine-cart.png"
            alt=""
            width={1374}
            height={1145}
            priority
          />
        </div>

        <div className="adventure-lava-splash" aria-hidden="true">
          <span>{isLava ? "マグマへダイブ！" : ""}</span>
        </div>

        <div className="adventure-content">{children}</div>
      </div>
    </AdventureRideContext.Provider>
  )
}
