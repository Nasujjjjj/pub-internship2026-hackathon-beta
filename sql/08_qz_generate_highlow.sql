-- QZ_GENERATE_HIGHLOW: AI 出題プロシージャ
-- モデル: claude-sonnet-4-5（TRY_COMPLETE + 4 モデルフォールバック）
-- 検証: item 実在 / 同一排除 / metric 許可リスト / 差 3% 以上
-- 使い方: CALL TEAM_B_DB.DEVELOPMENT.QZ_GENERATE_HIGHLOW('category', 5);
USE WAREHOUSE TEAM_B_WH;

CREATE OR REPLACE PROCEDURE TEAM_B_DB.DEVELOPMENT.QZ_GENERATE_HIGHLOW(DECK STRING, N NUMBER)
RETURNS STRING
LANGUAGE PYTHON
RUNTIME_VERSION = '3.11'
PACKAGES = ('snowflake-snowpark-python')
HANDLER = 'run'
EXECUTE AS CALLER
AS
$$
import json

MODELS = ['claude-sonnet-4-5', 'llama3.3-70b', 'llama3.1-8b', 'mistral-large2']

ALLOWED_METRICS = {
    'category': ['sales','orders','customers','aov','female_share'],
    'state':    ['sales','orders','customers','aov'],
}

def try_complete(session, model, prompt):
    """Call TRY_COMPLETE, return text or None."""
    sql = "SELECT SNOWFLAKE.CORTEX.TRY_COMPLETE(?, ?) AS R"
    row = session.sql(sql, params=[model, prompt]).collect()
    if not row:
        return None
    val = row[0]['R']
    if val is None:
        return None
    try:
        parsed = json.loads(val) if isinstance(val, str) else val
        if isinstance(parsed, dict) and 'choices' in parsed:
            return parsed['choices'][0]['messages']
        return val if isinstance(val, str) else json.dumps(val)
    except:
        return val if isinstance(val, str) else str(val)

def find_working_model(session):
    for m in MODELS:
        result = try_complete(session, m, 'Reply with OK')
        if result and 'OK' in str(result):
            return m
    return None

def extract_json_array(text):
    """Extract JSON array from AI response (strip markdown fences etc)."""
    t = text.strip()
    if '```' in t:
        parts = t.split('```')
        for p in parts:
            p = p.strip()
            if p.startswith('json'):
                p = p[4:].strip()
            if p.startswith('['):
                t = p
                break
    start = t.find('[')
    end = t.rfind(']')
    if start == -1 or end == -1:
        return None
    try:
        return json.loads(t[start:end+1])
    except:
        return None

