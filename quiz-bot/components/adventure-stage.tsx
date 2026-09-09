"use client"

import { createContext, useContext, useState } from "react"
import type React from "react"

export type RideState =
  | "parked"
  | "running"
  | "left-safe"
  | "right-safe"
  | "left-lava"
  | "right-lava"

export type CartVariant = "normal" | "parrot"

interface AdventureRideValue {
  rideState: RideState
  setRideState: (state: RideState) => void
  cartVariant: CartVariant
  setCartVariant: (v: CartVariant) => void
}

const AdventureRideContext = createContext<AdventureRideValue | undefined>(undefined)

export function useAdventureRide() {
  const context = useContext(AdventureRideContext)
  if (!context) throw new Error("useAdventureRide must be used inside AdventureStage")
  return context
}

function TanakaRider() {
  const [show, setShow] = useState(true)
  if (!show) return null
  return (
    <img
      src="/adventure/tanaka.png"
      alt=""
      onError={() => setShow(false)}
      style={{ position: "absolute", bottom: "85%", left: "50%", transform: "translateX(-50%)", width: "120px", animation: "parrot-bounce 0.8s ease-in-out infinite alternate" }}
    />
  )
}

const CART_SRC: Record<CartVariant, string> = {
  normal: "/adventure/cart.png",
  parrot: "/adventure/cart-parrot.gif",
}

export function AdventureStage({ children }: { children: React.ReactNode }) {
  const [rideState, setRideState] = useState<RideState>("parked")
  const [cartVariant, setCartVariant] = useState<CartVariant>("normal")
  const isLava = rideState.endsWith("lava")

  return (
    <AdventureRideContext.Provider value={{ rideState, setRideState, cartVariant, setCartVariant }}>
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
          {cartVariant === "parrot" && <TanakaRider />}
          <img
            src={CART_SRC[cartVariant]}
            alt=""
            style={{ width: "100%", height: "auto" }}
          />
        </div>

        <div className="adventure-lava-splash" aria-hidden="true">
          <span>{isLava ? "DIVE INTO MAGMA!" : ""}</span>
        </div>

        <div className="adventure-content">{children}</div>
      </div>
    </AdventureRideContext.Provider>
  )
}
