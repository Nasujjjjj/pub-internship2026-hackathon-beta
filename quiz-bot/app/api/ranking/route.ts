import { querySnowflake } from "@/lib/snowflake"

export const dynamic = "force-dynamic"

const WH = "TEAM_B_WH"

export async function GET() {
  try {
    const sql = `
      SELECT a.QUESTION_ID, q.QUESTION_TEXT,
             COUNT(*) AS TOTAL,
             SUM(CASE WHEN a.IS_CORRECT = FALSE THEN 1 ELSE 0 END) AS WRONG,
             ROUND(SUM(CASE WHEN a.IS_CORRECT = FALSE THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) AS WRONG_PCT
      FROM TEAM_B_DB.DEVELOPMENT.QZ_ANSWERS a
      JOIN TEAM_B_DB.DEVELOPMENT.QZ_QUESTIONS q ON a.QUESTION_ID = q.ID
      GROUP BY a.QUESTION_ID, q.QUESTION_TEXT
      HAVING COUNT(*) >= 3
      ORDER BY WRONG_PCT DESC
      LIMIT 5
    `
    const rows = await querySnowflake(sql, { warehouse: WH })
    return Response.json({ ranking: rows })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error"
    return Response.json({ error: message }, { status: 500 })
  }
}
