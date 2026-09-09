# progress_screen.md

開始時刻: 12:43 (JST)

## できたこと
1. **API** `/api/quiz` — ids（指定順で返す）、n（LIMIT、既定10）パラメータ追加。SERIES/MASK_FROM/MASK_TO/CHOICES/mode は前回実装済み
2. **API** `/api/ranking` — 不正解率 TOP5
3. **スプラッシュ画面** — 紺背景＋青ブロブ（radial-gradient）、「β-LEAGUE」大文字、「データでひらく、新しい視点。」「DATA × QUIZ × ANALYSIS」、START → ボタン。autostart/ids がある時はスキップ
4. **スタート画面** — 回答者名入力、モード選択（High & Low / 虫食い / ミックス）、問題数（5/10/20）、デッキは色付きグラデーションカードに絵文字アイコン付き。URL パラメータ（player, mode, deck, ids, n, autostart）対応
5. **ゲーム画面** — Q k/n＋進捗ドット（正解緑・不正解赤）、SCORE pt、EXIT ボタン、A/B バッジ付きボタン、虫食い A-D カード、ミュート切替 🔊/🔇
6. **GIF 背景** — background-gif.tsx：wait/move_l/move_r/answer_true/answer_false の 5 状態、state+問題番号の key で頭から再生。カード半透明＋backdrop-blur。ファイルが無い時は非表示（onError）
7. **トロッコ遷移** — 選択→move_l/r（MOVE_MS=1500ms）→判定→answer_true/false→次の問題でwaitに戻る。moving phase は「判定中...」
8. **結果画面** result-screen.tsx — SCORE pt＋🌿、デッキ別正答率バー、みんなが外した問題TOP5、「もう一度挑戦する」「トップに戻る」。全問正解で虹色見出し
9. **虫食いチャート修正** — 線は maskFrom-1 と maskTo+1 だけ、帯は線が切れている幅と一致。答え合わせではマスク図を出さず全体図のみ
10. **BGM + 効果音** — docs/SFX/ と docs/効果音,BGM/ の mp3 を public/sound/ にコピー。START で BGM ループ再生、正解/不正解/連勝で効果音。ファイル無ければ Web Audio API で合成
11. **定義の折りたたみ** — 答え合わせ下にトグル
12. **mascot.tsx** — 空コンポーネント（左下 fixed）
13. **ヘッダー** — 「β-LEAGUE」＋副題「楽天クイズ ― 知ってるつもり？」

## できなかったこと
- Step 5b（AI 出題 API `/api/generate`）は未実装

## 差し替え用ファイルの置き場と名前
```
quiz-bot/public/gif/
  trocco_wait.gif        — 問題表示中（待機）
  trocco_move_l.gif      — 左の選択肢を選んだ時
  trocco_move_r.gif      — 右の選択肢を選んだ時
  trocco_answer_true.gif — 正解
  trocco_answer_false_.gif — 不正解（末尾アンダースコア付き優先）
  trocco_answer_false.gif  — 不正解（フォールバック）

quiz-bot/public/sound/
  bgm.mp3        — BGM（ループ再生）← docs/効果音,BGM/ からコピー済み
  se_correct.mp3 — 正解 SE ← docs/SFX/正解.mp3 からコピー済み
  se_wrong.mp3   — 不正解 SE ← docs/SFX/不正解.mp3 からコピー済み
  se_streak.mp3  — 連勝 SE ← docs/SFX/デレンッ.mp3 からコピー済み
```

## 動かし方
```bash
cd quiz-bot && npm ci && npm run dev
# http://localhost:3000
# URL パラメータ例: ?ids=501,1,8&autostart=1&player=田中
```

## デプロイ URL
https://jdc4mukm-on44798-ds-5daysinternship-2026.snowflakecomputing.app

## 既知の問題
- デプロイ先は personal database (USER$KOYO_NASU)。発表者（田中さん）の箱での再デプロイ推奨
- mascot.tsx は空実装（14:00 以降に手動追加）
- GIF ファイルは未配置（public/gif/ に置けば自動表示される）
