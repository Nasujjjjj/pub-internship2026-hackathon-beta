-- 固定 High & Low 問題 6 問
-- 注文 = COUNT(DISTINCT USER_ID_HASH || '|' || PURCHASED_AT)
-- CORRECT: 0 = A が正解(高い), 1 = B が正解(高い)
USE WAREHOUSE TEAM_B_WH;

INSERT INTO TEAM_B_DB.DEVELOPMENT.QZ_QUESTIONS
    (DECK, QTYPE, QUESTION_TEXT, ITEM_A, ITEM_B, METRIC, VALUE_A, VALUE_B, CORRECT, EXPLANATION, SQL_TEXT, AI_GENERATED)
VALUES
-- Q1: 優良顧客の平均購入単価 vs それ以外 → 低い (B)
('segment', 'highlow',
 '優良顧客の平均購入単価は、それ以外の顧客より高い？低い？',
 '優良顧客', 'それ以外',
 'aov',
 6953, 7474,
 1,
 '優良顧客は購入頻度が高い分、1回あたりの単価は6,953円とむしろ低めです。それ以外の顧客は7,474円で、まとめ買い傾向があります。',
 'SELECT CASE WHEN RFM_SEGMENT = ''優良顧客'' THEN ''優良顧客'' ELSE ''それ以外'' END AS SEG, ROUND(SUM(TOTAL_PRICE) / NULLIF(COUNT(DISTINCT USER_ID_HASH || ''|'' || PURCHASED_AT), 0)) AS AOV FROM TEAM_B_DB.DEVELOPMENT.MART_RAKUTEN_PURCHASES_RFM GROUP BY SEG',
 FALSE),

-- Q2: 優良顧客の1人あたり注文数 vs それ以外の5倍 → 多い (A)
('segment', 'highlow',
 '優良顧客の1人あたり注文数は、それ以外の顧客の5倍より多い？少ない？',
 '優良顧客（82.7回）', 'それ以外の5倍（67.0回）',
 'orders_per_customer',
 82.7, 67.0,
 0,
 '優良顧客は1人あたり82.7回も注文しており、それ以外（13.4回）の約6.2倍。5倍の67.0回を大きく上回ります。',
 'SELECT CASE WHEN RFM_SEGMENT = ''優良顧客'' THEN ''優良顧客'' ELSE ''それ以外'' END AS SEG, ROUND(COUNT(DISTINCT USER_ID_HASH || ''|'' || PURCHASED_AT) / NULLIF(COUNT(DISTINCT USER_ID_HASH), 0), 1) AS ORDERS_PER_CUST FROM TEAM_B_DB.DEVELOPMENT.MART_RAKUTEN_PURCHASES_RFM GROUP BY SEG',
 FALSE),

-- Q3: 化粧品以外で優良顧客が一番買うのは ペット vs ダイエット → ペット (A)
('segment', 'highlow',
 '化粧品以外で優良顧客が一番お金を使うカテゴリは？ペット・ペットグッズ？ダイエット・健康？',
 'ペット・ペットグッズ', 'ダイエット・健康',
 'sales_share',
 13.0, 5.3,
 0,
 'ペット・ペットグッズが13.0%で堂々1位。ダイエット・健康は5.3%で、ペットの半分以下です。優良顧客はペットにもしっかり投資しています。',
 'WITH base AS (SELECT CATEGORY_LEVEL_1, SALES FROM TEAM_B_DB.DEVELOPMENT.QZ_AGG_SEG_CAT WHERE RFM_SEGMENT = ''優良顧客'' AND CATEGORY_LEVEL_1 != ''美容・コスメ・香水''), total AS (SELECT SUM(SALES) AS S FROM base) SELECT b.CATEGORY_LEVEL_1, ROUND(100.0 * b.SALES / t.S, 1) AS SHARE FROM base b, total t ORDER BY SHARE DESC',
 FALSE),

-- Q4: 東京都 vs 大阪府 注文数 → 東京都 (A)
('state', 'highlow',
 '東京都と大阪府、注文数が多いのはどっち？',
 '東京都', '大阪府',
 'orders',
 220916, 114454,
 0,
 '東京都は220,916件で大阪府の114,454件の約1.9倍。人口比（約1.5倍）以上の差があります。',
 'SELECT STATE_NAME, ORDERS FROM TEAM_B_DB.DEVELOPMENT.QZ_AGG_STATE WHERE STATE_NAME IN (''東京都'', ''大阪府'')',
 FALSE),

-- Q5: 12月 vs 3月 売上 → 12月 (A)
('month', 'highlow',
 '12月と3月、売上が多いのはどっち？',
 '12月', '3月',
 'sales',
 771398475, 655614663,
 0,
 '12月は約7.7億円、3月は約6.6億円。年末商戦の12月が上回りますが、3月も年度末セールで健闘しています。',
 'SELECT PURCHASE_MONTH, SUM(SALES) AS SALES FROM TEAM_B_DB.DEVELOPMENT.QZ_AGG_MONTH_CAT WHERE PURCHASE_MONTH IN (''2023-12-01'', ''2024-03-01'') GROUP BY PURCHASE_MONTH',
 FALSE),

-- Q6: 美容・コスメ vs ペット 女性比率 → 美容 (A)
('category', 'highlow',
 '「美容・コスメ・香水」と「ペット・ペットグッズ」、女性比率が高いのはどっち？',
 '美容・コスメ・香水', 'ペット・ペットグッズ',
 'female_share',
 76.7, 54.8,
 0,
 '美容・コスメ・香水は76.7%が女性で圧倒的。ペット・ペットグッズも54.8%と女性が多いですが、差は20ポイント以上あります。',
 'SELECT CATEGORY_LEVEL_1, FEMALE_SHARE FROM TEAM_B_DB.DEVELOPMENT.QZ_AGG_CAT WHERE CATEGORY_LEVEL_1 IN (''美容・コスメ・香水'', ''ペット・ペットグッズ'')',
 FALSE);
