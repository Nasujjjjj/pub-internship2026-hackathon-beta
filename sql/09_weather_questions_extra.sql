-- 天気問題 追加 4 問 INSERT
-- QZ_AGG_WEATHER から算出した実値
-- 既存の ID 401（平日注文数 雨vs非雨）に加えて 4 問追加
USE WAREHOUSE TEAM_B_WH;

INSERT INTO TEAM_B_DB.DEVELOPMENT.QZ_QUESTIONS
    (DECK, QTYPE, QUESTION_TEXT, ITEM_A, ITEM_B, METRIC, VALUE_A, VALUE_B, CORRECT, EXPLANATION, SQL_TEXT, AI_GENERATED)
VALUES
-- 平日の売上中央値 雨 vs 非雨
('weather', 'highlow',
 '東京都の顧客の平日1日あたり売上（中央値）が多いのは雨の日？雨でない日？',
 '雨の日', '雨でない日',
 'sales',
 2221295, 2115490,
 0,
 '正解は雨の日（中央値 約222万円）。雨でない日は約212万円。注文数だけでなく売上額でも雨の日が上回る。※平日のみ・中央値、雨＝降水1mm以上',
 'SELECT IS_RAINY, MEDIAN(SALES) AS MEDIAN_SALES FROM TEAM_B_DB.DEVELOPMENT.QZ_AGG_WEATHER WHERE IS_WEEKDAY = TRUE AND CATEGORY_LEVEL_1 = ''すべて'' GROUP BY IS_RAINY',
 FALSE),

-- 休日の注文数 雨 vs 非雨
('weather', 'highlow',
 '休日の注文数（中央値）が多いのは雨の日？雨でない日？',
 '雨の日', '雨でない日',
 'orders',
 347, 277,
 0,
 '正解は雨の日（中央値347件 vs 277件）。休日は平日以上に雨の影響が大きく、外出を諦めてECに流れる効果が25%もある。※休日＝土日、東京都の顧客のみ',
 'SELECT IS_RAINY, MEDIAN(ORDERS) AS MEDIAN_ORDERS FROM TEAM_B_DB.DEVELOPMENT.QZ_AGG_WEATHER WHERE IS_WEEKDAY = FALSE AND CATEGORY_LEVEL_1 = ''すべて'' GROUP BY IS_RAINY',
 FALSE),

-- 雨の日にシェアが最も上がるカテゴリ
('weather', 'highlow',
 '雨の日に売上構成比が最も上がるカテゴリは？スマートフォン・タブレット？テレビゲーム？',
 'スマートフォン・タブレット', 'テレビゲーム',
 'sales_share',
 1.46, -1.19,
 0,
 '正解はスマートフォン・タブレット（雨の日+1.46pt）。テレビゲームはむしろ-1.19ptと雨の日に下がる。スマホは即需要、ゲームは計画購入で天気に左右されにくい。※構成比の雨vs非雨の中央値の差',
 'WITH daily_share AS (SELECT DATE, IS_RAINY, CATEGORY_LEVEL_1, 100.0 * SALES / NULLIF(SUM(SALES) OVER (PARTITION BY DATE), 0) AS SHARE FROM TEAM_B_DB.DEVELOPMENT.QZ_AGG_WEATHER WHERE IS_WEEKDAY = TRUE AND CATEGORY_LEVEL_1 != ''すべて'') SELECT CATEGORY_LEVEL_1, ROUND(MEDIAN(CASE WHEN IS_RAINY THEN SHARE END) - MEDIAN(CASE WHEN NOT IS_RAINY THEN SHARE END), 2) AS DIFF FROM daily_share GROUP BY 1 ORDER BY ABS(DIFF) DESC',
 FALSE),

-- 平均注文単価 雨 vs 非雨
('weather', 'highlow',
 '東京都の平日1注文あたり金額（中央値）が高いのは雨の日？雨でない日？',
 '雨の日', '雨でない日',
 'aov',
 6705, 7201,
 1,
 '正解は雨でない日（中央値7,201円 vs 雨の日6,705円）。雨の日は注文数は増えるが、少額の日用品が増えるため単価は下がる。数と単価は逆方向に動く。※平日のみ、東京都の顧客',
 'SELECT IS_RAINY, ROUND(MEDIAN(SALES / NULLIF(ORDERS, 0))) AS MEDIAN_AOV FROM TEAM_B_DB.DEVELOPMENT.QZ_AGG_WEATHER WHERE IS_WEEKDAY = TRUE AND CATEGORY_LEVEL_1 = ''すべて'' GROUP BY IS_RAINY',
 FALSE);
