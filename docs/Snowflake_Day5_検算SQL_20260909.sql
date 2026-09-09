-- Snowflake_Day5_13時検算SQL_20260909.sql
-- 使い方：Snowsight に貼り、番号のブロックごとに実行（ロール INTERNSHIP_MEMBER、WH TEAM_B_WH）。
-- 目的：昼の無人運転（lunch/data・lunch/ai-weather）の結果を、画面で回す前に数字で確認する。
USE WAREHOUSE TEAM_B_WH;
USE SCHEMA TEAM_B_DB.DEVELOPMENT;

-- =====================================================================
-- 1) 問題数（期待：合計 10 以上。blank 3、weather 1、AI_GENERATED=TRUE が 1 以上）
-- =====================================================================
SELECT QTYPE, DECK, AI_GENERATED, COUNT(*) AS N
FROM QZ_QUESTIONS GROUP BY 1, 2, 3 ORDER BY 1, 2, 3;

-- =====================================================================
-- 2) High & Low 全問：向き反転（CHECK_DIR='NG'）と差 3% 未満（FLAG_CLOSE）
--    なぜ：CORRECT は「値の比較」で決める規約。期待の向きに合わせて入れた行があれば画面が嘘をつく
-- =====================================================================
SELECT ID, DECK, QUESTION_TEXT, ITEM_A, ITEM_B, METRIC, VALUE_A, VALUE_B, CORRECT,
       IFF(VALUE_A > VALUE_B, 0, 1) AS CORRECT_BY_VALUE,
       IFF(CORRECT = IFF(VALUE_A > VALUE_B, 0, 1), 'OK', 'NG') AS CHECK_DIR,
       ROUND(ABS(VALUE_A - VALUE_B) / NULLIF(GREATEST(VALUE_A, VALUE_B), 0) * 100, 1) AS DIFF_PCT,
       IFF(ABS(VALUE_A - VALUE_B) / NULLIF(GREATEST(VALUE_A, VALUE_B), 0) < 0.03, '差3%未満', '') AS FLAG_CLOSE,
       AI_GENERATED
FROM QZ_QUESTIONS
WHERE QTYPE = 'highlow'
ORDER BY ID;

-- =====================================================================
-- 3) 虫食い（blank）の形：VARIANT が本当に配列か／MASK の範囲／CHOICES 4 つ／CORRECT 0〜3／選択肢の長さ＝隠した区間
--    なぜ：画面は SERIES・CHOICES を JSON.parse して折れ線を描く。文字列で入っていると配列にならず画面が落ちる
-- =====================================================================
SELECT ID, DECK, QUESTION_TEXT,
       TYPEOF(SERIES) AS T_SERIES, TYPEOF(CHOICES) AS T_CHOICES,     -- 両方 'ARRAY' が正
       ARRAY_SIZE(SERIES) AS N_SERIES, MASK_FROM, MASK_TO,
       ARRAY_SIZE(CHOICES) AS N_CHOICES, CORRECT,
       GET(CHOICES, CORRECT):label::STRING AS CORRECT_LABEL,
       ARRAY_SIZE(GET(CHOICES, 0):series) AS LEN_CHOICE0,
       MASK_TO - MASK_FROM + 1 AS LEN_MASK,
       IFF(TYPEOF(SERIES) = 'ARRAY' AND TYPEOF(CHOICES) = 'ARRAY'
           AND MASK_FROM >= 0 AND MASK_TO < ARRAY_SIZE(SERIES) AND MASK_FROM <= MASK_TO
           AND ARRAY_SIZE(CHOICES) = 4 AND CORRECT BETWEEN 0 AND 3
           AND ARRAY_SIZE(GET(CHOICES, 0):series) = MASK_TO - MASK_FROM + 1, 'OK', 'NG') AS CHECK_SHAPE,
       GET(SERIES, 0):x::STRING AS FIRST_X,
       GET(SERIES, ARRAY_SIZE(SERIES) - 1):x::STRING AS LAST_X,
       EXPLANATION
FROM QZ_QUESTIONS
WHERE QTYPE = 'blank'
ORDER BY ID;

