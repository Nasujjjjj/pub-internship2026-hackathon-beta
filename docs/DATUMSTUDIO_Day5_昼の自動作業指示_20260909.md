# DATUM STUDIO Day5｜CoCo 3 台の並行作業指示書　v2.3（12:55：各自が席で開始する前提に変更＝開始時に時刻を記録・13:40 以降は新規ステップなし・13:50 停止。クイズの追加＝docs/quiz-candidates.md の候補を再計算して投入、ID 3 の再計算、虫食い画面は docs/images/image.png の形、デッキ「顧客属性」と単位の規則）

前提＝main の実物（02cfd15 まで。quiz-bot・QZ_QUESTIONS 6 問・docs/quiz-candidates.md・docs/images/image.png）に合わせる。集計 5 本・QZ_QUESTIONS（6 問）・QZ_ANSWERS・quiz-bot（Next.js、High & Low が動く）まで出来ている。**スキーマは CoCo が作った実物が正**（CORRECT は数値 0/1、DECK は英語 category/state/month/segment/weather、METRIC は sales/orders/customers/aov/female_share/sales_share/orders_per_customer）。

## 1. 貼り方（各自、自分の Codespace で。人は横にいてよいが CoCo には質問させない）

1. `git checkout main && git pull origin main` → `git log --oneline -1` が 02cfd15 以降 → ブランチを切る：`git checkout -b lunch/screen`（データ＝`lunch/data`、AI＋天気＝`lunch/ai-weather`）
2. **貼る前に**自動承認にする：`cortex --bypass --auto-accept-plans` で起動（フラグが無ければ起動後に shift+tab で bypass に切替）。画面下が bypass 表示（赤 `>>`）で plan（橙 `⏸`）が無いことを確認。貼ってから切り替えると最初のツール呼び出しが承認待ちで止まる
3. 指示文を貼って送る。最初の 1〜2 アクション（ファイル作成か SQL）が承認なしに流れるのを見る
4. 止まっていたら「この指示の既定値で進めて」と打つ。質問に答えるより速い

## 2. 開始前のチェック（貼る直前、5 分）

- [ ] 3 台とも**別々の Codespace**（同じ箱で 2 本動かすと checkout／reset が互いのファイルを壊す）
- [ ] 各箱で空コミットの push が通る：`git commit --allow-empty -m "lunch: start" && git push -u origin $(git branch --show-current)`。通らない人の指示文からは push の行を消し、13:50 に `git format-patch main` で回収
- [ ] 画面担当の箱で `npm run dev` を起動し `/api/quiz` を 1 回叩いて OAuth を通しておく（初回はブラウザ認証で 25 秒。2 回目以降はキャッシュ）
- [ ] AI モデルの疎通：Snowsight で `SELECT SNOWFLAKE.CORTEX.COMPLETE('<候補>', 'Reply with OK');` を 'claude-sonnet-4-5' → 'llama3.3-70b' → 'llama3.1-8b' → 'mistral-large2' の順に試し、最初に通った名前を指示文 C の `<MODEL>` に入れる
- [ ] App Runtime の可否：画面担当が `SHOW PARAMETERS LIKE 'DEFAULT_SNOWFLAKE_APPS%' IN ACCOUNT;` を実行。値が空＝管理者セットアップ未了＝personal database に配備される（本人しか開けない）。その場合は**発表者（田中さん）の箱でデプロイ**する。Streamlit には切り替えない
- [ ] CoCo 右上が Warehouse: TEAM_B_WH
- [ ] 開始が 13:10 を過ぎたら、各指示文の末尾「優先順位」の下から削る

## 3. 13:50 に止めたら（統合 13:50〜14:20、凍結 14:30、発表 15:00）

