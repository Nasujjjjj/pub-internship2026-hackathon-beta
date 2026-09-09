-- 天気問題 1 問 INSERT
-- 雨の日 vs 非雨の日の注文数（平日中央値）
-- 検算: 雨 median=322, 非雨 median=288, 差 11.8% (> 3%)
USE WAREHOUSE TEAM_B_WH;

INSERT INTO TEAM_B_DB.DEVELOPMENT.QZ_QUESTIONS
    (DECK, QTYPE, QUESTION_TEXT, ITEM_A, ITEM_B, METRIC, VALUE_A, VALUE_B, CORRECT, EXPLANATION, SQL_TEXT, AI_GENERATED)
VALUES
('weather', 'highlow',
 '東京都の顧客の1日あたり注文数（平日の中央値）が多いのは？',
 '雨の日', '雨でない日',
 'orders',
 322, 288,
 0,
 '正解は雨の日（中央値322件）。雨でない日は288件で、雨の日が約12%多い。雨で外出が減るとECに流れる効果が数字に表れている。※雨＝東京の降水量1mm以上（NOAA観測所JA000047662）、平日のみ（月〜金）、中央値で比較（セールや週末の影響を排除）。期間2023/4〜2024/3',
 'SELECT IS_RAINY, MEDIAN(ORDERS) AS MEDIAN_ORDERS FROM TEAM_B_DB.DEVELOPMENT.QZ_AGG_WEATHER WHERE IS_WEEKDAY = TRUE AND CATEGORY_LEVEL_1 = ''すべて'' GROUP BY IS_RAINY',
 FALSE);