-- 3a) T_SERIES が 'VARCHAR' だった時の直し方（JSON 文字列を配列に変換）
-- UPDATE QZ_QUESTIONS SET SERIES = PARSE_JSON(SERIES::STRING), CHOICES = PARSE_JSON(CHOICES::STRING)
-- WHERE QTYPE = 'blank' AND TYPEOF(SERIES) = 'VARCHAR';

-- 3b) 「正解の選択肢」が SERIES の隠した区間（min-max 正規化）と本当に一致するか（MAX_ERR < 0.01 で OK）
--     なぜ：シャッフル後の CORRECT の添字がずれていると、正しい形を選んでも不正解になる
WITH s AS (
  SELECT q.ID, f.INDEX AS I, f.VALUE:y::FLOAT AS Y
  FROM QZ_QUESTIONS q, LATERAL FLATTEN(INPUT => q.SERIES) f
  WHERE q.QTYPE = 'blank' AND f.INDEX BETWEEN q.MASK_FROM AND q.MASK_TO
), n AS (
  SELECT ID, I,
         (Y - MIN(Y) OVER (PARTITION BY ID)) / NULLIF(MAX(Y) OVER (PARTITION BY ID) - MIN(Y) OVER (PARTITION BY ID), 0) AS Y_NORM,
         ROW_NUMBER() OVER (PARTITION BY ID ORDER BY I) - 1 AS J
  FROM s
), c AS (
  SELECT q.ID, f.INDEX AS J, f.VALUE::FLOAT AS Y_CHOICE
  FROM QZ_QUESTIONS q, LATERAL FLATTEN(INPUT => GET(q.CHOICES, q.CORRECT):series) f
  WHERE q.QTYPE = 'blank'
)
SELECT n.ID, COUNT(*) AS N_POINTS, MAX(ABS(n.Y_NORM - c.Y_CHOICE)) AS MAX_ERR,
       IFF(MAX(ABS(n.Y_NORM - c.Y_CHOICE)) < 0.01, 'OK', 'NG') AS CHECK_CORRECT_CHOICE
FROM n JOIN c ON n.ID = c.ID AND n.J = c.J
GROUP BY n.ID ORDER BY n.ID;

-- =====================================================================
-- 4) 除外前の全行（大福帳そのまま）＝Day4 の数字と一致するか
--    期待：売上 8,287,087,735／注文 1,125,268／明細 1,468,432／顧客 69,082
-- =====================================================================
SELECT SUM(TOTAL_PRICE) AS SALES,
       COUNT(DISTINCT USER_ID_HASH, PURCHASED_AT) AS ORDERS,
       COUNT(*) AS ROWS_,
       COUNT(DISTINCT USER_ID_HASH) AS CUSTOMERS
FROM MART_RAKUTEN_PURCHASES_RFM;

-- =====================================================================
-- 5) QZ_BASE（Apple Gift Card 除外後）と除外分。ビューが無ければエラー → progress_data.md を見る
-- =====================================================================
SELECT GET_DDL('VIEW', 'TEAM_B_DB.DEVELOPMENT.QZ_BASE');           -- 除外条件を目で確認
SELECT SUM(TOTAL_PRICE) AS SALES, COUNT(DISTINCT USER_ID_HASH, PURCHASED_AT) AS ORDERS, COUNT(*) AS ROWS_
FROM QZ_BASE;
SELECT ITEM_NAME, COUNT(*) AS N, SUM(TOTAL_PRICE) AS SALES
FROM MART_RAKUTEN_PURCHASES_RFM
WHERE ITEM_NAME ILIKE '%gift card%' OR ITEM_NAME ILIKE '%ギフトカード%'
GROUP BY 1 ORDER BY 3 DESC LIMIT 20;                                -- 表記ゆれの取りこぼしが無いか