1. 各自：CoCo を止め、`git log --oneline -3` と `git status` で最後の commit が push 済みか確認（origin に無い枝だけ `git push -u origin lunch/…`。通らなければ `git format-patch main`）
2. 統合役：`git fetch origin --prune` → `git show origin/lunch/<枝>:docs/progress_<名>.md` で 3 本を読む（向き反転／ID 3 の新しい 1 位／除外の行数と金額／候補との数字のずれ／使ったモデル／デプロイ URL）→ `git checkout main && git pull origin main` → `git merge --no-ff origin/lunch/data` → `origin/lunch/ai-weather` → `origin/lunch/screen` の順に **1 本ずつ**（3 本同時の octopus は 1 衝突で全中止）→ quiz-bot で `npm test` → `npm run dev` で mix を通す
3. 那須：Snowsight で docs/Snowflake_Day5_検算SQL_20260909.sql の 1〜6（10 問以上・CHECK_DIR と CHECK_SHAPE と CHECK_CORRECT_CHOICE が全部 OK・除外前の全行が Day4 と一致・ID 1 は優良が低い）と、追加した候補問題の値
4. デプロイ（14:00〜、失敗 2 回で打ち切り）：発表者（田中さん）の箱で `snow app setup` → `snow app deploy`。personal DB でも本人は開けるので Streamlit へは切り替えない。駄目なら localhost（`npm run dev`）で発表
5. 発表 3 問（案）：候補 #1「メンズファッションを買うのは 9 割女性」（つかみ）→ ID 1「優良顧客の単価は低い」（示唆）→ 虫食い 8（新モード）。ID 3 は除外後の 1 位を見てから決める
6. 14:00〜14:30：演出（パンダ・レインボー）を CoCo に入らない人が足す。14:30 以降コードを触らない

## 4. 指示文 A（画面担当の CoCo に貼る）

