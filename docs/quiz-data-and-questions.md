# クイズゲーム データ & 問題設計書

## 使用テーブル一覧

### メインテーブル（楽天購買）

| テーブル | 行数 | 期間 | 用途 |
|---|---|---|---|
| `TEAM_B_DB.DEVELOPMENT.MART_RAKUTEN_PURCHASES_RFM` | 1,468,432 | 2023/4/1〜2024/3/31 | 大福帳（全トランザクション＋RFMセグメント） |

主要カラム:
- `USER_ID_HASH`, `PURCHASED_AT`, `PURCHASE_DATE`, `PURCHASE_MONTH`
- `UNIT_PRICE`, `AMOUNT`, `TOTAL_PRICE`
- `ITEM_NAME`, `STORE_NAME`, `CATEGORY_LEVEL_1`〜`CATEGORY_LEVEL_4`
- `GENDER_NAME`, `AGE`, `AGE_CATEGORY`, `STATE_NAME`, `REGION`
- `MARRIAGE_STATUS`, `PROFESSION_NAME`, `OCCUPATION_NAME`
- `DISCOUNT_FLAG`, `DISCOUNT_AMOUNT`
- `IS_PREMIUM_CUSTOMER`, `IS_TARGET_CUSTOMER`, `RFM_SEGMENT`

### 集計テーブル（クイズ向け事前集計済み）

| テーブル | 行数 | 切り口 | 主要カラム |
|---|---|---|---|
| `QZ_AGG_CAT` | 38 | カテゴリ別 | `CATEGORY_LEVEL_1`, `SALES`, `ORDERS`, `CUSTOMERS`, `AOV`, `FEMALE_SHARE`, `AVG_AGE` |
| `QZ_AGG_STATE` | 47 | 都道府県別 | `STATE_NAME`, `SALES`, `ORDERS`, `CUSTOMERS`, `AOV` |
| `QZ_AGG_MONTH_CAT` | 456 | 月×カテゴリ別 | `PURCHASE_MONTH`, `CATEGORY_LEVEL_1`, `SALES`, `ORDERS` |
| `QZ_AGG_WEEK_CAT` | 2,014 | 週×カテゴリ別 | 同上（週単位） |
| `QZ_AGG_SEG_CAT` | 152 | RFMセグメント×カテゴリ別 | `RFM_SEGMENT`, `CATEGORY_LEVEL_1`, `SALES`, `SHARE` |

### 天気データ（NOAA 公開データ）

| テーブル | 用途 |
|---|---|
| `SNOWFLAKE_PUBLIC_DATA_FREE.PUBLIC_DATA_FREE.NOAA_WEATHER_METRICS_TIMESERIES` | 東京の日次気温・降水量 |
| `SNOWFLAKE_PUBLIC_DATA_FREE.PUBLIC_DATA_FREE.NOAA_WEATHER_STATION_INDEX` | ステーション情報 |

東京ステーション: `JA000047662`
利用可能指標: `precipitation`(mm), `maximum_temperature`(°C), `minimum_temperature`(°C), `average_daily_temperature...`(°C), `snow_depth`(mm)

### クイズ管理テーブル（既存）

| テーブル | 用途 |
|---|---|
| `QZ_QUESTIONS` | 問題マスタ（6問登録済み） |
| `QZ_ANSWERS` | 回答ログ |

---

## 固定10問

意外性が高い順に前半配置。すべて High & Low 形式。

---

### Q1 [deck: segment] 優良顧客の平均購入単価

**問題文:** 優良顧客の平均購入単価は、それ以外の顧客より高い？低い？
- A: 優良顧客（6,953円）
- B: それ以外（7,474円）
- **正解: B（優良顧客の方が低い！）**

**解説:** 優良顧客は購入頻度が高い分、1回あたりの単価は6,953円とむしろ低め。それ以外の顧客は7,474円で、まとめ買い傾向がある。

```sql
SELECT
  CASE WHEN RFM_SEGMENT = '優良顧客' THEN '優良顧客' ELSE 'それ以外' END AS SEG,
  ROUND(SUM(TOTAL_PRICE) / NULLIF(COUNT(DISTINCT USER_ID_HASH || '|' || PURCHASED_AT), 0)) AS AOV
FROM TEAM_B_DB.DEVELOPMENT.MART_RAKUTEN_PURCHASES_RFM
GROUP BY SEG;
```

---

### Q2 [deck: segment] 優良顧客の注文頻度

