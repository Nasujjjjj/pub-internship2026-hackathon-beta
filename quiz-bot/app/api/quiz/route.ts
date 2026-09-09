import { querySnowflake } from "@/lib/snowflake"

export const dynamic = "force-dynamic"

const WH = "TEAM_B_WH"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const deck = searchParams.get("deck") || "all"
    const mode = searchParams.get("mode") || "mix"
    const idsParam = searchParams.get("ids") || ""
    const n = parseInt(searchParams.get("n") || "10", 10) || 10

    const columns = `ID, DECK, QTYPE, QUESTION_TEXT, ITEM_A, ITEM_B, METRIC,
             VALUE_A, VALUE_B, SERIES, MASK_FROM, MASK_TO, CHOICES,
             CORRECT, EXPLANATION, SQL_TEXT`

    let sql: string
    const binds: (string | number)[] = []

    if (idsParam) {
      const ids = idsParam.split(",").map((s) => parseInt(s.trim(), 10)).filter((v) => !isNaN(v))
      if (ids.length === 0) {
        return Response.json({ questions: [] })
      }
      const placeholders = ids.map(() => "?").join(",")
      sql = `SELECT ${columns} FROM TEAM_B_DB.DEVELOPMENT.QZ_QUESTIONS WHERE ID IN (${placeholders})`
      binds.push(...ids)
    } else {
      sql = `SELECT ${columns} FROM TEAM_B_DB.DEVELOPMENT.QZ_QUESTIONS`
      const conditions: string[] = []
      if (deck !== "all") {
        conditions.push("DECK = ?")
        binds.push(deck)
      }
      if (mode === "highlow") {
        conditions.push("QTYPE = 'highlow'")
      } else if (mode === "blank") {
        conditions.push("QTYPE = 'blank'")
      }
      if (conditions.length > 0) {
        sql += " WHERE " + conditions.join(" AND ")
      }
      sql += ` ORDER BY RANDOM() LIMIT ?`
      binds.push(n)
    }

    const rows = await querySnowflake(sql, { warehouse: WH, binds })

    const parsed = (rows as Record<string, unknown>[]).map((row) => {
      const out: Record<string, unknown> = { ...row }
      for (const key of ["SERIES", "CHOICES"]) {
        if (typeof out[key] === "string") {
          try {
            out[key] = JSON.parse(out[key] as string)
          } catch {
            // leave as-is
          }
        }
      }
      return out
    })

    // If ids param, reorder to match requested order
    if (idsParam) {
      const ids = idsParam.split(",").map((s) => parseInt(s.trim(), 10)).filter((v) => !isNaN(v))
      const byId = new Map(parsed.map((r) => [r.ID as number, r]))
      const ordered = ids.map((id) => byId.get(id)).filter(Boolean)
      return Response.json({ questions: ordered })
    }

    return Response.json({ questions: parsed })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error"
    return Response.json({ error: message }, { status: 500 })
  }
}
