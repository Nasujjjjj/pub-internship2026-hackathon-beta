-- ① Apple Gift Card 除外後の集計テーブル5本を再作成
-- 注文＝顧客×購入日時（COUNT(DISTINCT user_id_hash, purchased_at)）
-- AOV＝売上÷注文数
-- カテゴリ異物＝「カテゴリ不明」
-- STATE '不明' 除外

USE WAREHOUSE TEAM_B_WH;

-- 1. QZ_AGG_CAT: カテゴリ別集計
CREATE OR REPLACE TABLE TEAM_B_DB.DEVELOPMENT.QZ_AGG_CAT AS
SELECT
    COALESCE(NULLIF(category_level_1, ''), 'カテゴリ不明') AS category_level_1,
    SUM(total_price) AS sales,
    COUNT(DISTINCT user_id_hash || '|' || purchased_at::string) AS orders,
    COUNT(DISTINCT user_id_hash) AS customers,
    ROUND(SUM(total_price) / NULLIF(COUNT(DISTINCT user_id_hash || '|' || purchased_at::string), 0)) AS aov,
    ROUND(100.0 * COUNT(DISTINCT IFF(gender_name = '女性', user_id_hash, NULL))
        / NULLIF(COUNT(DISTINCT user_id_hash), 0), 1) AS female_share,
    ROUND(AVG(age), 1) AS avg_age
FROM TEAM_B_DB.DEVELOPMENT.QZ_BASE
GROUP BY 1;

-- 2. QZ_AGG_STATE: 都道府県別集計（'不明' 除外）
CREATE OR REPLACE TABLE TEAM_B_DB.DEVELOPMENT.QZ_AGG_STATE AS
SELECT
    state_name,
    SUM(total_price) AS sales,
    COUNT(DISTINCT user_id_hash || '|' || purchased_at::string) AS orders,
    COUNT(DISTINCT user_id_hash) AS customers,
    ROUND(SUM(total_price) / NULLIF(COUNT(DISTINCT user_id_hash || '|' || purchased_at::string), 0)) AS aov
FROM TEAM_B_DB.DEVELOPMENT.QZ_BASE
WHERE state_name != '不明'
GROUP BY 1;

-- 3. QZ_AGG_MONTH_CAT: 月×カテゴリ別集計
CREATE OR REPLACE TABLE TEAM_B_DB.DEVELOPMENT.QZ_AGG_MONTH_CAT AS
SELECT
    purchase_month,
    COALESCE(NULLIF(category_level_1, ''), 'カテゴリ不明') AS category_level_1,
    SUM(total_price) AS sales,
    COUNT(DISTINCT user_id_hash || '|' || purchased_at::string) AS orders
FROM TEAM_B_DB.DEVELOPMENT.QZ_BASE
GROUP BY 1, 2;

-- 4. QZ_AGG_WEEK_CAT: 週×カテゴリ別集計（週の始まり月曜）
CREATE OR REPLACE TABLE TEAM_B_DB.DEVELOPMENT.QZ_AGG_WEEK_CAT AS
SELECT
    DATE_TRUNC('WEEK', purchased_at)::DATE AS week_start,
    COALESCE(NULLIF(category_level_1, ''), 'カテゴリ不明') AS category_level_1,
    SUM(total_price) AS sales,
    COUNT(DISTINCT user_id_hash || '|' || purchased_at::string) AS orders
FROM TEAM_B_DB.DEVELOPMENT.QZ_BASE
GROUP BY 1, 2;

-- 5. QZ_AGG_SEG_CAT: セグメント×カテゴリ別集計
CREATE OR REPLACE TABLE TEAM_B_DB.DEVELOPMENT.QZ_AGG_SEG_CAT AS
SELECT
    rfm_segment,
    COALESCE(NULLIF(category_level_1, ''), 'カテゴリ不明') AS category_level_1,
    SUM(total_price) AS sales,
    ROUND(100.0 * RATIO_TO_REPORT(SUM(total_price)) OVER (PARTITION BY rfm_segment), 2) AS share
FROM TEAM_B_DB.DEVELOPMENT.QZ_BASE
GROUP BY 1, 2;
