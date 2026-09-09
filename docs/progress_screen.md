# progress_screen.md

## 画面の流れ
splash (`/bg/home.jpg`) → mode (`/bg/mode.jpg`) → count (`/bg/count.jpg`) → deck (`/bg/category.jpg` + overlay) → game → result

- ids か autostart パラメータがあれば splash〜deck を飛ばしてゲームへ
- EXIT → mode 画面、「トップに戻る」→ mode 画面

## ホットスポット（ImageScreen の座標 %）
| 画面 | 要素 | left | top | width | height |
|------|------|------|-----|-------|--------|
| splash | START 看板 | 15% | 59% | 29% | 15% |
| mode | 虫食いクイズ | 27% | 38% | 22% | 45% |
| mode | 4択クイズ | 51% | 38% | 22% | 45% |
| count | 5問 | 26% | 38% | 15% | 33% |
| count | 10問 | 42% | 38% | 15% | 33% |
| count | 20問 | 59% | 38% | 15% | 33% |
| count | 戻る | 32% | 77% | 13% | 8% |
| count | 次へ | 50% | 77% | 17% | 8% |

## トロッコの重なり修正
- `.adventure-content` z-index: 5、`.adventure-cart` z-index: 1（カードより必ず後ろ）
- トロッコは 14rem、bottom -6rem（小さくして邪魔にならない）
- `[data-ride-state="running"]` で opacity: 0（問題表示中は非表示）
- safe/lava のアニメ中だけ表示、答え合わせ中もカードの後ろ

## パロットのサイズ分布（40羽の場合）
- 25羽: 24〜80px（z-index 2、手前、速い bounce）
- 10羽: 100〜200px（z-index 1、中間）
- 5羽: 260〜420px（z-index 0、背景側、opacity 0.5、ゆっくり）

## 効果音
- 正解: se_correct.mp3 のみ
- 不正解: se_wrong.mp3 のみ
- 鳴らす前に鳴っている SE を全部停止（同時1つだけ）
- 決定音・連勝音・カウントダウン・デレンッは削除済み

## BGM 2曲
- /sound/bgm_menu.mp3: splash→mode→count→deck→result（音量 0.2、ループ）
- /sound/bgm.mp3: ゲーム中（音量 0.25、ループ）
- 画面切替で前の曲を止めてから次を鳴らす。ミュートは両方に効く

## 隠しコマンド
- `party_parrot` → パロット40羽（巨大5羽含む）+ 虹背景ビカビカ
- `rainbow_tanaka` → パロット10羽 + 👑バッジ + 虹背景

## ドボンモード
- トグル or `?dobon=1`。不正解→「ドボン！」赤帯→即結果

## URL パラメータ
player, mode, deck, n, ids, autostart, dobon

## デプロイ URL
https://jdc4mukm-on44798-ds-5daysinternship-2026.snowflakecomputing.app

## 差し替え用ファイル
```
quiz-bot/public/bg/home.jpg, mode.jpg, count.jpg, category.jpg  — 画面背景
quiz-bot/public/gif/party_parrot/  — パロット GIF 群
quiz-bot/public/gif/trocco_*.gif   — トロッコ GIF（未配置可）
quiz-bot/public/sound/bgm.mp3, bgm_menu.mp3, se_correct.mp3, se_wrong.mp3
quiz-bot/public/adventure/lava-cave-track.webp, mine-cart.png
```
