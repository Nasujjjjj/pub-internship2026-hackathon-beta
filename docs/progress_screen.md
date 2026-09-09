# progress_screen.md

開始時刻: 12:43 (JST)

## できたこと
1. **API** `/api/quiz` — ids（指定順返却）、n（LIMIT 既定10）、mode、SERIES/MASK_FROM/MASK_TO/CHOICES
2. **API** `/api/ranking` — 不正解率 TOP5
3. **スプラッシュ** — 紺背景＋青ブロブ、「TROCCO QUIZ ADVENTURE」「データの世界を駆け抜けろ」「β-LEAGUE ― 楽天クイズ 知ってるつもり？」。autostart/ids でスキップ
4. **スタート画面** — 回答者名、モード（HL/虫食い/ミックス）、問題数（5/10/20）、色付きデッキカード＋絵文字。URL パラメータ対応
5. **ゲーム画面** — Q k/n＋進捗ドット、SCORE pt、EXIT、A/B バッジ＋←→、ミュート🔊/🔇
6. **トロッコ演出** — 駒場さんの codex/trolley-adventure-prototype を統合。adventure-stage.tsx（Context）、globals.css（CSS アニメーション）、page.tsx（AdventureStage ラップ）、lava-cave-track.webp + mine-cart.png
7. **GIF 背景** — background-gif.tsx（GIF 未配置時は非表示、トロッコ CSS と両立）
8. **遷移** — 選択→move_l/r（MOVE_MS=1650ms、脱線アニメと同期）→判定→answer_true/false→wait
9. **結果画面** result-screen.tsx — SCORE pt＋🌿、デッキ別正答率バー、TOP5、虹色見出し
10. **虫食いチャート** — マスク位置修正、答え合わせでは全体図のみ
11. **BGM + SE** — preloadAll で起動時に 5 ファイルプリロード。tryPlayFile タイムアウト 1500ms（二重再生防止）。決定音 se_decide.mp3、判定音 se_reveal.mp3、正解/不正解/連勝。ミュートは SE にも効く
12. **定義の折りたたみ** + **mascot.tsx**（空、左下 fixed）

## トロッコ演出＝駒場さんの枝を統合

### Ride State の対応表
| ride state | 発火タイミング | CSS アニメーション |
|---|---|---|
| `parked` | スプラッシュ、スタート画面、結果画面、EXIT | トロッコ非表示 |
| `running` | 問題表示中、次の問題へ | 洞窟ゆれ＋レール火花＋トロッコ揺れ＋分岐レール表示 |
| `left-safe` | 左選択＋正解 | 左カーブして戻る |
| `right-safe` | 右選択＋正解 | 右カーブして戻る |
| `left-lava` | 左選択＋不正解 | 左脱線→マグマダイブ（1.65s） |
| `right-lava` | 右選択＋不正解 | 右脱線→マグマダイブ（1.65s） |

### 左右の対応
- High & Low: A（choice 0）= left、B（choice 1）= right
- 虫食い: A・C（偶数）= left、B・D（奇数）= right

## 差し替え用ファイルの置き場と名前
```
quiz-bot/public/gif/
  trocco_wait.gif, trocco_move_l.gif, trocco_move_r.gif, trocco_answer_true.gif, trocco_answer_false_.gif

quiz-bot/public/sound/
  bgm.mp3        ← docs/効果音,BGM/ からコピー済
  se_correct.mp3 ← docs/SFX/正解.mp3
  se_wrong.mp3   ← docs/SFX/不正解.mp3
  se_streak.mp3  ← docs/SFX/デレンッ.mp3
  se_decide.mp3  ← docs/SFX/決定音.mp3（選択肢押下時）
  se_reveal.mp3  ← docs/SFX/カウントダウン.mp3（判定表示時）

quiz-bot/public/adventure/
  lava-cave-track.webp — 洞窟背景
  mine-cart.png — トロッコ画像
```

## デプロイ URL
https://jdc4mukm-on44798-ds-5daysinternship-2026.snowflakecomputing.app

## 既知の問題
- personal database (USER$KOYO_NASU)。発表者箱で再デプロイ推奨
- mascot.tsx は空実装
- GIF ファイルは未配置（public/gif/ に置けば自動表示。トロッコ CSS と両立）
