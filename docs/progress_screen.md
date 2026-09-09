# progress_screen.md

開始時刻: 12:43 (JST)

## できたこと
1. **API 更新** (Step 1)
   - `/api/quiz` に SERIES, MASK_FROM, MASK_TO, CHOICES を SELECT に追加
   - `mode=highlow|blank|mix` クエリパラメータ対応（既定 mix）
   - VARIANT 列は JSON.parse してから返す
   - `/api/ranking` を新設：不正解率の高い問題 TOP5

2. **画面更新** (Step 2)
   - DECKS に `weather`（天気）、`customer`（顧客属性）を追加
   - `month` のラベルを「時期」に変更
   - formatNumber の単位規則：`_share`/`_rate` → %、`aov`/`spend_per_customer` → 円、`orders` → 件、`orders_per_customer` → 回、`sales` → 億/万円、それ以外は数値のまま
   - スタート画面に回答者名入力（既定 guest）とモード選択（High & Low / 虫食い / ミックス）
   - 虫食い問題：SVG polyline で折れ線、MASK 区間は薄い帯 + 赤枠「？」
   - CHOICES は A〜D のミニ折れ線カードで表示
   - 答え合わせで元の系列全体表示 + 各カードのラベル（正解にはバッジ）
   - 解説と SQL の折りたたみは High & Low / 虫食い 共通

3. **結果画面** (Step 3)
   - 「みんなが外した問題 TOP5」（/api/ranking）を表示
   - 全問正解なら見出しを虹色グラデーション（CSS のみ）

4. **定義の折りたたみ** (Step 4)
   - 答え合わせの下に「定義」トグル：注文＝顧客ID×購入日時、平均購入単価＝売上÷注文数、優良顧客＝Day3 RFM 定義（2,865人）、Apple Gift Card 除外、期間 2023/4/1〜2024/3/31

5. **mascot.tsx** (Step 5)
   - 連勝数と正誤を props で受け取る空コンポーネント（画面左下 fixed）

6. **デプロイ** (Step 6)
   - `snow app setup` → `snow app deploy` 成功
   - personal database USER$KOYO_NASU.PUBLIC に配備

7. **ダミー虫食い問題** (lib/dummy-blank.ts)
   - API が blank を 0 件返したときにダミー 2 問を使用

## できなかったこと
- Step 5b（AI 出題 API `/api/generate`）は未実装（優先順位外）

## 仮決め
- blank 問題がDB に 0 件の場合はダミー 2 問を自動挿入（指示書通り）
- 虫食いチャートは SVG polyline で自作（ライブラリ追加なし）

## 動かし方
```bash
cd quiz-bot
npm ci
npm run dev
# http://localhost:3000 でアクセス
```

## デプロイ URL
https://jdc4mukm-on44798-ds-5daysinternship-2026.snowflakecomputing.app

## 既知の問題
- デプロイ先は personal database (USER$KOYO_NASU) のため本人のみアクセス可。発表者（田中さん）の箱での再デプロイが必要
- 虫食いの上 2 本の参考線は未実装（指示書で「今日はやらない」）
- mascot.tsx は空実装（14:00 以降に手動で中身を足す想定）
