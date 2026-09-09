import { QuizGame } from "@/components/quiz-game"
import { AdventureStage } from "@/components/adventure-stage"

// Required: Snowflake is not reachable during docker build.
export const dynamic = "force-dynamic"

export default function Home() {
  return (
    <AdventureStage>
      <main className="w-full py-8 px-4">
        <QuizGame />
      </main>
    </AdventureStage>
  )
}