-- =====================================================================
-- 6) 発表 3 問（ID 1・3＋虫食い 1 問）の値
--    Day4 の全行実測＝ID 1：6,953 vs 7,474（優良が低い）／ID 3：ペット 13.0% vs ダイエット・健康 5.3%
--    除外後は少し動くが向き（優良が低い／ペットが 1 位）は同じはず
-- =====================================================================
SELECT ID, QUESTION_TEXT, ITEM_A, VALUE_A, ITEM_B, VALUE_B, CORRECT, EXPLANATION
FROM QZ_QUESTIONS WHERE ID IN (1, 3) ORDER BY ID;

-- ID 1 を除外後の大福帳から再計算（AOV＝売上÷注文、注文＝顧客×購入日時）
SELECT IS_PREMIUM_CUSTOMER::BOOLEAN AS PREMIUM,
       ROUND(SUM(TOTAL_PRICE) / COUNT(DISTINCT USER_ID_HASH, PURCHASED_AT)) AS AOV,
       COUNT(DISTINCT USER_ID_HASH) AS CUSTOMERS,
       COUNT(DISTINCT USER_ID_HASH, PURCHASED_AT) AS ORDERS,
       ROUND(COUNT(DISTINCT USER_ID_HASH, PURCHASED_AT) / COUNT(DISTINCT USER_ID_HASH), 1) AS ORDERS_PER_CUSTOMER
FROM QZ_BASE GROUP BY 1 ORDER BY 1 DESC;

-- ID 3 を再計算：優良顧客の、化粧品（美容・コスメ・香水）を除いた売上の構成比（上位 6）
-- 分母にカテゴリ不明を含めるかで ±1pt 動く。見るのは「ペットが 1 位」という順位
SELECT CATEGORY_LEVEL_1, ROUND(SUM(TOTAL_PRICE) / SUM(SUM(TOTAL_PRICE)) OVER () * 100, 1) AS SHARE_PCT
FROM QZ_BASE
WHERE IS_PREMIUM_CUSTOMER::BOOLEAN AND CATEGORY_LEVEL_1 <> '美容・コスメ・香水'
GROUP BY 1 ORDER BY 2 DESC LIMIT 6;

-- =====================================================================
-- 7) 天気：平日・全カテゴリ合計の日次注文数の中央値（雨 vs 雨でない）。無ければ progress_ai_weather.md を見る
-- =====================================================================
SELECT IS_RAINY, MEDIAN(ORDERS) AS MEDIAN_ORDERS, COUNT(*) AS DAYS
FROM QZ_AGG_WEATHER
WHERE IS_WEEKDAY AND CATEGORY_LEVEL_1 = 'すべて'
GROUP BY 1 ORDER BY 1;
SELECT ID, QUESTION_TEXT, ITEM_A, VALUE_A, ITEM_B, VALUE_B, CORRECT, EXPLANATION FROM QZ_QUESTIONS WHERE DECK = 'weather';

