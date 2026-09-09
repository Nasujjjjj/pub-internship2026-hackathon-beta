"use client"

import { useState, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Mascot } from "@/components/mascot"
import { useAdventureRide, type RideState } from "@/components/adventure-stage"
import { dummyBlankQuestions } from "@/lib/dummy-blank"

// --- Types ---

interface SeriesPoint {
  x: string
  y: number
}

interface ChoiceItem {
  label: string
  series: number[]
}

interface Question {
  ID: number
  DECK: string
  QTYPE: string
  QUESTION_TEXT: string
  ITEM_A: string | null
  ITEM_B: string | null
  METRIC: string
  VALUE_A: number
  VALUE_B: number
  SERIES: SeriesPoint[] | null
  MASK_FROM: number | null
  MASK_TO: number | null
  CHOICES: ChoiceItem[] | null
  CORRECT: number
  EXPLANATION: string
  SQL_TEXT: string
}

interface RankingRow {
  QUESTION_ID: number
  QUESTION_TEXT: string
  TOTAL: number
  WRONG: number
  WRONG_PCT: number
}

type Phase = "start" | "loading" | "question" | "result" | "finished"

const DECKS = [
  { value: "all", label: "すべて" },
  { value: "category", label: "カテゴリ" },
  { value: "state", label: "都道府県" },
  { value: "month", label: "時期" },
  { value: "segment", label: "顧客セグメント" },
  { value: "weather", label: "天気" },
  { value: "customer", label: "顧客属性" },
]

const MODES = [
  { value: "mix", label: "ミックス" },
  { value: "highlow", label: "High & Low" },
  { value: "blank", label: "虫食い" },
]

// --- Helpers ---

