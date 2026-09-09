# DATUM STUDIO Day5｜昼休み（12:00〜13:00）CoCo 自動作業の指示書　v2.2（11:59：4 レンズの検証を反映。時計・push・bypass 起動・NOAA 実 SQL・VARIANT の INSERT・モデル疎通・OAuth 温め・蓋。12:20：§3 を 13:00 の道具に合わせて更新。A〜C は 11:59 のまま）

前提＝main に push 済みの実物（fd6ed97「Add CoCo API and docs」）に合わせる。集計 5 本・QZ_QUESTIONS（6 問）・QZ_ANSWERS・quiz-bot（Next.js、High & Low が動く）まで出来ている。**スキーマは CoCo が作った実物が正**（CORRECT は数値 0/1、DECK は英語 category/state/month/segment/weather、METRIC は sales/orders/customers/aov/female_share/sales_share/orders_per_customer）。

## 1. 貼り方（各 CoCo で）

1. `git pull` して main を最新にしてからブランチを切る：`git checkout -b lunch/screen`（データ＝`lunch/data`、AI＋天気＝`lunch/ai-weather`）
2. 指示文を貼って送る
3. **貼る前に**自動承認にする：`cortex --bypass --auto-accept-plans` で起動（フラグが無ければ起動後に shift+tab で bypass に切替）。画面下が bypass 表示（赤 `>>`）で plan（橙 `⏸`）が無いことを確認。貼ってから切り替えると最初のツール呼び出しが承認待ちで止まる
4. 実装の最初の 1〜2 アクション（ファイル作成か SQL）が承認なしに流れるのを見てから席を立つ

## 2. 11:55 のチェックリスト

- [ ] 3 台とも**別々の Codespace**（同じ箱で 2 本動かすと checkout／reset が互いのファイルを壊す）。各箱で `git checkout main && git pull origin main` → `git log --oneline -1` が fd6ed97 以降 → ブランチを切る
- [ ] 各箱で空コミットの push が通る：`git commit --allow-empty -m "lunch: start" && git push -u origin $(git branch --show-current)`。通らない人の指示文からは push の行を消し、13:00 に `git format-patch main` で回収
- [ ] 3 台とも bypass 表示、plan 無し。指示文の先頭 1〜2 アクションが流れた
- [ ] 画面担当の箱で `npm run dev` を起動し `/api/quiz` を 1 回叩いて OAuth を通しておく（無人ではブラウザ認証ができない。2 回目以降はキャッシュ）
- [ ] AI モデルの疎通：Snowsight で `SELECT SNOWFLAKE.CORTEX.COMPLETE('<候補>', 'Reply with OK');` を 'claude-sonnet-4-5' → 'llama3.3-70b' → 'llama3.1-8b' → 'mistral-large2' の順に試し、最初に通った名前を指示文 C の `<MODEL>` に入れる
- [ ] App Runtime の可否：画面担当が `SHOW PARAMETERS LIKE 'DEFAULT_SNOWFLAKE_APPS%' IN ACCOUNT;` を実行。値が空＝管理者セットアップ未了の可能性。その場合は 13:00 に人が Streamlit 版への切替を判断する（昼はローカルで完成させる）
- [ ] Mac は電源につなぎ、**蓋を閉じない**（閉じると caffeinate があっても眠る）。ターミナルで `caffeinate -dis` を流したまま。Codespace のブラウザタブは 3 台とも開いたまま・接続中（ターミナル出力が活動に数えられるので、繋いだままなら止まらない。Settings の idle timeout は既存の箱に効かないので触らない）
- [ ] 12:30 に 1 人が戻って 3 台の画面を見る。止まっていたら再読み込み → 箱を再開 → `cortex --resume last` → bypass → 「docs/progress_*.md と git log を読んで途中から続けて」
- [ ] CoCo 右上が Warehouse: TEAM_B_WH

