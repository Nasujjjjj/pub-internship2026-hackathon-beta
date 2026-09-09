import { querySnowflake } from "@/lib/snowflake"

export const dynamic = "force-dynamic"

const WH = "TEAM_B_WH"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { question_id, chosen, player, is_correct } = body

    if (question_id == null || chosen == null) {
      return Response.json({ error: "question_id and chosen are required" }, { status: 400 })
    }

    await querySnowflake(
      `INSERT INTO TEAM_B_DB.DEVELOPMENT.QZ_ANSWERS (PLAYER, QUESTION_ID, CHOSEN, IS_CORRECT)
       VALUES (?, ?, ?, ?)`,
      { warehouse: WH, binds: [player || "anonymous", question_id, chosen, is_correct ?? false] },
    )

    return Response.json({ ok: true })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error"
    return Response.json({ error: message }, { status: 500 })
  }
}