**問題文:** 優良顧客の1人あたり注文数は、それ以外の顧客の5倍より多い？少ない？
- A: 優良顧客（82.7回）
- B: それ以外の5倍（67.0回）
- **正解: A（5倍を超えて約6.2倍！）**

**解説:** 優良顧客は1人あたり82.7回も注文しており、それ以外（13.4回）の約6.2倍。5倍の67.0回を大きく上回る。

```sql
SELECT
  CASE WHEN RFM_SEGMENT = '優良顧客' THEN '優良顧客' ELSE 'それ以外' END AS SEG,
  ROUND(COUNT(DISTINCT USER_ID_HASH || '|' || PURCHASED_AT)
        / NULLIF(COUNT(DISTINCT USER_ID_HASH), 0), 1) AS ORDERS_PER_CUST
FROM TEAM_B_DB.DEVELOPMENT.MART_RAKUTEN_PURCHASES_RFM
GROUP BY SEG;
```

---

### Q3 [deck: weather] 雨の日 vs 晴れの日

**問題文:** 東京で雨の日と晴れの日、楽天の1日平均注文数が多いのはどっち？
- A: 雨の日（4,411件/日）
- B: 晴れの日（3,881件/日）
- **正解: A（雨の日！約14%増）**

**解説:** 雨の日は外出が減る分、ECの注文が約14%増える。「雨だからネットで買おう」は数字で裏付けられた。

```sql
WITH weather AS (
  SELECT DATE, VALUE AS precip
  FROM SNOWFLAKE_PUBLIC_DATA_FREE.PUBLIC_DATA_FREE.NOAA_WEATHER_METRICS_TIMESERIES
  WHERE NOAA_WEATHER_STATION_ID = 'JA000047662'
    AND VARIABLE = 'precipitation'
    AND DATE >= '2023-04-01' AND DATE < '2024-04-01'
),
purchases AS (
  SELECT PURCHASE_DATE::DATE AS pd, COUNT(*) AS orders, SUM(TOTAL_PRICE) AS sales
  FROM TEAM_B_DB.DEVELOPMENT.MART_RAKUTEN_PURCHASES_RFM
  GROUP BY pd
)
SELECT
  CASE WHEN w.precip > 0 THEN '雨の日' ELSE '晴れの日' END AS weather_type,
  COUNT(DISTINCT w.DATE) AS days,
  ROUND(AVG(p.orders)) AS avg_daily_orders,
  ROUND(AVG(p.sales)) AS avg_daily_sales
FROM weather w
JOIN purchases p ON w.DATE = p.pd
GROUP BY weather_type;
```

---

### Q4 [deck: month] 年間売上No.1の月

**問題文:** 1年で最も売上が高い月は12月？それとも9月？
- A: 12月（7.71億円）
- B: 9月（9.19億円）
- **正解: B（9月！）**

**解説:** 楽天スーパーSALEなどのセールイベントが重なる9月が年間最高。年末商戦の12月を約1.5億円上回る。

```sql
SELECT
  PURCHASE_MONTH,
  SUM(SALES) AS SALES,
  SUM(ORDERS) AS ORDERS
FROM TEAM_B_DB.DEVELOPMENT.QZ_AGG_MONTH_CAT
GROUP BY PURCHASE_MONTH
ORDER BY SALES DESC;
```

---

### Q5 [deck: state] 北海道 vs 福岡

**問題文:** 北海道と福岡県、注文数が多いのはどっち？
- A: 北海道（49,203件）
- B: 福岡県（49,210件）
- **正解: B（福岡がわずか7件差で勝利！）**

**解説:** ほぼ同数。人口は福岡が約500万人、北海道が約520万人で同水準。EC利用率もほぼ同じという結果に。

```sql
SELECT STATE_NAME, ORDERS
FROM TEAM_B_DB.DEVELOPMENT.QZ_AGG_STATE
WHERE STATE_NAME IN ('北海道', '福岡県')
ORDER BY ORDERS DESC;
```

---

### Q6 [deck: category] 男性 vs 女性の平均購入金額

**問題文:** 男性と女性、1回あたりの平均購入金額が高いのはどっち？
- A: 男性（8,114円）
- B: 女性（4,317円）
- **正解: A（男性がほぼ2倍！）**

**解説:** 男性は家電・時計・ゴルフなど高額カテゴリに偏り、女性は美容・コスメ・キッズなど低単価カテゴリが多い。

