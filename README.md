# stellacreate-data

[StellaCreate](https://stellacreate.com/) の一覧ダッシュボード型ページが読み込むデータ置き場です。

## ファイル

| パス | 内容 |
|---|---|
| `castle/events.json` | 全国お城イベント一覧のデータ |
| `castle/castle.js` | 画面の部品と処理（WordPressのページから読み込む） |
| `castle/castle.css` | デザイン（castle.jsが自動で読み込む） |

## WordPress側の設定

- 本文（コードモード）：`<div id="castle-ev">イベント情報を読み込んでいます…</div>`
- Cocoonの「カスタムJavaScript」欄：`castle/castle.js` を読み込む短いコード

## events.json の形式

```json
{
  "updated": "YYYY-MM-DD",
  "note": "メモ",
  "events": [
    {
      "name": "イベント名",
      "castle": "城の名前",
      "pref": "都道府県",
      "region": "地方キー（tohoku / kanto / chubu / kinki / chugoku-shikoku / kyushu）",
      "type": "祭り・パレード / ライトアップ / 体験 / 展示 / グルメ・物産",
      "start": "開始日 YYYY-MM-DD",
      "end": "終了日 YYYY-MM-DD（1日だけなら start と同じ）",
      "free": true,
      "resv": false,
      "desc": "短い説明（自分の言葉で書く。公式サイトの文章は転載しない）",
      "source": "情報源の名前",
      "url": "公式ページのURL"
    }
  ]
}
```

## 運用ルール

- 情報源は公式サイト・自治体・観光協会などの一次情報を優先する
- 終了したイベントはページ側で自動的に非表示になる（データから消すのは任意）
- 現在のデータは画面確認用の架空データ