## 3. 13:00 に戻ったら（10 分）※12:20 更新：詳細は同フォルダ DATUMSTUDIO_Day5_13時統合手順_20260909.md、検算は Snowflake_Day5_13時検算SQL_20260909.sql

1. 各自の Codespace で CoCo を止め、`git log --oneline -3` と `git status` で最後の commit が push 済みか確認（origin に無い枝だけ `git push -u origin lunch/…`。通らなければ `git format-patch main`）
2. 統合役：`git fetch origin --prune` → `git show origin/lunch/<枝>:docs/progress_<名>.md` で 3 本を読む（向き反転／除外の行数と金額／使ったモデル／デプロイ URL）
3. 那須：Snowsight で検算 SQL の 1〜6（10 問以上・CHECK_DIR と CHECK_SHAPE と CHECK_CORRECT_CHOICE が全部 OK・除外前の全行が Day4 と一致・ID 1 は優良が低い・ID 3 はペットが 1 位）
4. 統合役：`git checkout main && git pull origin main` → `git merge --no-ff origin/lunch/data` → `origin/lunch/ai-weather` → `origin/lunch/screen` の順に **1 本ずつ**（4 文書の同期 docs/sync-1200 は 12:35 に main へ取り込み済み）（3 本同時の octopus は 1 衝突で全中止）→ quiz-bot で `npm test` → `npm run dev` で mix を通す → 発表用の `ids` パラメータ（手順 §5、5 分）→ デプロイ
5. デプロイ：SQL 10 のパラメータが空でも Streamlit へは切り替えない（personal DB は本人が開ける）。発表者（田中さん）のアカウントでデプロイし、2 回失敗したら localhost で発表
6. 凍結 14:30 の前に：発表 3 問（ID 1・3・虫食い 1 問）の数字が Snowsight と画面で一致（那須）／QZ_ANSWERS の試遊ログを残すか決める（推し＝残す）

## 4. 指示文 A（画面担当の CoCo に貼る）