```sql
SELECT
  GENDER_NAME,
  COUNT(*) AS orders,
  ROUND(AVG(TOTAL_PRICE)) AS avg_price
FROM TEAM_B_DB.DEVELOPMENT.MART_RAKUTEN_PURCHASES_RFM
WHERE GENDER_NAME IN ('男性', '女性')
GROUP BY GENDER_NAME;
```

---

### Q7 [deck: segment] 未婚 vs 既婚

**問題文:** 未婚者と既婚者、1回あたりの平均購入金額が高いのはどっち？
- A: 未婚（6,310円）
- B: 既婚（5,381円）
- **正解: A（未婚が高い）**

**解説:** 未婚者は自分への投資が中心で1回の単価が高め。既婚者は日用品の小口購入が多い。

```sql
SELECT
  MARRIAGE_STATUS,
  COUNT(*) AS orders,
  ROUND(AVG(TOTAL_PRICE)) AS avg_price
FROM TEAM_B_DB.DEVELOPMENT.MART_RAKUTEN_PURCHASES_RFM
WHERE MARRIAGE_STATUS IN ('既婚', '未婚')
GROUP BY MARRIAGE_STATUS;
```

---

### Q8 [deck: month] 夏 vs 冬の注文数

**問題文:** 真夏の8月と真冬の1月、注文数が少ないのはどっち？
- A: 8月（105,864件）
- B: 1月（89,841件）
- **正解: B（1月が年間最少）**

**解説:** 1月は年末年始の出費疲れで年間最少。8月も夏休みで外出が増え少ないが、1月には及ばない。気温との対応データ: 8月=29.3°C / 1月=7.1°C。

```sql
-- 月別注文数
SELECT PURCHASE_MONTH, SUM(ORDERS) AS ORDERS
FROM TEAM_B_DB.DEVELOPMENT.QZ_AGG_MONTH_CAT
WHERE PURCHASE_MONTH IN ('2023-08-01', '2024-01-01')
GROUP BY PURCHASE_MONTH;

-- 月別平均気温（参考）
SELECT DATE_TRUNC('month', DATE)::DATE AS month, ROUND(AVG(VALUE), 1) AS avg_temp
FROM SNOWFLAKE_PUBLIC_DATA_FREE.PUBLIC_DATA_FREE.NOAA_WEATHER_METRICS_TIMESERIES
WHERE NOAA_WEATHER_STATION_ID = 'JA000047662'
  AND VARIABLE LIKE 'average%'
  AND DATE >= '2023-04-01' AND DATE < '2024-04-01'
GROUP BY month
ORDER BY month;
```

---

### Q9 [deck: category] 平均単価No.1カテゴリ

**問題文:** 腕時計とTV・オーディオ・カメラ、平均購入単価が高いのはどっち？
- A: 腕時計（24,213円）
- B: TV・オーディオ・カメラ（23,369円）
- **正解: A（腕時計が全カテゴリNo.1）**

**解説:** 腕時計が全38カテゴリ中No.1。ブランド品が単価を押し上げている。TV・オーディオは僅差の2位。

```sql
SELECT CATEGORY_LEVEL_1, AOV, ORDERS, CUSTOMERS
FROM TEAM_B_DB.DEVELOPMENT.QZ_AGG_CAT
ORDER BY AOV DESC
LIMIT 5;
```

---

### Q10 [deck: state] 関東 vs 近畿の平均購入金額

**問題文:** 関東と近畿、1回あたりの平均購入金額が高いのはどっち？
- A: 関東（6,057円）
- B: 近畿（5,542円）
- **正解: A（関東）**

**解説:** 関東は約500円の差で高い。家電やスマートフォンなど高額カテゴリの構成比が影響している。

```sql
SELECT
  REGION,
  COUNT(*) AS orders,
  SUM(TOTAL_PRICE) AS sales,
  ROUND(AVG(TOTAL_PRICE)) AS avg_price
FROM TEAM_B_DB.DEVELOPMENT.MART_RAKUTEN_PURCHASES_RFM
WHERE REGION IN ('関東', '近畿')
GROUP BY REGION;
```

---

## 追加候補（天気デッキ等）

### Q11 [deck: weather] 気温と売上の底

**問題文:** 年間で最も暑い月（8月, 29.3°C）と最も寒い月（1月, 7.1°C）、売上が低いのはどっち？
- A: 8月（6.02億円）
- B: 1月（5.22億円）
- **正解: B（1月）**

**解説:** どちらも年間の底だが、1月が最低。気温ではなく年末年始の消費パターンが支配的。

