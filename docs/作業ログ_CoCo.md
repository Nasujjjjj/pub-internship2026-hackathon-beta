# CoCo 作業ログ & 知見メモ

作成: 2026-09-09

---

## 1. 実施した作業

### 1-1. 集計テーブルの作成（5 本）

ソーステーブル `TEAM_B_DB.DEVELOPMENT.MART_RAKUTEN_PURCHASES_RFM`（1,468,432 行）から、クイズ出題用の集計テーブルを作成した。

| テーブル | 行数 | 粒度 | 主なカラム |
|----------|------|------|-----------|
| `QZ_AGG_CAT` | 38 | カテゴリ L1 | SALES, ORDERS, CUSTOMERS, AOV, FEMALE_SHARE, AVG_AGE |
| `QZ_AGG_STATE` | 47 | 都道府県 | SALES, ORDERS, CUSTOMERS, AOV |
| `QZ_AGG_MONTH_CAT` | 456 | 月 × カテゴリ | SALES, ORDERS |
| `QZ_AGG_WEEK_CAT` | 2,014 | 週 × カテゴリ | SALES, ORDERS |
| `QZ_AGG_SEG_CAT` | 152 | RFM セグメント × カテゴリ | SALES, SHARE（%） |

補足:
- `QZ_AGG_STATE` は `STATE_NAME = '不明'` を除外済み
- `QZ_AGG_SEG_CAT` の SHARE はセグメント内の売上構成比（%）
- `QZ_AGG_WEATHER`（天気班担当）は未作成

### 1-2. 問題・回答テーブルの作成

| テーブル | 用途 |
|----------|------|
| `QZ_QUESTIONS` | クイズ問題マスタ（固定問題 + AI 生成） |
| `QZ_ANSWERS` | プレイヤーの回答ログ |

`QZ_QUESTIONS` のスキーマ:

```
ID              NUMBER AUTOINCREMENT PRIMARY KEY
DECK            VARCHAR        -- 'category','state','month','segment','weather'
QTYPE           VARCHAR        -- 'highlow' or 'blank'
QUESTION_TEXT   VARCHAR
ITEM_A          VARCHAR        -- High&Low: ラベル A
ITEM_B          VARCHAR        -- High&Low: ラベル B
METRIC          VARCHAR        -- 'sales','aov','orders' 等
VALUE_A         NUMBER(38,2)
VALUE_B         NUMBER(38,2)
SERIES          VARIANT        -- 虫食いグラフ用: 時系列 JSON
MASK_FROM       NUMBER         -- 虫食い: 隠す範囲の開始インデックス
MASK_TO         NUMBER         -- 虫食い: 隠す範囲の終了インデックス
CHOICES         VARIANT        -- 虫食い: 4 択の系列
CORRECT         NUMBER         -- 正解 (0=A が上 / 1=B が上、虫食いは 0-3)
EXPLANATION     VARCHAR
SQL_TEXT        VARCHAR        -- 正解導出に使った SQL
AI_GENERATED    BOOLEAN DEFAULT FALSE
CREATED_AT      TIMESTAMP_LTZ DEFAULT CURRENT_TIMESTAMP()
```

### 1-3. High & Low 固定問題の投入（6 問 / 目標 7 問）

| ID | デッキ | 問題 | 正解 | 値 A | 値 B |
|----|--------|------|------|------|------|
| 1 | segment | 優良顧客の平均購入単価 vs それ以外 | B（低い） | 6,953 | 7,474 円 |
| 2 | segment | 優良顧客の 1 人あたり注文数 vs それ以外の 5 倍 | A（多い） | 82.7 | 67.0 回 |
| 3 | segment | 化粧品以外で優良顧客が一番買うのは？ | A（ペット） | 13.0% | 5.3% |
| 101 | state | 東京都 vs 大阪府の注文数 | A（東京都） | 220,916 | 114,454 |
| 102 | month | 12 月 vs 3 月の売上 | A（12 月） | 7.7 億 | 6.6 億円 |
| 103 | category | 美容・コスメ vs ペット・ペットグッズの女性比率 | A（美容） | 76.7% | 54.8% |

- Q7（天気：雨の日 vs 晴れの日の注文数）は `QZ_AGG_WEATHER` 未作成のため保留
- CORRECT の規約: `0` = A が正解（A が高い）、`1` = B が正解（B が高い）

### 1-4. アプリのローカル起動確認