```
あなたは 12:00〜13:00 の 1 時間、人の確認なしで作業します。次のルールを守ってください。
- 質問はせずに進める（AskUserQuestion や「進めてよいですか」の確認文は使わない）。判断に迷ったらこの指示の既定値を採用し、より単純な方を選び、docs/progress_screen.md に「仮決め」として記録する
- 作業単位ごとに git commit し、直後に `git push -u origin lunch/screen`（main には push しない。force push しない）。push が失敗したら 1 回だけ再試行し、駄目なら理由を progress に書いて commit だけ続ける（fork 作成・remote 変更・トークン設定はしない）。壊れたら直前のコミットに戻す
- 触ってよいのは quiz-bot/ 配下と docs/progress_screen.md だけ。Snowflake のテーブルは読むだけ（QZ_ANSWERS への INSERT は既存 API 経由のみ）。.cortex/ .devcontainer/ .snowflake/ は触らない
- コミット前に quiz-bot で `npm test`（vitest）を通す。lint スクリプトは無いので実行しない
- 時刻は必ず `TZ=Asia/Tokyo date +%H:%M` で確認する（箱の時計は UTC なので素の date は使わない）。各ステップの最初に実行し、12:50 を過ぎていたら新しいステップに入らない。13:00 になったら（または全部終わったら）止まり、docs/progress_screen.md に「できたこと／できなかったこと／仮決め／動かし方／デプロイ URL／既知の問題」を書いて commit・push する

役割：quiz-bot（Next.js、Snowflake App Runtime）に虫食いモード・回答者名・ランキング・定義表示を足し、デプロイする。既存の High & Low（components/quiz-game.tsx、app/api/quiz/route.ts、app/api/answer/route.ts）はそのまま活かす。

テーブルの実物（TEAM_B_DB.DEVELOPMENT。変えない）
- QZ_QUESTIONS(ID, DECK 'category'|'state'|'month'|'segment'|'weather', QTYPE 'highlow'|'blank', QUESTION_TEXT, ITEM_A, ITEM_B, METRIC, VALUE_A, VALUE_B, SERIES VARIANT, MASK_FROM, MASK_TO, CHOICES VARIANT, CORRECT NUMBER, EXPLANATION, SQL_TEXT, AI_GENERATED, CREATED_AT)
  - highlow：CORRECT 0＝A が正解、1＝B が正解
  - blank：SERIES は [{"x":"2023-04-03","y":123.0},...]（週次または月次。x は文字列のまま軸ラベルに使い、Date に変換しない。月次は 'YYYY-MM'）。MASK_FROM〜MASK_TO は隠す区間の添字（両端含む）。CHOICES は [{"label":"ペット・ペットグッズ","series":[0〜1 に正規化した数値の配列]}, ... 4 個]。CORRECT は正解の添字 0〜3。データ担当が同時に 3 問入れる。API が blank を 0 件返した時だけ、画面側で lib/dummy-blank.ts のダミー 2 問を使う（環境変数は不要）
- QZ_ANSWERS(ANSWERED_AT, PLAYER, QUESTION_ID, CHOSEN, IS_CORRECT)

やること（順番どおり。各ステップで commit）
1. API：app/api/quiz/route.ts に SERIES, MASK_FROM, MASK_TO, CHOICES を SELECT に足し、クエリパラメータ mode=highlow|blank|mix（既定 mix）で QTYPE を絞る。VARIANT 列は文字列で返るので JSON.parse してから返す。app/api/ranking/route.ts を新設：QZ_ANSWERS を QUESTION_ID で集計し、回答数 3 以上の問題を不正解率の高い順に 5 件（QUESTION_TEXT を JOIN）
2. 画面（quiz-game.tsx）：DECKS に { value: 'weather', label: '天気' } を足す（0 問なら既存のエラー表示で可）。スタート画面に回答者名の入力（既定 guest。/api/answer の player に渡す）とモード選択（High & Low／虫食い／ミックス）を足す。虫食い問題は、SERIES の折れ線を SVG（components/chart-utils.tsx にあれば再利用、無ければ polyline で自作。ライブラリは追加しない）で描き、MASK 区間は線を描かず薄い帯で示す。下に CHOICES の 4 つを小さな折れ線カードで並べ、クリックで回答。答え合わせで元の系列全体と、各カードのラベル（正解のカテゴリと他 3 つのカテゴリ名）を表示。High & Low と同じく解説と SQL の折りたたみ
3. 結果画面：「みんなが外した問題 TOP5」（/api/ranking）を表示。全問正解なら見出しを虹色のグラデーション（CSS のみ）にする
4. 定義の折りたたみ：答え合わせの下に「定義」＝注文＝顧客 ID×購入日時／平均購入単価＝売上÷注文数／優良顧客＝Day3 の RFM 定義（化粧品購入者で R・F・M 高、2,865 人）／Apple Gift Card は集計から除外／期間 2023/4/1〜2024/3/31
5. 差し込み口：components/mascot.tsx に、連勝数と正誤を props で受け取る空のコンポーネントを作り、画面左下に置く（中身は人が 14:00 以降に足す）
5b. 余裕があれば：POST /api/generate {deck} → `CALL TEAM_B_DB.DEVELOPMENT.QZ_GENERATE_HIGHLOW(deck, 1)`。プロシージャが無ければ 503 と「AI 出題は休憩中」。スタート画面に「AI に新しい問題を作らせる」ボタン（503 でもゲームは止めない）
6. デプロイ：/snowflake-apps のスキルに従う。snowflake.yml が無ければ `snow app setup` を実行してから `snow app deploy`。アプリ名は quiz_bot_beta、query_warehouse は TEAM_B_WH。この Application Service だけは TEAM_B_DB.DEVELOPMENT 以外に作ってよい（例外）。URL は `snow app open --print-only`（無ければ `snow app events` の出力）で取って progress に書く。権限・personal database（USER$）・コンピュートプールで 2 回失敗したら、それ以上は試さず「デプロイ未」と理由を書いてローカル（npm run dev）で完成させる。Snowflake への接続は既存の lib/snowflake.ts の querySnowflake() をそのまま使い、.env.local や認証情報は書かない

完成条件：mix モードで High & Low と虫食い（ダミー可）が通しで回り、結果画面にランキングが出て、npm test が通る
```