```
あなたは貼られた時刻から 13:50 まで、人の確認なしで作業します（人が横にいても質問はしない。止まったら人が「既定値で進めて」と打つ）。次のルールを守ってください。
- 質問はせずに進める（AskUserQuestion や「進めてよいですか」の確認文は使わない）。判断に迷ったらこの指示の既定値を採用し、より単純な方を選び、docs/progress_screen.md に「仮決め」として記録する
- 作業単位ごとに git commit し、直後に `git push -u origin lunch/screen`（main には push しない。force push しない）。push が失敗したら 1 回だけ再試行し、駄目なら理由を progress に書いて commit だけ続ける（fork 作成・remote 変更・トークン設定はしない）。壊れたら直前のコミットに戻す
- 触ってよいのは quiz-bot/ 配下と docs/progress_screen.md だけ。Snowflake のテーブルは読むだけ（QZ_ANSWERS への INSERT は既存 API 経由のみ）。.cortex/ .devcontainer/ .snowflake/ は触らない
- コミット前に quiz-bot で `npm test`（vitest）を通す。lint スクリプトは無いので実行しない
- 時刻は必ず `TZ=Asia/Tokyo date +%H:%M` で確認する（箱の時計は UTC なので素の date は使わない）。最初に 1 回実行して開始時刻を progress の先頭に書く。各ステップの最初にも実行し、13:40 を過ぎていたら新しいステップに入らない。13:50 になったら（または全部終わったら）止まり、docs/progress_screen.md に「できたこと／できなかったこと／仮決め／動かし方／デプロイ URL／既知の問題」を書いて commit・push する

役割：quiz-bot（Next.js、Snowflake App Runtime）に虫食いモード・回答者名・ランキング・定義表示を足し、デプロイする。既存の High & Low（components/quiz-game.tsx、app/api/quiz/route.ts、app/api/answer/route.ts）はそのまま活かす。

テーブルの実物（TEAM_B_DB.DEVELOPMENT。変えない）
- QZ_QUESTIONS(ID, DECK 'category'|'state'|'month'|'segment'|'weather', QTYPE 'highlow'|'blank', QUESTION_TEXT, ITEM_A, ITEM_B, METRIC, VALUE_A, VALUE_B, SERIES VARIANT, MASK_FROM, MASK_TO, CHOICES VARIANT, CORRECT NUMBER, EXPLANATION, SQL_TEXT, AI_GENERATED, CREATED_AT)
  - highlow：CORRECT 0＝A が正解、1＝B が正解
  - blank：SERIES は [{"x":"2023-04-03","y":123.0},...]（週次または月次。x は文字列のまま軸ラベルに使い、Date に変換しない。月次は 'YYYY-MM'）。MASK_FROM〜MASK_TO は隠す区間の添字（両端含む）。CHOICES は [{"label":"ペット・ペットグッズ","series":[0〜1 に正規化した数値の配列]}, ... 4 個]。CORRECT は正解の添字 0〜3。データ担当が同時に 3 問入れる。API が blank を 0 件返した時だけ、画面側で lib/dummy-blank.ts のダミー 2 問を使う（環境変数は不要）
- QZ_ANSWERS(ANSWERED_AT, PLAYER, QUESTION_ID, CHOSEN, IS_CORRECT)

やること（順番どおり。各ステップで commit）
1. API：app/api/quiz/route.ts に SERIES, MASK_FROM, MASK_TO, CHOICES を SELECT に足し、クエリパラメータ mode=highlow|blank|mix（既定 mix）で QTYPE を絞る。VARIANT 列は文字列で返るので JSON.parse してから返す。app/api/ranking/route.ts を新設：QZ_ANSWERS を QUESTION_ID で集計し、回答数 3 以上の問題を不正解率の高い順に 5 件（QUESTION_TEXT を JOIN）
2. 画面（quiz-game.tsx）：DECKS に { value: 'weather', label: '天気' } と { value: 'customer', label: '顧客属性' } を足し、'month' のラベルを '時期' にする（0 問なら既存のエラー表示で可）。formatNumber の単位の規則：METRIC の名前が _share か _rate で終わるものは %、aov と spend_per_customer は 円、orders は 件、orders_per_customer は 回、sales は 億／万円（既存）。それ以外は数値のまま（データ担当が候補問題で新しい METRIC を足すため）。スタート画面に回答者名の入力（既定 guest。/api/answer の player に渡す）とモード選択（High & Low／虫食い／ミックス）を足す。虫食い問題は、SERIES の折れ線を SVG（components/chart-utils.tsx にあれば再利用、無ければ polyline で自作。ライブラリは追加しない）で描き、MASK 区間は線を描かず薄い帯で示し、帯の中に赤枠の「？」を置く（docs/images/image.png＝田中さんの画面案。問題文の下に小さく「わからないだろう？」と煽ってよい）。下に CHOICES の 4 つを A〜D のラベル付きの小さな折れ線カードで並べ、クリックで回答（画像の A〜D と同じ並び。画像の上 2 本の参考線は今日はやらない）。答え合わせで元の系列全体と、各カードのラベル（正解のカテゴリと他 3 つのカテゴリ名）を表示。High & Low と同じく解説と SQL の折りたたみ
3. 結果画面：「みんなが外した問題 TOP5」（/api/ranking）を表示。全問正解なら見出しを虹色のグラデーション（CSS のみ）にする
4. 定義の折りたたみ：答え合わせの下に「定義」＝注文＝顧客 ID×購入日時／平均購入単価＝売上÷注文数／優良顧客＝Day3 の RFM 定義（化粧品購入者で R・F・M 高、2,865 人）／Apple Gift Card は集計から除外／期間 2023/4/1〜2024/3/31
5. 差し込み口：components/mascot.tsx に、連勝数と正誤を props で受け取る空のコンポーネントを作り、画面左下に置く（中身は人が 14:00 以降に足す）
5b. 余裕があれば：POST /api/generate {deck} → `CALL TEAM_B_DB.DEVELOPMENT.QZ_GENERATE_HIGHLOW(deck, 1)`。プロシージャが無ければ 503 と「AI 出題は休憩中」。スタート画面に「AI に新しい問題を作らせる」ボタン（503 でもゲームは止めない）
6. デプロイ：/snowflake-apps のスキルに従う。snowflake.yml が無ければ `snow app setup` を実行してから `snow app deploy`。アプリ名は quiz_bot_beta、query_warehouse は TEAM_B_WH。この Application Service だけは TEAM_B_DB.DEVELOPMENT 以外に作ってよい（例外）。URL は `snow app open --print-only`（無ければ `snow app events` の出力）で取って progress に書く。権限・personal database（USER$）・コンピュートプールで 2 回失敗したら、それ以上は試さず「デプロイ未」と理由を書いてローカル（npm run dev）で完成させる。Snowflake への接続は既存の lib/snowflake.ts の querySnowflake() をそのまま使い、.env.local や認証情報は書かない

完成条件：mix モードで High & Low と虫食い（ダミー可）が通しで回り、結果画面にランキングが出て、npm test が通る
優先順位（時間が無ければ下から削る）：1 → 2 → 3 → 6（デプロイ）→ 4 → 5 → 5b
```