```sql
WITH weather AS (
  SELECT DATE_TRUNC('month', DATE)::DATE AS month, ROUND(AVG(VALUE), 1) AS temp
  FROM SNOWFLAKE_PUBLIC_DATA_FREE.PUBLIC_DATA_FREE.NOAA_WEATHER_METRICS_TIMESERIES
  WHERE NOAA_WEATHER_STATION_ID = 'JA000047662'
    AND VARIABLE LIKE 'average%'
    AND DATE >= '2023-04-01' AND DATE < '2024-04-01'
  GROUP BY month
),
monthly_sales AS (
  SELECT PURCHASE_MONTH::DATE AS month, SUM(SALES) AS sales
  FROM TEAM_B_DB.DEVELOPMENT.QZ_AGG_MONTH_CAT
  GROUP BY month
)
SELECT w.month, w.temp, s.sales
FROM weather w JOIN monthly_sales s ON w.month = s.month
ORDER BY w.month;
```

### Q12 [deck: segment] 優良顧客のペット支出

**問題文:** 化粧品以外で優良顧客が一番お金を使うカテゴリは？ペット・ペットグッズ？ダイエット・健康？
- A: ペット・ペットグッズ（13.0%）
- B: ダイエット・健康（5.3%）
- **正解: A（ペットが2位で13%）**

**解説:** ペット・ペットグッズが13.0%で堂々2位。ダイエット・健康は5.3%で、ペットの半分以下。

```sql
WITH base AS (
  SELECT CATEGORY_LEVEL_1, SALES
  FROM TEAM_B_DB.DEVELOPMENT.QZ_AGG_SEG_CAT
  WHERE RFM_SEGMENT = '優良顧客'
    AND CATEGORY_LEVEL_1 != '美容・コスメ・香水'
),
total AS (SELECT SUM(SALES) AS S FROM base)
SELECT b.CATEGORY_LEVEL_1, ROUND(100.0 * b.SALES / t.S, 1) AS SHARE
FROM base b, total t
ORDER BY SHARE DESC;
```

### Q13 [deck: category] 30代 vs 70代

**問題文:** 30代と70代、1回あたりの平均購入金額が高いのはどっち？
- A: 30代（5,691円）
- B: 70代（6,610円）
- **正解: B（70代が高い）**

**解説:** 70代は購入頻度は低いが、1回あたりの単価が最も高い。品質重視の購買傾向がうかがえる。

```sql
SELECT
  AGE_CATEGORY,
  COUNT(*) AS orders,
  ROUND(AVG(TOTAL_PRICE)) AS avg_price
FROM TEAM_B_DB.DEVELOPMENT.MART_RAKUTEN_PURCHASES_RFM
WHERE AGE_CATEGORY IN ('30代', '70代')
GROUP BY AGE_CATEGORY;
```

---

## AI生成問題の仕組み（参考）

集計テーブル（`QZ_AGG_*`）から「直感と逆」「差が僅差」のペアを自動抽出し、AI が問題文と解説を生成する。

```sql
-- 例: カテゴリ別AOVで僅差のペアを探す
SELECT
  a.CATEGORY_LEVEL_1 AS cat_a,
  b.CATEGORY_LEVEL_1 AS cat_b,
  a.AOV AS aov_a,
  b.AOV AS aov_b,
  ABS(a.AOV - b.AOV) AS diff
FROM TEAM_B_DB.DEVELOPMENT.QZ_AGG_CAT a
JOIN TEAM_B_DB.DEVELOPMENT.QZ_AGG_CAT b
  ON a.CATEGORY_LEVEL_1 < b.CATEGORY_LEVEL_1
WHERE a.ORDERS > 5000 AND b.ORDERS > 5000
ORDER BY diff ASC
LIMIT 10;
```

---

## 月別売上 × 気温 参考データ

| 月 | 平均気温(°C) | 売上(億円) | 注文数 |
|---|---|---|---|
| 2023-04 | 16.4 | 7.18 | 131,923 |
| 2023-05 | 19.0 | 6.74 | 125,930 |
| 2023-06 | 23.3 | 8.01 | 154,747 |
| 2023-07 | 28.7 | 6.94 | 130,001 |
| 2023-08 | 29.3 | 6.02 | 105,864 |
| 2023-09 | 26.7 | 9.19 | 147,472 |
| 2023-10 | 18.8 | 6.60 | 113,082 |
| 2023-11 | 14.3 | 7.92 | 122,907 |
| 2023-12 | 9.4 | 7.71 | 130,907 |
| 2024-01 | 7.1 | 5.22 | 89,841 |
| 2024-02 | 8.0 | 4.79 | 90,103 |
| 2024-03 | 8.8 | 6.56 | 125,655 |

