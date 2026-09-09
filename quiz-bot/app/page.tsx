import { QuizGame } from "@/components/quiz-game"

// Required: Snowflake is not reachable during docker build.
export const dynamic = "force-dynamic"

export default function Home() {
  return (
    <main className="w-full py-8 px-4">
      <QuizGame />
    </main>
  )
}