## 5. 指示文 B（データ担当の CoCo に貼る）

```
あなたは貼られた時刻から 13:50 まで、人の確認なしで作業します（人が横にいても質問はしない。止まったら人が「既定値で進めて」と打つ）。次のルールを守ってください。
- 質問はせずに進める（AskUserQuestion や「進めてよいですか」の確認文は使わない）。判断に迷ったらこの指示の既定値を採用し、より単純な方を選び、docs/progress_data.md に「仮決め」として記録する
- SQL は sql/ に 1 作業 1 ファイルで保存し、作業単位ごとに git commit、直後に `git push -u origin lunch/data`（main には push しない）。push が失敗したら 1 回だけ再試行し、駄目なら理由を progress に書いて commit だけ続ける
- 触ってよいのは TEAM_B_DB.DEVELOPMENT の QZ_ で始まるテーブルと sql/・docs/progress_data.md だけ。MART_RAKUTEN_PURCHASES_RFM は読み取り専用。quiz-bot/ は触らない
- **QZ_QUESTIONS と QZ_ANSWERS は CREATE OR REPLACE／DROP／TRUNCATE しない**（AI・天気担当が同時に INSERT している）。自分の行の直しは UPDATE か DELETE ... WHERE ID IN (...) に限る
- ウェアハウス TEAM_B_WH。sql_execute はステートメントごとにセッションが戻るので、テーブルは常に TEAM_B_DB.DEVELOPMENT. で完全修飾し、必要なら各文の先頭で USE WAREHOUSE TEAM_B_WH を付ける（作業ログ 2-4）
- 時刻は必ず `TZ=Asia/Tokyo date +%H:%M` で確認する（箱の時計は UTC なので素の date は使わない）。最初に 1 回実行して開始時刻を progress の先頭に書く。各ステップの最初にも実行し、13:40 を過ぎていたら新しいステップに入らない。13:50 になったら止まり、docs/progress_data.md に「できたこと／できなかったこと／仮決め／検算結果（除外前後の数字）／既知の問題」を書いて commit・push する

役割：①Apple Gift Card をクイズ用の集計から除外して 5 本の集計テーブルと固定問題の値を作り直す ②解説文を型に合わせて書き直す ③問題 2 を差し替える ④虫食い問題を 3 問入れる。スキーマは作業ログ_CoCo.md の実物（CORRECT は数値、DECK は英語）を変えない。

① Apple Gift Card の除外
- まず `select item_name, count(*), sum(total_price) from TEAM_B_DB.DEVELOPMENT.MART_RAKUTEN_PURCHASES_RFM where item_name ilike '%gift card%' or item_name ilike '%ギフトカード%' group by 1 order by 3 desc limit 20` で表記ゆれを確認し、Apple Gift Card に当たる行の条件を決める
- 除外前の全行で `sum(total_price)`＝8,287,087,735、`count(distinct user_id_hash, purchased_at)`＝1,125,268 を確認（定義の検算）。除外した行数と金額を progress に書く
- 除外はビューで一元化：`CREATE OR REPLACE VIEW TEAM_B_DB.DEVELOPMENT.QZ_BASE AS SELECT * FROM TEAM_B_DB.DEVELOPMENT.MART_RAKUTEN_PURCHASES_RFM WHERE NOT (<①で決めた条件>)`。集計 5 本・固定問題・虫食いの SQL は全部 QZ_BASE から取る。大福帳を直接読むのは除外前の検算だけ
- QZ_AGG_CAT・QZ_AGG_STATE・QZ_AGG_MONTH_CAT・QZ_AGG_WEEK_CAT・QZ_AGG_SEG_CAT を同じ定義（注文＝顧客×購入日時、AOV＝売上÷注文数、カテゴリ異物は「カテゴリ不明」、STATE '不明' 除外）で CREATE OR REPLACE（除外条件を WHERE に追加）
- 固定問題 ID 1・3・101・102・103 の VALUE_A・VALUE_B・CORRECT・SQL_TEXT を除外後の値で UPDATE。除外前と 10% 以上ずれた問題は progress に書く
- **ID 3 は要注意**：Apple Gift Card はペット・ペットグッズに分類されていて、ペット売上の 78% を占める（docs/quiz-candidates.md のデータ品質メモ）。除外後は「化粧品以外の 1 位」がペットでなくなる可能性が高い（Day4 の実測では次点がキッズ・ベビー 10.7%、花・ガーデン 8.0%、食品 7.4%）。優良顧客の化粧品以外の売上構成比を QZ_BASE で再計算して 1 位と 2 位を出し、問題文を「化粧品以外で優良顧客が一番買うのは {1 位}？ {2 位}？」、ITEM_A={1 位}、ITEM_B={2 位}、VALUE_A/B=構成比（%）、METRIC 'sales_share' に UPDATE する。1 位がペットのままなら文はそのまま。結果を progress の先頭に「ID 3 の 1 位＝…」と書く
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

⑥ 候補からの追加（docs/quiz-candidates.md、駒場さん作成。High & Low、QTYPE 'highlow'）
- 候補の数字はそのまま使わない。候補の注文数（男 227K＋女 487K＝714K）は Day4 の全行 1,125,268 と合わず、定義か絞り込みが違う。**QZ_BASE と同じ定義（注文＝顧客×購入日時、Apple Gift Card 除外、カテゴリ異物は「カテゴリ不明」で行は残す）で再計算**し、CORRECT は比較で決める。候補の値と 10% 以上ずれたら progress に両方の数字を書く（向きが変わったら「向き反転」）
- 入れる順（時間が無ければ下から削る）。DECK と METRIC はこのとおり：
  1. 候補 #1：「メンズファッションを買っているのは、男性と女性どっちが多い？」DECK 'category'、METRIC 'customer_share'（メンズファッション購入者に占める割合 %）、ITEM_A '男性'、ITEM_B '女性'
  2. 候補 #15：「注文数が多いのは 6 月？ 12 月？」DECK 'month'、METRIC 'orders'。④-10 と同じ月次の COUNT(DISTINCT USER_ID_HASH, PURCHASED_AT) を使う（既存 ID 102 は「売上」で 12 月が上。注文数と売上で向きが違うなら解説にそれを書く＝12 月は単価が高い）
  3. 候補 #10：「1 注文あたりの平均額が高いのは東京都？ 石川県？」DECK 'state'、METRIC 'aov'。QZ_AGG_STATE から
  4. 候補 #7：「1 注文あたりの金額が高い年代は 20 代？ 70 代？」DECK 'customer'、METRIC 'aov'。年齢の列は大福帳の実物を DESCRIBE で確認し、年代は 10 歳刻み。100 歳以上は除く
  5. 候補 #13：「注文数が多いのは日曜？ 金曜？」DECK 'month'、METRIC 'orders'。DAYOFWEEKISO（1=月〜7=日）
  6. 余裕があれば候補 #12（沖縄 vs 北海道の aov、'state'）、#9（60 代 vs 20 代のコスメ単価、'customer'）
- #18 は既存 ID 1 と同じなので入れない。解説は②の型、SQL_TEXT は再計算に使った実 SQL、AI_GENERATED=FALSE

⑤ 検算：`select id, deck, qtype, question_text, correct, value_a, value_b from TEAM_B_DB.DEVELOPMENT.QZ_QUESTIONS order by id` を progress に貼る

順番：①（20 分。ID 3 の再計算を含む）→ ④ の 8（10 分）→ ⑥ の 1〜3（10 分）→ ②（ID 1・3・⑥ の分、5 分）→ ④ の 9・10 → ③ → ⑥ の 4〜6 → ⑤
優先順位（時間が無ければ下から削る）：① → ④-8 → ⑥-1〜3 → ② → ④-9・10 → ③ → ⑥-4〜6。13:40 を過ぎたら残りは捨てて ⑤ と progress
```