---

## SNOWFLAKE_PUBLIC_DATA_FREE から使える追加データソース

以下は `SNOWFLAKE_PUBLIC_DATA_FREE.PUBLIC_DATA_FREE` に含まれる370ビューのうち、クイズに活用しやすいもの。

### 1. 祝日カレンダー（日本対応）

**テーブル:** `PUBLIC_HOLIDAY_CALENDAR`
- 1970年以降の世界各国の祝日。日本は `GEO_ID = 'country/JPN'`
- 楽天データとクロスすると「祝日 vs 通常平日」の比較が可能

**実データ:**
| 日タイプ | 日数 | 平均日次注文 | 平均日次売上 |
|---|---|---|---|
| 通常平日 | 246 | 3,975 | 22,367,730円 |
| 祝日（平日） | 14 | 2,558 | 15,094,506円 |

**クイズ例:** 「祝日（平日扱い）と通常平日、楽天の注文数が多いのはどっち？」
→ 正解: 通常平日（祝日は36%も少ない！外出やお出かけで買い物が後回しに）

```sql
WITH holidays AS (
  SELECT DATE::DATE AS hd
  FROM SNOWFLAKE_PUBLIC_DATA_FREE.PUBLIC_DATA_FREE.PUBLIC_HOLIDAY_CALENDAR
  WHERE GEO_ID = 'country/JPN' AND DATE >= '2023-04-01' AND DATE < '2024-04-01'
),
purchases AS (
  SELECT PURCHASE_DATE::DATE AS pd, COUNT(*) AS orders, SUM(TOTAL_PRICE) AS sales
  FROM TEAM_B_DB.DEVELOPMENT.MART_RAKUTEN_PURCHASES_RFM
  GROUP BY pd
)
SELECT
  CASE WHEN h.hd IS NOT NULL THEN '祝日' ELSE '通常平日' END AS day_type,
  COUNT(*) AS days,
  ROUND(AVG(p.orders)) AS avg_daily_orders,
  ROUND(AVG(p.sales)) AS avg_daily_sales
FROM purchases p
LEFT JOIN holidays h ON p.pd = h.hd
WHERE DAYOFWEEK(p.pd) NOT IN (0, 6)
GROUP BY day_type;
```

---

### 2. OECD 平均年収（国際比較）

**テーブル:** `OECD_TIMESERIES` + `OECD_ATTRIBUTES`
- OECD加盟国の平均年収（PPP換算USD）。日本 vs 韓国 vs 米国 vs ドイツ

**実データ (2023年, PPP USD):**
| 国 | 平均年収 |
|---|---|
| 米国 | $83,866 |
| ドイツ | $72,953 |
| 韓国 | $59,198 |
| 日本 | $49,970 |

**クイズ例:** 「日本と韓国、平均年収（PPP換算）が高いのはどっち？」
→ 正解: 韓国（$59,198 vs $49,970。2015年頃に逆転された）

```sql
SELECT t.GEO_ID, t.DATE, ROUND(t.VALUE) AS avg_wage_usd
FROM SNOWFLAKE_PUBLIC_DATA_FREE.PUBLIC_DATA_FREE.OECD_TIMESERIES t
JOIN SNOWFLAKE_PUBLIC_DATA_FREE.PUBLIC_DATA_FREE.OECD_ATTRIBUTES a ON t.VARIABLE = a.VARIABLE
WHERE t.GEO_ID IN ('country/JPN', 'country/USA', 'country/DEU', 'country/KOR')
  AND a.VARIABLE_NAME = 'Average annual wages at constant prices in US dollars, Purchasing Power Parity converted'
  AND t.DATE >= '2020-01-01'
ORDER BY t.DATE DESC, t.GEO_ID;
```

---

### 3. CO2排出量（1人あたり、国際比較）

**テーブル:** `OUR_WORLD_IN_DATA_TIMESERIES` + `OUR_WORLD_IN_DATA_ATTRIBUTES`
- Our World in Data提供。国別の1人あたりCO2排出量

**実データ (2024年, トン/人):**
| 国 | CO2/人 |
|---|---|
| 米国 | 14.52 |
| 韓国 | 11.22 |
| 中国 | 8.43 |
| 日本 | 7.82 |
| ドイツ | 6.71 |
| インド | 2.21 |

**クイズ例:** 「1人あたりCO2排出量、日本と中国で多いのはどっち？」
→ 正解: 中国（8.43 vs 7.82。総量では圧倒的に中国だが、1人あたりでも日本を上回るようになった）