def run(session, deck, n):
    session.sql("USE WAREHOUSE TEAM_B_WH").collect()

    model = find_working_model(session)
    if not model:
        return json.dumps({"error": "No working model found", "tried": MODELS})

    if deck == 'category':
        table = 'TEAM_B_DB.DEVELOPMENT.QZ_AGG_CAT'
        rows = session.sql(f"SELECT * FROM {table} WHERE CATEGORY_LEVEL_1 != 'カテゴリ不明' ORDER BY SALES DESC LIMIT 40").collect()
    elif deck == 'state':
        table = 'TEAM_B_DB.DEVELOPMENT.QZ_AGG_STATE'
        rows = session.sql(f"SELECT * FROM {table} ORDER BY SALES DESC").collect()
    else:
        return json.dumps({"error": f"Unsupported deck: {deck}. Use 'category' or 'state'."})

    data = []
    for r in rows:
        d = {}
        for k in r.asDict():
            v = r[k]
            d[k] = float(v) if isinstance(v, (int, float)) else str(v) if v is not None else None
        data.append(d)

    allowed = ALLOWED_METRICS.get(deck, [])
    metrics_str = '|'.join(allowed)

    prompt = f"""次は楽天市場の2023年度の集計表です。直感と逆になりそうな（多くの人が外しそうな）「AのXXはBより高い？低い？」の組を{n}個選び、JSON配列だけを返してください。
各要素は {{"item_a":..., "item_b":..., "metric":"{metrics_str}", "question_text":"日本語の問題文1文", "why":"意外な理由1文"}}。
表に無い名前は使わない。metric は必ず {metrics_str} のいずれか。

集計表:
{json.dumps(data, ensure_ascii=False)}"""

    response = try_complete(session, model, prompt)
    if not response:
        response = try_complete(session, model, prompt)
    if not response:
        return json.dumps({"error": "AI returned no response", "model": model})

    items = extract_json_array(str(response))
    if not items:
        return json.dumps({"error": "Could not parse JSON array from AI response", "model": model, "raw": str(response)[:500]})

    if deck == 'category':
        key_col = 'CATEGORY_LEVEL_1'
    else:
        key_col = 'STATE_NAME'

    lookup = {}
    for d in data:
        name = d[key_col]
        lookup[name] = d

    generated = 0
    passed = 0
    failed_reasons = []

    for item in items:
        generated += 1
        ia = item.get('item_a', '')
        ib = item.get('item_b', '')
        metric = item.get('metric', '')
        qt = item.get('question_text', '')
        why = item.get('why', '')

        if ia not in lookup:
            failed_reasons.append(f"{ia}: not in table")
            continue
        if ib not in lookup:
            failed_reasons.append(f"{ib}: not in table")
            continue
        if ia == ib:
            failed_reasons.append(f"{ia}=={ib}: same item")
            continue
        if metric not in allowed:
            failed_reasons.append(f"{metric}: not in allowed metrics {allowed}")
            continue

        col = metric.upper()
        va = lookup[ia].get(col)
        vb = lookup[ib].get(col)
        if va is None or vb is None:
            failed_reasons.append(f"{metric}: value is None for {ia} or {ib}")
            continue

        va = float(va)
        vb = float(vb)

        avg = (abs(va) + abs(vb)) / 2
        if avg == 0 or abs(va - vb) / avg < 0.03:
            failed_reasons.append(f"{ia} vs {ib} on {metric}: diff < 3% ({va} vs {vb})")
            continue

        correct = 0 if va > vb else 1

        expl_prompt = f"""問題文: {qt}
A ({ia}) = {va}, B ({ib}) = {vb}
この数字だけを使って、以下の形式で解説を書いてください:
1行目: 正解と2つの数字
2行目: なぜそうなるか（背景を1文）
新しい数字は作らない。"""

        explanation = try_complete(session, model, expl_prompt)
        if not explanation:
            explanation = why

        if deck == 'category':
            sql_text = f"SELECT CATEGORY_LEVEL_1, {col} FROM TEAM_B_DB.DEVELOPMENT.QZ_AGG_CAT WHERE CATEGORY_LEVEL_1 IN ('{ia}', '{ib}')"
        else:
            sql_text = f"SELECT STATE_NAME, {col} FROM TEAM_B_DB.DEVELOPMENT.QZ_AGG_STATE WHERE STATE_NAME IN ('{ia}', '{ib}')"

        insert_sql = """
INSERT INTO TEAM_B_DB.DEVELOPMENT.QZ_QUESTIONS
    (DECK, QTYPE, QUESTION_TEXT, ITEM_A, ITEM_B, METRIC, VALUE_A, VALUE_B, CORRECT, EXPLANATION, SQL_TEXT, AI_GENERATED)
VALUES (?, 'highlow', ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)
"""
        session.sql(insert_sql, params=[deck, qt, ia, ib, metric, va, vb, correct, str(explanation)[:1000], sql_text]).collect()
        passed += 1

    return json.dumps({
        "model": model,
        "generated": generated,
        "passed": passed,
        "failed": len(failed_reasons),
        "failed_reasons": failed_reasons[:10]
    }, ensure_ascii=False)
$$;