- `quiz-bot/` ディレクトリで `npm run dev` → `http://localhost:3000` で Next.js 起動を確認
- 現状はスキャフォールド画面（SessionCard / TimeCard / QueryCard）

---

## 2. 得られた知見

### 2-1. 「注文」の定義に注意

要件定義では **注文 ＝ 顧客 ID × 購入日時**（`COUNT(DISTINCT USER_ID_HASH || '|' || PURCHASED_AT)`）。
`COUNT(*)` は行数（明細数）であり、注文数ではない。

- `COUNT(*)` で計算した AOV → 優良 5,025 / それ以外 5,821
- **注文ベース（正しい定義）** → 優良 6,953 / それ以外 7,474

この差は大きいので、集計時は必ず定義を確認すること。

### 2-2. RFM セグメントの分布

```
優良顧客:        2,865 人 /  236,880 注文
ターゲット顧客:   (中間層)
その他:          (残り)
対象外:          (残り)
合計:           69,082 人 / 1,125,268 注文
```

優良顧客は人数の 4% だが注文の 21% を占める。「少数が大量に買う」構造。

### 2-3. QZ_AGG_SEG_CAT の SHARE は全体ベース

`QZ_AGG_SEG_CAT` の `SHARE` はセグメント内の全カテゴリ（美容含む）に対する構成比。
「化粧品以外で」の SHARE を出すには、**WHERE で美容を除外した上で再計算**が必要。

- 全体ベース: ペット 11.5%
- 美容除外ベース: ペット **13.0%**（ユーザー指定の正解値と一致）

### 2-4. Snowflake Warehouse の自動サスペンド

CoCo の `sql_execute` は**ステートメントごとにセッションがリセットされる**挙動がある。
`USE WAREHOUSE TEAM_B_WH` を実行しても、次のクエリで「No active warehouse」エラーになることが頻発した。

→ 対策: クエリを書くたびに `USE WAREHOUSE` を再実行するか、1 つの SQL 内で完結させる。

### 2-5. ローカル開発時の Snowflake 認証

`~/.snowflake/connections.toml` に `authenticator = "OAUTH_AUTHORIZATION_CODE"` が設定されている場合:

- Next.js の初回リクエスト時に OAuth ブラウザ認証が走る（約 25 秒）
- 2 回目以降はトークンキャッシュにより 200-600ms で応答
- 初回アクセス時に画面が「フリーズ」したように見えるが、バックグラウンドで認証中

### 2-6. AUTOINCREMENT の ID 採番

`QZ_QUESTIONS` の `ID` は `AUTOINCREMENT` だが、バッチ INSERT では連番にならないことがある（今回は 1,2,3,101,102,103 になった）。
表示順やロジックで ID の連続性に依存しないこと。

---

## 3. 残タスク

- [ ] Q7（天気問題）の追加 → `QZ_AGG_WEATHER` 完成待ち
- [ ] 虫食いグラフ問題の作成（3 問）→ `QZ_AGG_WEEK_CAT` / `QZ_AGG_MONTH_CAT` を使用
- [ ] AI 出題機能の実装（`SNOWFLAKE.CORTEX.COMPLETE` で集計表から意外な組を生成）
- [ ] クイズ画面 UI の実装（現在のスキャフォールドを置き換え）
- [ ] 回答ログの記録（`QZ_ANSWERS` への INSERT）
- [ ] 発表用 3 問の選定と動作確認（14:30 凍結）

---

## 4. テーブル一覧（TEAM_B_DB.DEVELOPMENT）

| テーブル名 | 種別 | 行数 | 状態 |
|------------|------|------|------|
| MART_RAKUTEN_PURCHASES_RFM | ソース | 1,468,432 | 既存 |
| QZ_AGG_CAT | 集計 | 38 | 作成済み |
| QZ_AGG_STATE | 集計 | 47 | 作成済み |
| QZ_AGG_MONTH_CAT | 集計 | 456 | 作成済み |
| QZ_AGG_WEEK_CAT | 集計 | 2,014 | 作成済み |
| QZ_AGG_SEG_CAT | 集計 | 152 | 作成済み |
| QZ_AGG_WEATHER | 集計 | - | 未作成（天気班） |
| QZ_QUESTIONS | 問題 | 6 | 作成済み（High&Low 6 問） |
| QZ_ANSWERS | 回答 | 0 | 作成済み（空） |