## 6. 指示文 C（AI 出題＋天気担当の CoCo に貼る）

```
あなたは貼られた時刻から 13:50 まで、人の確認なしで作業します（人が横にいても質問はしない。止まったら人が「既定値で進めて」と打つ）。次のルールを守ってください。
- 質問はせずに進める（AskUserQuestion や「進めてよいですか」の確認文は使わない）。判断に迷ったらこの指示の既定値を採用し、より単純な方を選び、docs/progress_ai_weather.md に「仮決め」として記録する
- SQL は sql/ に保存し、作業単位ごとに git commit、直後に `git push -u origin lunch/ai-weather`（main には push しない）。push が失敗したら 1 回だけ再試行し、駄目なら理由を progress に書いて commit だけ続ける
- 触ってよいのは TEAM_B_DB.DEVELOPMENT の QZ_ で始まるオブジェクト（QZ_QUESTIONS は INSERT のみ、既存行は UPDATE/DELETE しない）と sql/・docs/progress_ai_weather.md だけ。大福帳は読み取り専用。quiz-bot/ は触らない
- ウェアハウス TEAM_B_WH。テーブルは常に完全修飾し、各文の先頭で USE WAREHOUSE TEAM_B_WH（作業ログ 2-4）
- 時刻は必ず `TZ=Asia/Tokyo date +%H:%M` で確認する（箱の時計は UTC なので素の date は使わない）。最初に 1 回実行して開始時刻を progress の先頭に書く。各ステップの最初にも実行し、13:40 を過ぎていたら新しいステップに入らない。13:50 になったら止まり、docs/progress_ai_weather.md に「できたこと／できなかったこと／仮決め／検算結果／既知の問題」を書いて commit・push する

役割：①Cortex の AI 関数で High & Low の問題を自動生成するストアドプロシージャ ②天気（NOAA）×東京都の顧客の結合テーブルと、天気の問題 1 問。スキーマは作業ログ_CoCo.md の実物：DECK は 'category'|'state'|'month'|'segment'|'weather'、CORRECT は 0（A が正解）か 1（B が正解）、METRIC は 'sales'|'orders'|'customers'|'aov'|'female_share'。

① AI 出題（/cortex-ai-function-studio を使う）
- モデル：<MODEL>（§2 の疎通で通ったもの）。最初に `SELECT SNOWFLAKE.CORTEX.COMPLETE('<MODEL>', 'Reply with OK');` を 1 回実行し、エラーなら 'claude-sonnet-4-5' → 'llama3.3-70b' → 'llama3.1-8b' → 'mistral-large2' の順に同じ疎通を試して、通った名前を以後すべてに使い progress の先頭に書く。プロシージャ内は SNOWFLAKE.CORTEX.TRY_COMPLETE を使い、NULL なら次のモデルへ（COMPLETE はエラーで落ちる）。エラー文に legacy／not available が出たら即次へ
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

順番：①（25 分）→ ②（25 分）。① が開始から 25 分を過ぎても動かなければ ② に移る。
優先順位（時間が無ければ下から削る）：① のプロシージャと CALL 1 回 → ② の天気 1 問 → ① のテスト 2 回目
```
