-- ① 固定問題の除外後値 UPDATE

USE WAREHOUSE TEAM_B_WH;

-- ID 1: 優良顧客 AOV=6482, それ以外=6915
UPDATE TEAM_B_DB.DEVELOPMENT.QZ_QUESTIONS
SET VALUE_A = 6482, VALUE_B = 6915, CORRECT = 1,
    SQL_TEXT = 'SELECT rfm_segment, ROUND(SUM(total_price)/COUNT(DISTINCT user_id_hash||''|''||purchased_at::string)) AS aov FROM TEAM_B_DB.DEVELOPMENT.QZ_BASE GROUP BY 1'
WHERE ID = 1;

-- ID 3: 化粧品以外の1位がペット→キッズ・ベビー・マタニティに変更
UPDATE TEAM_B_DB.DEVELOPMENT.QZ_QUESTIONS
SET QUESTION_TEXT = '化粧品以外で優良顧客が一番買うのは キッズ・ベビー・マタニティ？ 花・ガーデン・DIY？',
    ITEM_A = 'キッズ・ベビー・マタニティ',
    ITEM_B = '花・ガーデン・DIY',
    VALUE_A = 11.9, VALUE_B = 8.8, CORRECT = 0, METRIC = 'sales_share',
    SQL_TEXT = 'WITH base AS (SELECT category_level_1, sales FROM TEAM_B_DB.DEVELOPMENT.QZ_AGG_SEG_CAT WHERE rfm_segment=''優良顧客'' AND category_level_1 != ''美容・コスメ・香水''), total AS (SELECT SUM(sales) AS total_sales FROM base) SELECT b.category_level_1, ROUND(100.0*b.sales/t.total_sales,1) AS share_pct FROM base b, total t ORDER BY share_pct DESC'
WHERE ID = 3;

-- ID 101: 東京168694, 大阪86857
UPDATE TEAM_B_DB.DEVELOPMENT.QZ_QUESTIONS
SET VALUE_A = 168694, VALUE_B = 86857, CORRECT = 0,
    SQL_TEXT = 'SELECT state_name, orders FROM TEAM_B_DB.DEVELOPMENT.QZ_AGG_STATE WHERE state_name IN (''東京都'', ''大阪府'')'
WHERE ID = 101;

-- ID 102: 12月717043406, 3月594159884
UPDATE TEAM_B_DB.DEVELOPMENT.QZ_QUESTIONS
SET VALUE_A = 717043406, VALUE_B = 594159884, CORRECT = 0,
    SQL_TEXT = 'SELECT purchase_month, SUM(sales) AS total_sales FROM TEAM_B_DB.DEVELOPMENT.QZ_AGG_MONTH_CAT WHERE purchase_month IN (''2023-12-01'', ''2024-03-01'') GROUP BY 1'
WHERE ID = 102;

-- ID 103: 美容67.7, ペット63.8
UPDATE TEAM_B_DB.DEVELOPMENT.QZ_QUESTIONS
SET VALUE_A = 67.7, VALUE_B = 63.8, CORRECT = 0,
    SQL_TEXT = 'SELECT category_level_1, female_share FROM TEAM_B_DB.DEVELOPMENT.QZ_AGG_CAT WHERE category_level_1 IN (''美容・コスメ・香水'', ''ペット・ペットグッズ'')'
WHERE ID = 103;