## 5. 指示文 B（データ担当の CoCo に貼る）

```
あなたは 12:00〜13:00 の 1 時間、人の確認なしで作業します。次のルールを守ってください。
- 質問はせずに進める（AskUserQuestion や「進めてよいですか」の確認文は使わない）。判断に迷ったらこの指示の既定値を採用し、より単純な方を選び、docs/progress_data.md に「仮決め」として記録する
- SQL は sql/ に 1 作業 1 ファイルで保存し、作業単位ごとに git commit、直後に `git push -u origin lunch/data`（main には push しない）。push が失敗したら 1 回だけ再試行し、駄目なら理由を progress に書いて commit だけ続ける
- 触ってよいのは TEAM_B_DB.DEVELOPMENT の QZ_ で始まるテーブルと sql/・docs/progress_data.md だけ。MART_RAKUTEN_PURCHASES_RFM は読み取り専用。quiz-bot/ は触らない
- **QZ_QUESTIONS と QZ_ANSWERS は CREATE OR REPLACE／DROP／TRUNCATE しない**（AI・天気担当が同時に INSERT している）。自分の行の直しは UPDATE か DELETE ... WHERE ID IN (...) に限る
- ウェアハウス TEAM_B_WH。sql_execute はステートメントごとにセッションが戻るので、テーブルは常に TEAM_B_DB.DEVELOPMENT. で完全修飾し、必要なら各文の先頭で USE WAREHOUSE TEAM_B_WH を付ける（作業ログ 2-4）
- 時刻は必ず `TZ=Asia/Tokyo date +%H:%M` で確認する（箱の時計は UTC なので素の date は使わない）。各ステップの最初に実行し、12:50 を過ぎていたら新しいステップに入らない。13:00 になったら止まり、docs/progress_data.md に「できたこと／できなかったこと／仮決め／検算結果（除外前後の数字）／既知の問題」を書いて commit・push する

役割：①Apple Gift Card をクイズ用の集計から除外して 5 本の集計テーブルと固定問題の値を作り直す ②解説文を型に合わせて書き直す ③問題 2 を差し替える ④虫食い問題を 3 問入れる。スキーマは作業ログ_CoCo.md の実物（CORRECT は数値、DECK は英語）を変えない。

① Apple Gift Card の除外
- まず `select item_name, count(*), sum(total_price) from TEAM_B_DB.DEVELOPMENT.MART_RAKUTEN_PURCHASES_RFM where item_name ilike '%gift card%' or item_name ilike '%ギフトカード%' group by 1 order by 3 desc limit 20` で表記ゆれを確認し、Apple Gift Card に当たる行の条件を決める
- 除外前の全行で `sum(total_price)`＝8,287,087,735、`count(distinct user_id_hash, purchased_at)`＝1,125,268 を確認（定義の検算）。除外した行数と金額を progress に書く
- 除外はビューで一元化：`CREATE OR REPLACE VIEW TEAM_B_DB.DEVELOPMENT.QZ_BASE AS SELECT * FROM TEAM_B_DB.DEVELOPMENT.MART_RAKUTEN_PURCHASES_RFM WHERE NOT (<①で決めた条件>)`。集計 5 本・固定問題・虫食いの SQL は全部 QZ_BASE から取る。大福帳を直接読むのは除外前の検算だけ
- QZ_AGG_CAT・QZ_AGG_STATE・QZ_AGG_MONTH_CAT・QZ_AGG_WEEK_CAT・QZ_AGG_SEG_CAT を同じ定義（注文＝顧客×購入日時、AOV＝売上÷注文数、カテゴリ異物は「カテゴリ不明」、STATE '不明' 除外）で CREATE OR REPLACE（除外条件を WHERE に追加）
- 固定問題 ID 1・3・101・102・103 の VALUE_A・VALUE_B・CORRECT・SQL_TEXT を除外後の値で UPDATE。除外前と 10% 以上ずれた問題は progress に書く
- CORRECT は必ず VALUE_A と VALUE_B の比較で決める（作業ログの期待の向きに合わせない）。向きが変わった問題は progress の先頭に「向き反転」と書く

② 解説の型（EXPLANATION を UPDATE。数字は①で出した実値を入れる）
1 行目＝正解と 2 つの数字／2 行目＝なぜそうなるか（背景を 1 文）／3 行目＝「※」で定義か注意。例：
- ID 1：「正解は「低い」。優良顧客は 1 回あたり {A} 円、それ以外は {B} 円。優良顧客は高い物を買う人ではなく、年に {優良の 1 人あたり注文数} 回（それ以外は {同} 回、約 {倍率} 倍）と何度も買う人。単価で稼ぐより回数を保つ施策が効く。※注文＝顧客×購入日時、平均購入単価＝売上÷注文数」
- ID 3：「正解はペット・ペットグッズ（化粧品以外の売上の {A}%）。ダイエット・健康は {B}%。優良顧客はコスメだけでなくペット用品を繰り返し買っている。※化粧品（美容・コスメ・香水）を除いた売上の構成比」
- ID 101：「正解は東京都（{A} 件）。大阪府は {B} 件で約 {倍率} 倍。人口比（約 1.6 倍）より差が大きい。※顧客の登録都道府県、注文＝顧客×購入日時」
- ID 102：「正解は 12 月（{A} 億円）。3 月は {B} 億円。12 月はスーパーSALE と年末の買いだめが重なる。※データは 2023/4〜2024/3 の 1 年分」
- ID 103：「正解は美容・コスメ・香水（女性 {A}%）。ペット・ペットグッズも {B}% と女性が過半数。※女性比率＝そのカテゴリを買った顧客のうち女性の割合」

③ 問題 2 の差し替え（「それ以外の 5 倍」が分かりにくい、との声）
- ID 2 は DELETE し、代わりに次を INSERT（DECK 'segment'、QTYPE 'highlow'）：まず `select rfm_segment, count(distinct user_id_hash) as customers, count(distinct user_id_hash, purchased_at) as orders from 大福帳（除外後） group by 1` を出す。人数が少ない優良顧客（2,865 人）より人数が多いセグメント（ターゲット顧客 か その他）で、注文数の合計が優良顧客より少ないものがあれば、「注文数の合計が多いのはどっち？」ITEM_A='優良顧客（{人数} 人）' ITEM_B='{セグメント名}（{人数} 人）' を採用（少数が大量に買う、が意外）。無ければ ITEM_A='優良顧客（1 人あたり）' ITEM_B='それ以外（1 人あたり）' METRIC 'orders_per_customer' の素直な問題にして、解説で「約 {倍率} 倍」を出す
- 解説は②の型で書く

④ 虫食い問題 3 問（QTYPE 'blank'）
- 8：DECK 'category'。美容・コスメ・香水の週次売上（QZ_AGG_WEEK_CAT、週の始まり月曜）。2023-11-06 の週から 8 週を隠す。誤答肢は同じ 8 週のペット・ペットグッズ／食品／レディースファッション（無ければ売上上位の別カテゴリ）
- 9：DECK 'category'。ペット・ペットグッズの月次売上（QZ_AGG_MONTH_CAT）。2023-06〜2023-08 を隠す。誤答肢は別カテゴリ 3 つ
- 10：DECK 'month'。全カテゴリ合計の月次注文数。**カテゴリ行の ORDERS を足さない**（1 注文が複数カテゴリにまたがり二重計上になる）。QZ_BASE から月ごとに COUNT(DISTINCT USER_ID_HASH, PURCHASED_AT) で作る。2024-01〜2024-03 を隠す。誤答肢は上位カテゴリ 3 つの同じ区間
- 形式：SERIES＝[{"x":"2023-04-03","y":123.0},...]（全区間の実値）、MASK_FROM/MASK_TO＝添字（両端含む）、CHOICES＝4 個の {"label": カテゴリ名, "series": 隠した区間だけを min-max で 0〜1 に正規化した配列} をシャッフル、CORRECT＝正解の添字（0〜3）。VARIANT 列は **INSERT ... SELECT** で入れる（INSERT ... VALUES の中に PARSE_JSON／ARRAY_CONSTRUCT は書けない）。例：`INSERT INTO TEAM_B_DB.DEVELOPMENT.QZ_QUESTIONS (DECK, QTYPE, QUESTION_TEXT, SERIES, MASK_FROM, MASK_TO, CHOICES, CORRECT, EXPLANATION, SQL_TEXT) SELECT 'category', 'blank', '…', PARSE_JSON($1), 31, 38, PARSE_JSON($2), 2, '…', '…' FROM VALUES ('[{"x":"2023-04-03","y":123.0}, …]', '[{"label":"ペット・ペットグッズ","series":[0.1,0.4,…]}, …]');`。集計から直接組む場合は `ARRAY_AGG(OBJECT_CONSTRUCT('x', WEEK_START, 'y', SALES)) WITHIN GROUP (ORDER BY WEEK_START)`（これも INSERT ... SELECT）
- 解説：「隠れていたのは {カテゴリ} の {期間}。山の理由＝{スーパーSALE／年末／季節}。他の 3 つは {カテゴリ名}」の 2 行

⑤ 検算：`select id, deck, qtype, question_text, correct, value_a, value_b from TEAM_B_DB.DEVELOPMENT.QZ_QUESTIONS order by id` を progress に貼る

順番：①（25 分）→ ②③（15 分）→ ④（20 分）→ ⑤
```

