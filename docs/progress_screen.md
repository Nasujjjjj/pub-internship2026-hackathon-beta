# progress_screen.md

開始時刻: 12:43 (JST)

## できたこと（累積）
1. **API** `/api/quiz` — ids（指定順返却）、n（LIMIT 既定10）、mode、SERIES/MASK/CHOICES
2. **API** `/api/ranking` — 不正解率 TOP5
3. **スプラッシュ** — 「TROCCO QUIZ ADVENTURE」「データの世界を駆け抜けろ」「β-LEAGUE ―楽天クイズ 知ってるつもり？」
4. **スタート画面** — 回答者名、モード、問題数、デッキカード、**ドボントグル**、URL パラメータ
5. **ゲーム画面** — Q k/n、進捗ドット、SCORE pt、EXIT、A/B ←→、ミュート🔊/🔇
6. **トロッコ演出** — ride state 6状態（parked/running/left-safe/right-safe/left-lava/right-lava）
7. **GIF 背景** — 未配置時は非表示、トロッコ CSS と両立
8. **BGM 2曲** — /sound/bgm_menu.mp3（スプラッシュ・スタート・結果、音量0.2）、/sound/bgm.mp3（問題中、音量0.25）。画面切替で前の曲を止めてから次を鳴らす。ミュートは両方に効く
9. **結果画面** result-screen.tsx — SCORE pt＋🌿、デッキ別正答率バー、TOP5、虹色見出し
10. **虫食いチャート** — マスク位置修正、答え合わせでは全体図のみ
11. **SE** — preloadAll、tryPlayFile 1500ms、se_decide（選択時）、se_reveal（判定時）、正解/不正解/連勝
12. **定義の折りたたみ** + **mascot.tsx**（空）

## 隠しコマンド（レインボーモード）
- 回答者名を `party_parrot` → パロット40羽 + 虹背景ビカビカ
- 回答者名を `rainbow_tanaka` → パロット10羽 + 虹背景 + 右上に「👑 RAINBOW TANAKA」バッジ
- URL の `?player=party_parrot` でも発動
- 判定は trim().toLowerCase() で行う。QZ_ANSWERS の PLAYER は入力のまま
- 発動時に se_streak を鳴らす
- 正解時は全羽 partyparrot、不正解時は sadparrot に切替、次の問題で元に戻す
- 結果画面の見出しは全問正解でなくても虹色
- 虹背景は z-index でトロッコの上、カードの下。filter: hue-rotate 0.5秒で一周
- カードは bg-background/90 + backdrop-blur で読める

## ドボンモード
- スタート画面の「ドボン（1 回間違えたら終了）」トグル（既定 OFF）
- URL の `?dobon=1` でも ON
- 不正解の答え合わせに「ドボン！」の赤い帯、ボタンは「結果を見る」で finished へ
- 結果画面に「ドボン：{k} 問目で終了」
- 全問正解なら通常どおり結果へ
- se_wrong の後に se_reveal をもう一度鳴らす

## URL パラメータ一覧
| パラメータ | 例 | 説明 |
|---|---|---|
| player | party_parrot | 回答者名（隠しコマンド判定あり） |
| mode | highlow / blank / mix | ゲームモード |
| deck | category | デッキ |
| n | 5 | 問題数 |
| ids | 501,1,8 | 指定問題ID（順序保持） |
| autostart | 1 | スプラッシュをスキップして自動開始 |
| dobon | 1 | ドボンモード ON |

## 差し替え用ファイル
```
quiz-bot/public/gif/party_parrot/   — パロット GIF 群
quiz-bot/public/gif/                — trocco_*.gif（トロッコ GIF、未配置可）
quiz-bot/public/sound/bgm.mp3      — 問題中 BGM
quiz-bot/public/sound/bgm_menu.mp3  — メニュー BGM
quiz-bot/public/sound/se_*.mp3     — 効果音（correct, wrong, streak, decide, reveal）
quiz-bot/public/adventure/          — lava-cave-track.webp, mine-cart.png
```

## デプロイ URL
https://jdc4mukm-on44798-ds-5daysinternship-2026.snowflakecomputing.app

## 既知の問題
- personal database (USER$KOYO_NASU)。発表者箱で再デプロイ推奨
- mascot.tsx は空実装
