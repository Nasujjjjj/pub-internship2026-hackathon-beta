import { querySnowflake } from "@/lib/snowflake"

export const dynamic = "force-dynamic"

const WH = "TEAM_B_WH"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const deck = searchParams.get("deck") || "all"

    let sql = `
      SELECT ID, DECK, QTYPE, QUESTION_TEXT, ITEM_A, ITEM_B, METRIC,
             VALUE_A, VALUE_B, CORRECT, EXPLANATION, SQL_TEXT
      FROM TEAM_B_DB.DEVELOPMENT.QZ_QUESTIONS
    `
    const binds: (string | number)[] = []
    if (deck !== "all") {
      sql += " WHERE DECK = ?"
      binds.push(deck)
    }
    sql += " ORDER BY RANDOM()"

    const rows = await querySnowflake(sql, { warehouse: WH, binds })
    return Response.json({ questions: rows })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error"
    return Response.json({ error: message }, { status: 500 })
  }
}