function formatNumber(n: number, metric: string): string {
  if (metric.endsWith("_share") || metric.endsWith("_rate")) return `${n.toLocaleString()}%`
  if (metric === "aov" || metric === "spend_per_customer") return `${Math.round(n).toLocaleString()}円`
  if (metric === "orders_per_customer") return `${n.toLocaleString()}回`
  if (metric === "orders") return `${Math.round(n).toLocaleString()}件`
  if (metric === "sales") {
    if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}億円`
    if (n >= 10_000) return `${Math.round(n / 10_000).toLocaleString()}万円`
    return `${Math.round(n).toLocaleString()}円`
  }
  return n.toLocaleString()
}

// --- SVG Line Chart ---

function MiniLineChart({
  points,
  width = 120,
  height = 60,
  strokeColor = "currentColor",
  strokeWidth = 2,
}: {
  points: number[]
  width?: number
  height?: number
  strokeColor?: string
  strokeWidth?: number
}) {
  if (!points.length) return null
  const min = Math.min(...points)
  const max = Math.max(...points)
  const range = max - min || 1
  const coords = points.map((v, i) => {
    const x = (i / Math.max(points.length - 1, 1)) * width
    const y = height - ((v - min) / range) * height
    return `${x},${y}`
  })
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="block">
      <polyline
        points={coords.join(" ")}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}

function BlankChart({
  series,
  maskFrom,
  maskTo,
}: {
  series: SeriesPoint[]
  maskFrom: number
  maskTo: number
}) {
  const W = 600
  const H = 200
  const PAD = 20
  const chartW = W - PAD * 2
  const chartH = H - PAD * 2

  const vals = series.map((p) => p.y)
  const min = Math.min(...vals)
  const max = Math.max(...vals)
  const range = max - min || 1

  const toX = (i: number) => PAD + (i / Math.max(series.length - 1, 1)) * chartW
  const toY = (v: number) => PAD + chartH - ((v - min) / range) * chartH

  // Build two segments (before mask, after mask)
  const beforePts: string[] = []
  const afterPts: string[] = []
  for (let i = 0; i < series.length; i++) {
    const coord = `${toX(i)},${toY(series[i].y)}`
    if (i < maskFrom) beforePts.push(coord)
    if (i === maskFrom) beforePts.push(coord) // connect to mask edge
    if (i > maskTo) afterPts.push(coord)
    if (i === maskTo) afterPts.unshift(coord) // connect from mask edge
  }

  const maskX1 = toX(maskFrom)
  const maskX2 = toX(maskTo)
  const maskMidX = (maskX1 + maskX2) / 2
  const maskMidY = PAD + chartH / 2

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="block mx-auto max-w-full">
      {/* grid */}
      <rect x={PAD} y={PAD} width={chartW} height={chartH} fill="none" stroke="var(--border)" strokeWidth={0.5} />
      {/* before mask */}
      {beforePts.length > 1 && (
        <polyline points={beforePts.join(" ")} fill="none" stroke="var(--foreground)" strokeWidth={2} strokeLinejoin="round" />
      )}
      {/* after mask */}
      {afterPts.length > 1 && (
        <polyline points={afterPts.join(" ")} fill="none" stroke="var(--foreground)" strokeWidth={2} strokeLinejoin="round" />
      )}
      {/* mask band */}
      <rect x={maskX1} y={PAD} width={maskX2 - maskX1} height={chartH} fill="var(--muted)" opacity={0.6} />
      {/* ? box */}
      <rect x={maskMidX - 24} y={maskMidY - 20} width={48} height={40} rx={4} fill="white" stroke="red" strokeWidth={2} />
      <text x={maskMidX} y={maskMidY + 8} textAnchor="middle" fontSize={24} fontWeight="bold" fill="red">?</text>
      {/* x-axis labels (first, mask edges, last) */}
      {[0, maskFrom, maskTo, series.length - 1].map((idx) => (
        <text key={idx} x={toX(idx)} y={H - 2} textAnchor="middle" fontSize={8} fill="var(--muted-foreground)">
          {series[idx]?.x ?? ""}
        </text>
      ))}
    </svg>
  )
}

// --- Component ---

export function QuizGame() {
  const { setRideState } = useAdventureRide()
  const [playerName, setPlayerName] = useState("guest")
  const [mode, setMode] = useState("mix")
  const [deck, setDeck] = useState("all")
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [phase, setPhase] = useState<Phase>("start")
  const [chosen, setChosen] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [total, setTotal] = useState(0)
  const [showSql, setShowSql] = useState(false)
  const [showDef, setShowDef] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ranking, setRanking] = useState<RankingRow[]>([])
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null)

  const fetchQuestions = useCallback(async (selectedDeck: string, selectedMode: string) => {
    setRideState("running")
    setPhase("loading")
    setError(null)
    try {
      const res = await fetch(`/api/quiz?deck=${selectedDeck}&mode=${selectedMode}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      let qs: Question[] = data.questions ?? []
      // If blank mode and 0 blank questions from DB, use dummy
      const blankQs = qs.filter((q) => q.QTYPE === "blank")
      if ((selectedMode === "blank" || selectedMode === "mix") && blankQs.length === 0) {
        qs = [...qs, ...(dummyBlankQuestions as unknown as Question[])]
      }
      if (!qs.length) throw new Error("問題がありません")
      setQuestions(qs)
      setCurrentIdx(0)
      setScore(0)
      setStreak(0)
      setTotal(0)
      setLastCorrect(null)
      setPhase("question")
    } catch (e) {
      setRideState("parked")
      setError(e instanceof Error ? e.message : "読み込み失敗")
      setPhase("start")
    }
  }, [setRideState])

  const fetchRanking = useCallback(async () => {
    try {
      const res = await fetch("/api/ranking")
      const data = await res.json()
      if (data.ranking) setRanking(data.ranking)
    } catch {
      // ranking is optional
    }
  }, [])

  const handleStart = (selectedDeck: string) => {
    setDeck(selectedDeck)
    fetchQuestions(selectedDeck, mode)
  }

  const q = questions[currentIdx] ?? null

  const handleAnswer = async (choice: number) => {
    if (!q) return
    setChosen(choice)
    const correct = choice === q.CORRECT
    const direction = choice % 2 === 0 ? "left" : "right"
    setRideState(`${direction}-${correct ? "safe" : "lava"}` as RideState)
    setLastCorrect(correct)
    if (correct) {
      setScore((s) => s + 1)
      setStreak((s) => s + 1)
    } else {
      setStreak(0)
    }
    setTotal((t) => t + 1)
    setPhase("result")
    setShowSql(false)
    setShowDef(false)

    fetch("/api/answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question_id: q.ID,
        chosen: choice,
        player: playerName || "guest",
        is_correct: correct,
      }),
    }).catch(() => {})
  }

  const handleNext = () => {
    if (currentIdx + 1 >= questions.length) {
      setRideState("parked")
      setPhase("finished")
      fetchRanking()
    } else {
      setRideState("running")
      setCurrentIdx((i) => i + 1)
      setChosen(null)
      setPhase("question")
      setShowSql(false)
      setShowDef(false)
    }
  }

  // --- Start Screen ---
  if (phase === "start") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="adventure-card w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">楽天クイズ</CardTitle>
            <p className="text-muted-foreground text-sm mt-2">
              データの直感と実態のズレを体験しよう
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && <p className="text-destructive text-sm text-center">{error}</p>}

            {/* Player Name */}
            <div>
              <label className="text-sm font-medium block mb-1">回答者名</label>
              <input
                type="text"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="guest"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
              />
            </div>

            {/* Mode Selection */}
            <div>
              <label className="text-sm font-medium block mb-1">モード</label>
              <div className="flex gap-2">
                {MODES.map((m) => (
                  <Button
                    key={m.value}
                    variant={mode === m.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setMode(m.value)}
                  >
                    {m.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Deck Selection */}
            <p className="text-sm font-medium text-center">デッキを選んでスタート</p>
            <div className="grid grid-cols-2 gap-2">
              {DECKS.map((d) => (
                <Button
                  key={d.value}
                  variant={d.value === "all" ? "default" : "outline"}
                  className={d.value === "all" ? "col-span-2" : ""}
                  onClick={() => handleStart(d.value)}
                >
                  {d.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // --- Loading ---
  if (phase === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">読み込み中...</p>
      </div>
    )
  }

  // --- Finished Screen ---
  if (phase === "finished") {
    const pct = total > 0 ? Math.round((score / total) * 100) : 0
    const allCorrect = score === total && total > 0
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="adventure-card w-full max-w-md text-center">
          <CardHeader>
            <CardTitle
              className="text-2xl"
              style={
                allCorrect
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
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-5xl font-bold tabular-nums">{score} / {total}</p>
            <p className="text-muted-foreground">正答率 {pct}%</p>

            {/* Ranking */}
            {ranking.length > 0 && (
              <div className="text-left mt-4">
                <h3 className="text-sm font-semibold mb-2">みんなが外した問題 TOP5</h3>
                <div className="space-y-1">
                  {ranking.map((r, i) => (
                    <div key={r.QUESTION_ID} className="flex items-start gap-2 text-xs">
                      <span className="font-bold text-muted-foreground">{i + 1}.</span>
                      <span className="flex-1">{r.QUESTION_TEXT}</span>
                      <span className="text-destructive font-semibold whitespace-nowrap">{r.WRONG_PCT}% 不正解</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 justify-center mt-4">
              <Button onClick={() => fetchQuestions(deck, mode)}>もう一度</Button>
              <Button variant="outline" onClick={() => { setRideState("parked"); setQuestions([]); setPhase("start") }}>
                デッキ選択に戻る
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!q) return null

  const isCorrect = chosen === q.CORRECT
  const isBlank = q.QTYPE === "blank"

  // --- Question / Result Screen ---
  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 relative">
      {/* Mascot */}
      <div className="fixed bottom-4 left-4 z-50">
        <Mascot streak={streak} isCorrect={lastCorrect} />
      </div>

      {/* Score Bar */}
      <div className="adventure-scorebar flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="text-sm">
            {currentIdx + 1} / {questions.length}
          </Badge>
          <span className="text-sm text-muted-foreground">
            スコア <span className="font-semibold text-foreground">{score}</span>
          </span>
          {streak >= 2 && (
            <span className="text-sm text-orange-500 font-semibold">{streak} 連勝!</span>
          )}
        </div>
        <Badge variant="outline" className="text-xs">
          {DECKS.find((d) => d.value === q.DECK)?.label ?? q.DECK}
        </Badge>
      </div>

      {/* Question Card */}
      <Card className="adventure-card">
        <CardHeader>
          <CardTitle className="text-lg leading-relaxed">{q.QUESTION_TEXT}</CardTitle>
          {isBlank && phase === "question" && (
            <p className="text-xs text-muted-foreground mt-1">わからないだろう？</p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Blank: Show chart */}
          {isBlank && q.SERIES && q.MASK_FROM != null && q.MASK_TO != null && (
            <BlankChart series={q.SERIES} maskFrom={q.MASK_FROM} maskTo={q.MASK_TO} />
          )}

          {/* Question phase */}
          {phase === "question" && !isBlank && (
            <div className="grid grid-cols-2 gap-3">
              <Button
                size="lg"
                className="h-20 text-base whitespace-normal"
                onClick={() => handleAnswer(0)}
              >
                <span aria-hidden="true">←</span> {q.ITEM_A}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-20 text-base whitespace-normal"
                onClick={() => handleAnswer(1)}
              >
                {q.ITEM_B} <span aria-hidden="true">→</span>
              </Button>
            </div>
          )}

          {/* Blank question: choice cards */}
          {phase === "question" && isBlank && q.CHOICES && (
            <div className="grid grid-cols-2 gap-3">
              {q.CHOICES.map((c, i) => (
                <button
                  key={i}
                  className="rounded-lg border p-3 text-center hover:ring-2 hover:ring-primary transition-all"
                  onClick={() => handleAnswer(i)}
                >
                  <div className="text-xs font-semibold mb-1">
                    {i % 2 === 0 ? "← " : ""}
                    {String.fromCharCode(65 + i)}
                    {i % 2 === 1 ? " →" : ""}
                  </div>
                  <MiniLineChart points={c.series} width={100} height={40} strokeColor="var(--foreground)" />
                  <div className="text-xs text-muted-foreground mt-1 truncate">{c.label}</div>
                </button>
              ))}
            </div>
          )}

          {/* Result phase */}
          {phase === "result" && (
            <div className="space-y-4">
              {/* Correct / Incorrect Banner */}
              <div
                className={`rounded-lg p-4 text-center text-lg font-bold ${
                  isCorrect
                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                }`}
              >
                {isCorrect ? "正解!" : "不正解..."}
              </div>

              {/* High & Low: Value Comparison */}
              {!isBlank && (
                <div className="grid grid-cols-2 gap-3">
                  <div
                    className={`rounded-lg border p-4 text-center ${
                      q.CORRECT === 0 ? "ring-2 ring-green-500" : ""
                    }`}
                  >
                    <p className="text-sm text-muted-foreground mb-1">{q.ITEM_A}</p>
                    <p className="text-2xl font-bold tabular-nums">
                      {formatNumber(q.VALUE_A, q.METRIC)}
                    </p>
                    {q.CORRECT === 0 && <Badge className="mt-2 bg-green-600">正解</Badge>}
                  </div>
                  <div
                    className={`rounded-lg border p-4 text-center ${
                      q.CORRECT === 1 ? "ring-2 ring-green-500" : ""
                    }`}
                  >
                    <p className="text-sm text-muted-foreground mb-1">{q.ITEM_B}</p>
                    <p className="text-2xl font-bold tabular-nums">
                      {formatNumber(q.VALUE_B, q.METRIC)}
                    </p>
                    {q.CORRECT === 1 && <Badge className="mt-2 bg-green-600">正解</Badge>}
                  </div>
                </div>
              )}

              {/* Blank: show full chart + choice labels */}
              {isBlank && q.SERIES && q.MASK_FROM != null && q.MASK_TO != null && (
                <div className="space-y-2">
                  {/* Full chart without mask */}
                  <svg width="100%" viewBox="0 0 600 200" className="block mx-auto max-w-full">
                    {(() => {
                      const W = 600, H = 200, PAD = 20
                      const chartW = W - PAD * 2, chartH = H - PAD * 2
                      const vals = q.SERIES!.map((p) => p.y)
                      const min = Math.min(...vals), max = Math.max(...vals)
                      const range = max - min || 1
                      const pts = q.SERIES!.map((p, i) => {
                        const x = PAD + (i / Math.max(q.SERIES!.length - 1, 1)) * chartW
                        const y = PAD + chartH - ((p.y - min) / range) * chartH
                        return `${x},${y}`
                      })
                      return (
                        <>
                          <rect x={PAD} y={PAD} width={chartW} height={chartH} fill="none" stroke="var(--border)" strokeWidth={0.5} />
                          <polyline points={pts.join(" ")} fill="none" stroke="var(--foreground)" strokeWidth={2} strokeLinejoin="round" />
                        </>
                      )
                    })()}
                  </svg>
                  {/* Choice labels */}
                  {q.CHOICES && (
                    <div className="grid grid-cols-2 gap-2">
                      {q.CHOICES.map((c, i) => (
                        <div
                          key={i}
                          className={`rounded-lg border p-2 text-center text-xs ${
                            i === q.CORRECT ? "ring-2 ring-green-500 font-bold" : "text-muted-foreground"
                          }`}
                        >
                          {String.fromCharCode(65 + i)}: {c.label}
                          {i === q.CORRECT && <Badge className="ml-1 bg-green-600 text-[10px]">正解</Badge>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Explanation */}
              {q.EXPLANATION && (
                <div className="rounded-lg bg-muted p-4">
                  <p className="text-sm whitespace-pre-wrap">{q.EXPLANATION}</p>
                </div>
              )}

              {/* SQL toggle */}
              {q.SQL_TEXT && (
                <div>
                  <button
                    className="text-xs text-muted-foreground hover:text-foreground underline"
                    onClick={() => setShowSql(!showSql)}
                  >
                    {showSql ? "SQL を閉じる" : "使った SQL を見る"}
                  </button>
                  {showSql && (
                    <pre className="mt-2 rounded-lg bg-muted p-3 text-xs overflow-x-auto whitespace-pre-wrap">
                      {q.SQL_TEXT}
                    </pre>
                  )}
                </div>
              )}

              {/* Definition toggle */}
              <div>
                <button
                  className="text-xs text-muted-foreground hover:text-foreground underline"
                  onClick={() => setShowDef(!showDef)}
                >
                  {showDef ? "定義を閉じる" : "定義"}
                </button>
                {showDef && (
                  <div className="mt-2 rounded-lg bg-muted p-3 text-xs space-y-1">
                    <p>注文＝顧客ID × 購入日時</p>
                    <p>平均購入単価＝売上 ÷ 注文数</p>
                    <p>優良顧客＝Day3 の RFM 定義（化粧品購入者で R・F・M 高、2,865 人）</p>
                    <p>Apple Gift Card は集計から除外</p>
                    <p>期間 2023/4/1〜2024/3/31</p>
                  </div>
                )}
              </div>

              {/* Next Button */}
              <Button className="w-full" size="lg" onClick={handleNext}>
                {currentIdx + 1 >= questions.length ? "結果を見る" : "次の問題"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
