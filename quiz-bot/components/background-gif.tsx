"use client"

import { useState } from "react"

export type GifState = "wait" | "move_l" | "move_r" | "answer_true" | "answer_false"

const GIF_MAP: Record<GifState, string[]> = {
  wait: ["/gif/trocco_wait.gif"],
  move_l: ["/gif/trocco_move_l.gif"],
  move_r: ["/gif/trocco_move_r.gif"],
  answer_true: ["/gif/trocco_answer_true.gif"],
  answer_false: ["/gif/trocco_answer_false_.gif", "/gif/trocco_answer_false.gif"],
}

export function BackgroundGif({
  state,
  questionIdx,
}: {
  state: GifState
  questionIdx: number
}) {
  const [srcIdx, setSrcIdx] = useState(0)
  const [hidden, setHidden] = useState(false)

  const srcs = GIF_MAP[state]
  const src = srcs[srcIdx] ?? srcs[0]

  return hidden ? null : (
    <img
      key={`${state}-${questionIdx}-${srcIdx}`}
      src={src}
      alt=""
      onError={() => {
        if (srcIdx + 1 < srcs.length) {
          setSrcIdx(srcIdx + 1)
        } else {
          setHidden(true)
        }
      }}
      onLoad={() => {
        setHidden(false)
        setSrcIdx(0)
      }}
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover",
        opacity: 0.9,
        zIndex: -1,
        pointerEvents: "none",
      }}
    />
  )
}