-- 7b) 天気担当の CoCo が「NOAA が無い」と書いていた時（SHOW TABLES はビューを出さないので空になる。SHOW OBJECTS で見る）
-- SHOW OBJECTS LIKE 'NOAA_WEATHER%' IN SCHEMA SNOWFLAKE_PUBLIC_DATA_FREE.PUBLIC_DATA_FREE;
-- SELECT NOAA_WEATHER_STATION_ID, NOAA_WEATHER_STATION_NAME
-- FROM SNOWFLAKE_PUBLIC_DATA_FREE.PUBLIC_DATA_FREE.NOAA_WEATHER_STATION_INDEX
-- WHERE NOAA_WEATHER_STATION_ID LIKE 'JA%' AND NOAA_WEATHER_STATION_NAME ILIKE '%TOKYO%';   -- 期待 JA000047662 'TOKYO'
-- SELECT VARIABLE, VARIABLE_NAME, UNIT FROM SNOWFLAKE_PUBLIC_DATA_FREE.PUBLIC_DATA_FREE.NOAA_WEATHER_METRICS_ATTRIBUTES
-- WHERE VARIABLE IN ('precipitation', 'maximum_temperature');                                -- 単位 Millimeters / Degrees Celsius（mm 換算済み）
--
-- 7c) 東京の日次天気（無い時の作り直し）。SUM(PRECIP_MM) が 1,300〜1,900 なら単位 OK（東京の平年 約 1,600mm）
-- CREATE OR REPLACE TABLE TEAM_B_DB.DEVELOPMENT.QZ_WEATHER_TOKYO AS
-- SELECT DATE,
--        MAX(IFF(VARIABLE = 'precipitation', VALUE, NULL)) AS PRECIP_MM,
--        MAX(IFF(VARIABLE = 'maximum_temperature', VALUE, NULL)) AS TMAX_C
-- FROM SNOWFLAKE_PUBLIC_DATA_FREE.PUBLIC_DATA_FREE.NOAA_WEATHER_METRICS_TIMESERIES
-- WHERE NOAA_WEATHER_STATION_ID = 'JA000047662'
--   AND VARIABLE IN ('precipitation', 'maximum_temperature')
--   AND DATE BETWEEN '2023-04-01' AND '2024-03-31'
-- GROUP BY DATE;
-- SELECT COUNT(*) AS DAYS, SUM(PRECIP_MM) AS PRECIP_TOTAL_MM, SUM(IFF(PRECIP_MM >= 1, 1, 0)) AS RAINY_DAYS
-- FROM TEAM_B_DB.DEVELOPMENT.QZ_WEATHER_TOKYO;
--
-- 7d) 結合テーブル（東京都の顧客 × 天気）。'すべて' 行の ORDERS は日内の COUNT DISTINCT（カテゴリ行を足すと二重計上）
--     QZ_BASE が無ければ FROM を MART_RAKUTEN_PURCHASES_RFM に替え、WHERE に AND NOT (ITEM_NAME ILIKE '%apple gift card%') を足す
-- CREATE OR REPLACE TABLE TEAM_B_DB.DEVELOPMENT.QZ_AGG_WEATHER AS
-- WITH t AS (SELECT * FROM TEAM_B_DB.DEVELOPMENT.QZ_BASE WHERE STATE_NAME = '東京都'),
-- d AS (
--   SELECT PURCHASED_AT::DATE AS DATE, 'すべて' AS CATEGORY_LEVEL_1,
--          SUM(TOTAL_PRICE) AS SALES, COUNT(DISTINCT USER_ID_HASH, PURCHASED_AT) AS ORDERS
--   FROM t GROUP BY 1
--   UNION ALL
--   SELECT PURCHASED_AT::DATE, CATEGORY_LEVEL_1, SUM(TOTAL_PRICE), COUNT(DISTINCT USER_ID_HASH, PURCHASED_AT)
--   FROM t GROUP BY 1, 2
-- )
-- SELECT d.DATE, w.PRECIP_MM >= 1 AS IS_RAINY, DAYOFWEEKISO(d.DATE) BETWEEN 1 AND 5 AS IS_WEEKDAY,
--        d.CATEGORY_LEVEL_1, d.SALES, d.ORDERS
-- FROM d JOIN TEAM_B_DB.DEVELOPMENT.QZ_WEATHER_TOKYO w ON w.DATE = d.DATE;
--
-- 7e) 天気の問題 1 問（中央値を 7 で見てから、VALUE と CORRECT を数字で埋めて INSERT。CORRECT は比較で決める）
-- INSERT INTO TEAM_B_DB.DEVELOPMENT.QZ_QUESTIONS (DECK, QTYPE, QUESTION_TEXT, ITEM_A, ITEM_B, METRIC, VALUE_A, VALUE_B, CORRECT, EXPLANATION, SQL_TEXT)
-- SELECT 'weather', 'highlow', '東京都の顧客の 1 日あたり注文数（平日の中央値）が多いのは？', '雨の日', '雨でない日', 'orders',
--        <雨の中央値>, <雨でない日の中央値>, IFF(<雨の中央値> > <雨でない日の中央値>, 0, 1),
--        '正解は「<向き>」。雨の日は 1 日 <A> 件、雨でない日は <B> 件。※雨＝降水 1mm 以上、平日のみ、中央値（絶対額はセールと週末に飲まれるので条件を揃えた）',
--        'SELECT IS_RAINY, MEDIAN(ORDERS) FROM QZ_AGG_WEATHER WHERE IS_WEEKDAY AND CATEGORY_LEVEL_1 = ''すべて'' GROUP BY 1';