## 6. 指示文 C（AI 出題＋天気担当の CoCo に貼る）

```
あなたは 12:00〜13:00 の 1 時間、人の確認なしで作業します。次のルールを守ってください。
- 質問はせずに進める（AskUserQuestion や「進めてよいですか」の確認文は使わない）。判断に迷ったらこの指示の既定値を採用し、より単純な方を選び、docs/progress_ai_weather.md に「仮決め」として記録する
- SQL は sql/ に保存し、作業単位ごとに git commit、直後に `git push -u origin lunch/ai-weather`（main には push しない）。push が失敗したら 1 回だけ再試行し、駄目なら理由を progress に書いて commit だけ続ける
- 触ってよいのは TEAM_B_DB.DEVELOPMENT の QZ_ で始まるオブジェクト（QZ_QUESTIONS は INSERT のみ、既存行は UPDATE/DELETE しない）と sql/・docs/progress_ai_weather.md だけ。大福帳は読み取り専用。quiz-bot/ は触らない
- ウェアハウス TEAM_B_WH。テーブルは常に完全修飾し、各文の先頭で USE WAREHOUSE TEAM_B_WH（作業ログ 2-4）
- 時刻は必ず `TZ=Asia/Tokyo date +%H:%M` で確認する（箱の時計は UTC なので素の date は使わない）。各ステップの最初に実行し、12:50 を過ぎていたら新しいステップに入らない。13:00 になったら止まり、docs/progress_ai_weather.md に「できたこと／できなかったこと／仮決め／検算結果／既知の問題」を書いて commit・push する

役割：①Cortex の AI 関数で High & Low の問題を自動生成するストアドプロシージャ ②天気（NOAA）×東京都の顧客の結合テーブルと、天気の問題 1 問。スキーマは作業ログ_CoCo.md の実物：DECK は 'category'|'state'|'month'|'segment'|'weather'、CORRECT は 0（A が正解）か 1（B が正解）、METRIC は 'sales'|'orders'|'customers'|'aov'|'female_share'。

① AI 出題（/cortex-ai-function-studio を使う）
- モデル：<MODEL>（11:55 の疎通で通ったもの）。最初に `SELECT SNOWFLAKE.CORTEX.COMPLETE('<MODEL>', 'Reply with OK');` を 1 回実行し、エラーなら 'claude-sonnet-4-5' → 'llama3.3-70b' → 'llama3.1-8b' → 'mistral-large2' の順に同じ疎通を試して、通った名前を以後すべてに使い progress の先頭に書く。プロシージャ内は SNOWFLAKE.CORTEX.TRY_COMPLETE を使い、NULL なら次のモデルへ（COMPLETE はエラーで落ちる）。エラー文に legacy／not available が出たら即次へ
- プロシージャ TEAM_B_DB.DEVELOPMENT.QZ_GENERATE_HIGHLOW(DECK STRING, N NUMBER) RETURNS STRING（Python か SQL、動く方）
  1. DECK='category' なら QZ_AGG_CAT（'カテゴリ不明' を除く売上上位 40 行）、'state' なら QZ_AGG_STATE（全行）を JSON 文字列にする
  2. SNOWFLAKE.CORTEX.COMPLETE(<MODEL>, prompt) を呼ぶ。prompt＝「次は楽天市場の 2023 年度の集計表です。直感と逆になりそうな（多くの人が外しそうな）『A の指標は B より高い？低い？』の組を N 個選び、JSON 配列だけを返してください。各要素は {"item_a":..., "item_b":..., "metric":"sales|orders|customers|aov|female_share", "question_text":"日本語の問題文 1 文", "why":"意外な理由 1 文"}。表に無い名前は使わない。」＋表の JSON
  3. 返答から JSON 配列を取り出す（前後の文章や ```json を剥がす。TRY_PARSE_JSON が NULL なら 1 回だけ再試行）
  4. 検証：item_a・item_b が表に実在／同一でない／metric が許可リスト（'category'＝sales|orders|customers|aov|female_share、'state'＝sales|orders|customers|aov。QZ_AGG_STATE に female_share は無い）／両方の値の差が 3% 以上。落ちたものは捨てて理由を戻り値に含める。female_share の値が 0〜1 なら 100 倍して入れる（画面は % を付けるだけ。既存の ID 103 は 76.7 のように % の数値）
  5. 合格分を QZ_QUESTIONS に INSERT。VALUE_A・VALUE_B は表の値、CORRECT はプログラムで比較（AI に決めさせない）、SQL_TEXT は「SELECT ... FROM QZ_AGG_CAT WHERE CATEGORY_LEVEL_1 IN ('A','B')」の実 SQL、AI_GENERATED=TRUE、EXPLANATION は 2 回目の COMPLETE に「問題文と A・B の値だけを渡し、その数字だけを使って『1 行目＝正解と数字、2 行目＝背景』で書く」と指示した文
