"use client"

import { useEffect, useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface RankingRow {
  QUESTION_ID: number
  QUESTION_TEXT: string
  TOTAL: number
  WRONG: number
  WRONG_PCT: number
}

interface AnswerRecord {
  deck: string
  correct: boolean
}

export function ResultScreen({
  score,
  total,
  answers,
  rainbow,
  dobonAt,
  onRetry,
  onTop,
}: {
  score: number
  total: number
  answers: AnswerRecord[]
  rainbow?: boolean
  dobonAt?: number | null
  onRetry: () => void
  onTop: () => void
}) {
  const [ranking, setRanking] = useState<RankingRow[]>([])
  const pt = score * 100
  const allCorrect = score === total && total > 0
  const showRainbowTitle = rainbow || allCorrect

  useEffect(() => {
    fetch("/api/ranking")
      .then((r) => r.json())
      .then((d) => { if (d.ranking) setRanking(d.ranking) })
      .catch(() => {})
  }, [])

  const deckStats = useMemo(() => {
    const map = new Map<string, { total: number; correct: number }>()
    for (const a of answers) {
      const s = map.get(a.deck) ?? { total: 0, correct: 0 }
      s.total++
      if (a.correct) s.correct++
      map.set(a.deck, s)
    }
    return Array.from(map.entries()).map(([deck, s]) => ({
      deck,
      total: s.total,
      correct: s.correct,
      pct: Math.round((s.correct / s.total) * 100),
    }))
  }, [answers])

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle
            className="text-2xl"
            style={
              showRainbowTitle
                ? {
                    background: "linear-gradient(90deg, red, orange, yellow, green, blue, indigo, violet)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }
                : undefined
            }
          >
            結果発表
          </CardTitle>
          {dobonAt != null && (
            <p className="text-destructive font-bold mt-1">ドボン：{dobonAt} 問目で終了</p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl">🌿</span>
            <p className="text-5xl font-bold tabular-nums">{pt} <span className="text-2xl">pt</span></p>
            <span className="text-2xl">🌿</span>
          </div>
          <p className="text-muted-foreground text-sm">{score} / {total} 正解</p>

          {/* Deck stats */}
          {deckStats.length > 0 && (
            <div className="text-left space-y-2 mt-4">
              <h3 className="text-sm font-semibold">デッキ別正答率</h3>
              {deckStats.map((d) => (
                <div key={d.deck} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>{d.deck}</span>
                    <span>{d.pct}% ({d.correct}/{d.total})</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${d.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Ranking */}
          {ranking.length > 0 && (
            <div className="text-left mt-4">
              <h3 className="text-sm font-semibold mb-2">みんなが外した問題 TOP5</h3>
              <div className="space-y-1">
                {ranking.map((r, i) => (
                  <div key={r.QUESTION_ID} className="flex items-start gap-2 text-xs">
                    <span className="font-bold text-muted-foreground">{i + 1}.</span>
                    <span className="flex-1">{r.QUESTION_TEXT}</span>
                    <span className="text-destructive font-semibold whitespace-nowrap">{r.WRONG_PCT}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 justify-center mt-4">
            <Button onClick={onRetry}>もう一度挑戦する</Button>
            <Button variant="outline" onClick={onTop}>トップに戻る</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