-- =====================================================================
-- 8) AI 出題：プロシージャの有無と生成行。無ければ画面は「AI 出題は休憩中」で固定問題のみ
-- =====================================================================
SHOW PROCEDURES LIKE 'QZ_GENERATE%' IN SCHEMA TEAM_B_DB.DEVELOPMENT;
SELECT ID, DECK, QUESTION_TEXT, ITEM_A, VALUE_A, ITEM_B, VALUE_B, CORRECT, EXPLANATION
FROM QZ_QUESTIONS WHERE AI_GENERATED ORDER BY ID;
-- デモ用に 1 回動かす（戻り値＝生成 n／合格 m／落ちた理由）
-- CALL TEAM_B_DB.DEVELOPMENT.QZ_GENERATE_HIGHLOW('category', 3);

-- 8b) モデルが通らなかった時：mistral-large2 / llama3.1-70b は us-west-2 では legacy（未使用アカウントは呼べない）
--     llama3.1-8b はネイティブで legacy でない。TRY_COMPLETE は失敗で NULL（COMPLETE はエラーで落ちる）
-- SHOW CORTEX BASE MODELS;                                                  -- エラーなら飛ばす
-- SELECT SNOWFLAKE.CORTEX.TRY_COMPLETE('llama3.1-8b', 'Reply with OK') AS PING;
-- SELECT SNOWFLAKE.CORTEX.TRY_COMPLETE('claude-sonnet-4-5', 'Reply with OK') AS PING;   -- クロスリージョンが有効な時だけ通る

-- =====================================================================
-- 9) 回答ログとランキング（API と同じ定義：回答 3 件以上、不正解率の高い順 5 件）
-- =====================================================================
SELECT COUNT(*) AS ANSWERS, COUNT(DISTINCT PLAYER) AS PLAYERS, MIN(ANSWERED_AT) AS FIRST_AT FROM QZ_ANSWERS;
SELECT a.QUESTION_ID, q.QUESTION_TEXT, COUNT(*) AS N,
       ROUND(AVG(IFF(a.IS_CORRECT, 0, 1)) * 100, 0) AS WRONG_PCT
FROM QZ_ANSWERS a JOIN QZ_QUESTIONS q ON q.ID = a.QUESTION_ID
GROUP BY 1, 2 HAVING COUNT(*) >= 3
ORDER BY WRONG_PCT DESC, N DESC LIMIT 5;
-- 発表前に試遊ログを消すなら（凍結前にチームで決める。消すと会場のランキングは 0 から）
-- DELETE FROM QZ_ANSWERS WHERE ANSWERED_AT < '2026-09-09 14:30:00';

-- =====================================================================
-- 10) App Runtime の可否（画面担当の progress に無ければ 13:00 に実行）
--     値が空＝管理者セットアップ未了。その場合も snow app deploy は personal database（USER$）に配備され「本人だけ」開ける
--     → Streamlit へ書き直さず、発表者（田中さん）のアカウントでデプロイするか、localhost（npm run dev）で発表する
-- =====================================================================
SHOW PARAMETERS LIKE 'DEFAULT_SNOWFLAKE_APPS%' IN ACCOUNT;
SHOW APPLICATION SERVICES;                                          -- 既に配備されていれば名前と DB が出る

-- =====================================================================
-- 11) B と C の定義ずれの確認（13:20 追加。C の sql/02 は ORDERS=COUNT(*)（明細数）、QZ_BASE は .tsv.gz 行も落とす定義）
--     なぜ：同じ名前のテーブルを 2 台の CoCo が作り直していて、最後に走った方が残る。画面の定義（注文＝顧客×購入日時）と合っているかを数字で見る
-- =====================================================================
-- 11a) 今の QZ_BASE の定義（.tsv.gz の行を落としているか。チーム決定＝Apple Gift Card だけ除外、カテゴリ異物は「カテゴリ不明」で行は残す）
SELECT GET_DDL('VIEW', 'TEAM_B_DB.DEVELOPMENT.QZ_BASE');