- テスト：CALL で 'category' 5 問を 2 回実行し、AI_GENERATED=TRUE の行が 3 行以上入ることを確認。戻り値は「生成 n／合格 m／落ちた理由」
- AI 関数が権限で動かなければ progress に書いて ② に専念する

② 天気
1. 実在確認：`SHOW OBJECTS LIKE 'NOAA_WEATHER%' IN SCHEMA SNOWFLAKE_PUBLIC_DATA_FREE.PUBLIC_DATA_FREE;`（NOAA はビューなので SHOW TABLES では出ない）。出なければ `SELECT TABLE_NAME, TABLE_TYPE FROM SNOWFLAKE_PUBLIC_DATA_FREE.INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME LIKE '%WEATHER%';`。それでも無ければ progress に書いて ① に戻る（IN ACCOUNT の全件検索はしない）
2. 東京の観測所：`SELECT NOAA_WEATHER_STATION_ID, NOAA_WEATHER_STATION_NAME, COUNTRY_NAME, LATITUDE, LONGITUDE FROM SNOWFLAKE_PUBLIC_DATA_FREE.PUBLIC_DATA_FREE.NOAA_WEATHER_STATION_INDEX WHERE NOAA_WEATHER_STATION_ID LIKE 'JA%' AND NOAA_WEATHER_STATION_NAME ILIKE '%TOKYO%';`（期待＝JA000047662 'TOKYO'。ID は 11 桁、先頭 2 文字が国コードで JA＝日本）
3. 変数は全球の DISTINCT を取らず `SELECT VARIABLE, VARIABLE_NAME, UNIT FROM SNOWFLAKE_PUBLIC_DATA_FREE.PUBLIC_DATA_FREE.NOAA_WEATHER_METRICS_ATTRIBUTES WHERE VARIABLE IN ('precipitation','maximum_temperature');` で確認（降水は VARIABLE='precipitation'、UNIT 'Millimeters'＝mm 換算済み／最高気温は 'maximum_temperature'、'Degrees Celsius'。似た名前の変数があるので LIKE は使わず完全一致）。日次表：`CREATE OR REPLACE TABLE TEAM_B_DB.DEVELOPMENT.QZ_WEATHER_TOKYO AS SELECT DATE, MAX(IFF(VARIABLE='precipitation', VALUE, NULL)) AS PRECIP_MM, MAX(IFF(VARIABLE='maximum_temperature', VALUE, NULL)) AS TMAX_C FROM SNOWFLAKE_PUBLIC_DATA_FREE.PUBLIC_DATA_FREE.NOAA_WEATHER_METRICS_TIMESERIES WHERE NOAA_WEATHER_STATION_ID = '<2 の ID>' AND VARIABLE IN ('precipitation','maximum_temperature') AND DATE BETWEEN '2023-04-01' AND '2024-03-31' GROUP BY DATE;` 検算：SUM(PRECIP_MM) が 1,300〜1,900 なら mm（東京の平年約 1,600mm）。10 倍なら /10。行数が 300 日未満なら 2 で出た別の JA 観測所を試す
4. 結合：QZ_AGG_WEATHER(DATE, IS_RAINY BOOLEAN, IS_WEEKDAY BOOLEAN, CATEGORY_LEVEL_1, SALES, ORDERS)。元は大福帳の STATE_NAME='東京都'（データ担当が作る QZ_BASE ビューがあればそれを使う。無ければ ITEM_NAME ILIKE '%apple gift card%' を除外し、カテゴリ異物は 'カテゴリ不明' にする）。IS_RAINY = PRECIP_MM >= 1、IS_WEEKDAY = DAYOFWEEKISO(DATE) BETWEEN 1 AND 5（DAYOFWEEK は使わない）。日ごとに CATEGORY_LEVEL_1='すべて' の行を入れ、その ORDERS は日内の COUNT(DISTINCT USER_ID_HASH, PURCHASED_AT)（カテゴリ行の ORDERS を足さない）
5. 検算：IS_WEEKDAY=TRUE かつ CATEGORY_LEVEL_1='すべて' の行で、IS_RAINY 別に ORDERS の MEDIAN を出し、progress に数字を書く
6. 問題 1 問を INSERT：DECK 'weather'、QTYPE 'highlow'、METRIC 'orders'、QUESTION_TEXT「東京都の顧客の 1 日あたり注文数（平日の中央値）が多いのは？」、ITEM_A '雨の日'、ITEM_B '雨でない日'、VALUE_A/B＝中央値、CORRECT＝比較（0 か 1）、SQL_TEXT に実 SQL、EXPLANATION は「1 行目＝正解と数字、2 行目＝雨＝降水 1mm 以上・平日のみ・中央値、絶対額はセールと週末に飲まれるので条件を揃えた」。差が 3% 未満なら代わりに「雨の日に売上構成比が一番上がるカテゴリ」（雨／非雨の SHARE の差が最大のカテゴリ vs 2 位、METRIC 'sales_share'）にする

順番：①（30 分）→ ②（30 分）。① が 12:30 を過ぎても動かなければ ② に移る。
```
