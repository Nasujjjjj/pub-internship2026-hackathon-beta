"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

// --- Types ---

interface Question {
  ID: number
  DECK: string
  QTYPE: string
  QUESTION_TEXT: string
  ITEM_A: string
  ITEM_B: string
  METRIC: string
  VALUE_A: number
  VALUE_B: number
  CORRECT: number // 0 = A is higher, 1 = B is higher
  EXPLANATION: string
  SQL_TEXT: string
}

type Phase = "loading" | "question" | "result" | "finished"

const DECKS = [
  { value: "all", label: "すべて" },
  { value: "category", label: "カテゴリ" },
  { value: "state", label: "都道府県" },
  { value: "month", label: "月" },
  { value: "segment", label: "顧客セグメント" },
]

// --- Helpers ---

function formatNumber(n: number, metric: string): string {
  if (metric === "female_share" || metric === "sales_share") return `${n.toLocaleString()}%`
  if (metric === "orders_per_customer") return `${n.toLocaleString()}回`
  if (metric === "aov") return `${Math.round(n).toLocaleString()}円`
  if (metric === "sales") {
    if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}億円`
    if (n >= 10_000) return `${Math.round(n / 10_000).toLocaleString()}万円`
    return `${Math.round(n).toLocaleString()}円`
  }
  if (metric === "orders") return `${Math.round(n).toLocaleString()}件`
  return n.toLocaleString()
}

// --- Component ---

export function QuizGame() {
  const [deck, setDeck] = useState("all")
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [phase, setPhase] = useState<Phase>("loading")
  const [chosen, setChosen] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [total, setTotal] = useState(0)
  const [showSql, setShowSql] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchQuestions = useCallback(async (selectedDeck: string) => {
    setPhase("loading")
    setError(null)
    try {
      const res = await fetch(`/api/quiz?deck=${selectedDeck}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      if (!data.questions?.length) throw new Error("問題がありません")
      setQuestions(data.questions)
      setCurrentIdx(0)
      setScore(0)
      setStreak(0)
      setTotal(0)
      setPhase("question")
    } catch (e) {
      setError(e instanceof Error ? e.message : "読み込み失敗")
      setPhase("loading")
    }
  }, [])

  const handleStart = (selectedDeck: string) => {
    setDeck(selectedDeck)
    fetchQuestions(selectedDeck)
  }

  const q = questions[currentIdx] ?? null

  const handleAnswer = async (choice: number) => {
    if (!q) return
    setChosen(choice)
    const correct = choice === q.CORRECT
    if (correct) {
      setScore((s) => s + 1)
      setStreak((s) => s + 1)
    } else {
      setStreak(0)
    }
    setTotal((t) => t + 1)
    setPhase("result")
    setShowSql(false)

    fetch("/api/answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question_id: q.ID,
        chosen: choice,
        is_correct: correct,
      }),
    }).catch(() => {})
  }

  const handleNext = () => {
    if (currentIdx + 1 >= questions.length) {
      setPhase("finished")
    } else {
      setCurrentIdx((i) => i + 1)
      setChosen(null)
      setPhase("question")
      setShowSql(false)
    }
  }

  // --- Start Screen ---
  if (phase === "loading" && questions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">楽天クイズ</CardTitle>
            <p className="text-muted-foreground text-sm mt-2">
              データの直感と実態のズレを体験しよう
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && <p className="text-destructive text-sm text-center">{error}</p>}
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

  // --- Finished Screen ---
  if (phase === "finished") {
    const pct = total > 0 ? Math.round((score / total) * 100) : 0
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-2xl">結果発表</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-5xl font-bold tabular-nums">{score} / {total}</p>
            <p className="text-muted-foreground">正答率 {pct}%</p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => fetchQuestions(deck)}>もう一度</Button>
              <Button variant="outline" onClick={() => { setQuestions([]); setPhase("loading") }}>
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

  // --- Question / Result Screen ---
  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* Score Bar */}
      <div className="flex items-center justify-between px-1">
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
      <Card>
        <CardHeader>
          <CardTitle className="text-lg leading-relaxed">{q.QUESTION_TEXT}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {phase === "question" && (
            <div className="grid grid-cols-2 gap-3">
              <Button
                size="lg"
                className="h-20 text-base whitespace-normal"
                onClick={() => handleAnswer(0)}
              >
                {q.ITEM_A}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-20 text-base whitespace-normal"
                onClick={() => handleAnswer(1)}
              >
                {q.ITEM_B}
              </Button>
            </div>
          )}

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

              {/* Value Comparison */}
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
                  {q.CORRECT === 0 && (
                    <Badge className="mt-2 bg-green-600">正解</Badge>
                  )}
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
                  {q.CORRECT === 1 && (
                    <Badge className="mt-2 bg-green-600">正解</Badge>
                  )}
                </div>
              </div>

              {/* Explanation */}
              {q.EXPLANATION && (
                <div className="rounded-lg bg-muted p-4">
                  <p className="text-sm">{q.EXPLANATION}</p>
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