-- 11b) QZ_AGG_STATE の ORDERS が注文数か明細数か（東京都で比較。ORDERS_IN_TABLE ≒ ORDERS_DISTINCT なら注文数、ROWS_ に近ければ明細数）
SELECT s.ORDERS AS ORDERS_IN_TABLE, s.AOV AS AOV_IN_TABLE,
       b.ORDERS_DISTINCT, b.ROWS_, ROUND(b.SALES / b.ORDERS_DISTINCT) AS AOV_DISTINCT
FROM TEAM_B_DB.DEVELOPMENT.QZ_AGG_STATE s
JOIN (SELECT COUNT(DISTINCT USER_ID_HASH, PURCHASED_AT) AS ORDERS_DISTINCT, COUNT(*) AS ROWS_, SUM(TOTAL_PRICE) AS SALES
      FROM TEAM_B_DB.DEVELOPMENT.QZ_BASE WHERE STATE_NAME = '東京都') b
WHERE s.STATE_NAME = '東京都';

-- 11c) 固定問題 ID 101（東京都 vs 大阪府の注文数）の VALUE が今のテーブルと一致するか
SELECT q.ID, q.ITEM_A, q.VALUE_A, a.ORDERS AS TABLE_A, q.ITEM_B, q.VALUE_B, b.ORDERS AS TABLE_B
FROM TEAM_B_DB.DEVELOPMENT.QZ_QUESTIONS q
LEFT JOIN TEAM_B_DB.DEVELOPMENT.QZ_AGG_STATE a ON a.STATE_NAME = q.ITEM_A
LEFT JOIN TEAM_B_DB.DEVELOPMENT.QZ_AGG_STATE b ON b.STATE_NAME = q.ITEM_B
WHERE q.ID = 101;

-- 11d) AI 生成問題（category）の VALUE が今の QZ_AGG_CAT と一致するか（B が後からテーブルを作り直すと古い値が残る）
SELECT q.ID, q.ITEM_A, q.ITEM_B, q.METRIC, q.VALUE_A, q.VALUE_B,
       CASE q.METRIC WHEN 'sales' THEN a.SALES WHEN 'orders' THEN a.ORDERS WHEN 'customers' THEN a.CUSTOMERS WHEN 'aov' THEN a.AOV WHEN 'female_share' THEN a.FEMALE_SHARE END AS TABLE_A,
       CASE q.METRIC WHEN 'sales' THEN b.SALES WHEN 'orders' THEN b.ORDERS WHEN 'customers' THEN b.CUSTOMERS WHEN 'aov' THEN b.AOV WHEN 'female_share' THEN b.FEMALE_SHARE END AS TABLE_B
FROM TEAM_B_DB.DEVELOPMENT.QZ_QUESTIONS q
LEFT JOIN TEAM_B_DB.DEVELOPMENT.QZ_AGG_CAT a ON a.CATEGORY_LEVEL_1 = q.ITEM_A
LEFT JOIN TEAM_B_DB.DEVELOPMENT.QZ_AGG_CAT b ON b.CATEGORY_LEVEL_1 = q.ITEM_B
WHERE q.AI_GENERATED AND q.DECK = 'category'
ORDER BY q.ID;

-- 11e) QZ_AGG_CAT にカテゴリ異物（ページ名・ファイル名）が残っていないか（AI が拾うと問題文に混ざる）
SELECT CATEGORY_LEVEL_1, SALES FROM TEAM_B_DB.DEVELOPMENT.QZ_AGG_CAT ORDER BY SALES DESC;

-- 11f) ずれていた時の直し方（B のテーブルが確定した後に 1 回だけ）：AI 生成を消して作り直す（重複も消える）
-- DELETE FROM TEAM_B_DB.DEVELOPMENT.QZ_QUESTIONS WHERE AI_GENERATED;
-- CALL TEAM_B_DB.DEVELOPMENT.QZ_GENERATE_HIGHLOW('category', 5);
