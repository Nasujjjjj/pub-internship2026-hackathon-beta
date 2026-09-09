# progress_ai_weather.md

## 開始情報
- モデル: claude-sonnet-4-5（疎通OK）

## できたこと

### ① AI 出題
- `QZ_GENERATE_HIGHLOW(DECK, N)` プロシージャを作成（Python、EXECUTE AS CALLER）
- TRY_COMPLETE 使用、モデルフォールバック（claude-sonnet-4-5 → llama3.3-70b → llama3.1-8b → mistral-large2）
- 検証ロジック実装: item が表に実在 / 同一でない / metric が許可リスト / 差 3% 以上
- CALL テスト 2 回実行: 両方とも 5/5 合格。AI_GENERATED=TRUE が 10 行

### ② 天気
- NOAA 観測所: JA000047662 (TOKYO, 35.683, 139.767)
- QZ_WEATHER_TOKYO: 361 日、降水量合計 1,424.5mm（東京平年 ~1,600mm の範囲内）
- QZ_AGG_WEATHER: 東京都顧客 × 天気結合（カテゴリ行 + 'すべて' 行）
  - Apple Gift Card + .tsv.gz 除外済み
  - IS_RAINY = PRECIP_MM >= 1, IS_WEEKDAY = DAYOFWEEKISO BETWEEN 1 AND 5
  - 'すべて' 行の ORDERS は COUNT(DISTINCT USER_ID_HASH || '|' || PURCHASED_AT)
- 天気問題 1 問 INSERT 済み (ID 401, DECK 'weather')

## 検算結果

### 天気の中央値（平日、CATEGORY_LEVEL_1='すべて'）
| IS_RAINY | MEDIAN_ORDERS | DAYS |
|----------|---------------|------|
| TRUE     | 322           | 66   |
| FALSE    | 288           | 191  |

雨の日の方が約 12% 多い。差 > 3% で問題成立。

### QZ_QUESTIONS 全件（17 問）
| ID | DECK | QTYPE | AI_GENERATED | 備考 |
|----|------|-------|-------------|------|
| 1-3 | segment | highlow | FALSE | 固定問題 |
| 101-103 | state/month/category | highlow | FALSE | 固定問題 |
| 201-205 | category | highlow | TRUE | AI生成 1回目 |
| 301-305 | category | highlow | TRUE | AI生成 2回目（201-204と重複あり） |
| 401 | weather | highlow | FALSE | 天気問題 |

## できなかったこと
- なし（① ② とも完了）

## 既知の問題
- AI 生成 2 回目が 1 回目と同じ問題を出すことがある（201-204 と 301-304 が同一）。プロシージャに重複チェックを追加すべき
- QZ_AGG_WEATHER の 'すべて' 行と各カテゴリ行の ORDERS 定義が異なる（すべて=注文数、カテゴリ=明細行数）
- QZ_BASE ビューが別タスクで作成されていれば、QZ_AGG_WEATHER もそれを使うべき（現在は直接条件指定）