```sql
SELECT t.GEO_ID, t.DATE, ROUND(t.VALUE, 2) AS co2_per_capita
FROM SNOWFLAKE_PUBLIC_DATA_FREE.PUBLIC_DATA_FREE.OUR_WORLD_IN_DATA_TIMESERIES t
JOIN SNOWFLAKE_PUBLIC_DATA_FREE.PUBLIC_DATA_FREE.OUR_WORLD_IN_DATA_ATTRIBUTES a ON t.VARIABLE = a.VARIABLE
WHERE t.GEO_ID IN ('country/JPN', 'country/USA', 'country/DEU', 'country/CHN', 'country/KOR', 'country/IND')
  AND a.VARIABLE_NAME = 'Annual CO2 emissions including land-use change per capita'
  AND t.DATE >= '2020-01-01'
ORDER BY t.DATE DESC, t.GEO_ID;
```

---

### 4. BIS 中央銀行政策金利

**テーブル:** `BANK_FOR_INTERNATIONAL_SETTLEMENTS_TIMESERIES` + `BANK_FOR_INTERNATIONAL_SETTLEMENTS_ATTRIBUTES`
- 各国の中央銀行政策金利（日次）。日本は日銀の金利

**クイズ例:** 「2026年6月時点の日銀の政策金利は？ 0.5%？ 0.75%？」
→ 正解: 0.75%

```sql
SELECT a.VARIABLE_NAME, t.DATE, t.VALUE
FROM SNOWFLAKE_PUBLIC_DATA_FREE.PUBLIC_DATA_FREE.BANK_FOR_INTERNATIONAL_SETTLEMENTS_TIMESERIES t
JOIN SNOWFLAKE_PUBLIC_DATA_FREE.PUBLIC_DATA_FREE.BANK_FOR_INTERNATIONAL_SETTLEMENTS_ATTRIBUTES a ON t.VARIABLE = a.VARIABLE
WHERE t.GEO_ID = 'country/JPN'
  AND LOWER(a.VARIABLE_NAME) LIKE '%policy rate%'
ORDER BY t.DATE DESC
LIMIT 5;
```

---

### 5. Climate Watch（温室効果ガス・エネルギーシナリオ）

**テーブル:** `CLIMATE_WATCH_TIMESERIES` + `CLIMATE_WATCH_ATTRIBUTES`
- 国別のエネルギー構成、電力発電シナリオなど

**クイズ例（応用）:** 「日本の発電容量で最も大きいのは？ ガス？ 原子力？ 石油？」
→ 正解: ガス（96GW）。石油は46GW、原子力は31GWで3位

---

### 6. その他の有望データソース（余裕があれば）

| データセット | テーブル名 | クイズ活用例 |
|---|---|---|
| **米国航空便** | `US_DOT_*` (DOMESTIC_SEGMENT等) | 「NY-LA便の平均搭乗率は？」 |
| **学術論文** | `OPENALEX_*` | 「AIの論文数、米国vs中国どっちが多い？」 |
| **米国CPI（物価指数）** | `BUREAU_OF_LABOR_STATISTICS_PRICE_*` | 「卵の価格、2020年から何%上がった？」 |
| **米国住所・POI** | `POINT_OF_INTEREST_INDEX` | 「スタバとマクドナルド、店舗数多いのは？」 |
| **SEC企業情報** | `COMPANY_INDEX`, `SEC_*` | 「時価総額Top5のうち、テック企業は何社？」 |
| **カナダ統計** | `CANADA_STATCAN_*` | 「カナダのGDPは世界何位？」 |
| **原子力発電** | `NRC_REACTOR_*` | 「米国で稼働中の原子炉は何基？」 |

---

## クイズ問題 推奨追加セット（PUBLIC_DATA_FREE活用）

既存の楽天10問に加え、以下を「豆知識デッキ」として追加可能:

| # | デッキ | 問題 | 意外性 |
|---|---|---|---|
| A1 | holiday×楽天 | 祝日 vs 通常平日、注文数多いのは？ | ★★★（祝日36%減） |
| A2 | OECD | 日本 vs 韓国、平均年収高いのは？ | ★★★（韓国が逆転） |
| A3 | CO2 | 日本 vs 中国、1人あたりCO2多いのは？ | ★★★（中国が上回った） |
| A4 | BIS | 2026年の日銀政策金利は 0.5%？0.75%？ | ★★（0.75%に利上げ） |
