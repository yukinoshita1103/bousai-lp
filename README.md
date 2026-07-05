# bousai-lp

家族構成・住まい・働き方に合わせた防災備蓄リスト作成サービスのランディングページです。

## 公開方法

VercelでこのリポジトリをImportすると、`index.html` がそのまま静的サイトとして公開されます。

## 計測

CTAクリック時に `dataLayer` へ `cta_click` イベントを送る実装を入れています。Google Tag Managerを導入する場合は、このイベントをトリガーに設定してください。

## TODO

- 問い合わせ先 `info@example.com` を実際のメールアドレスまたはフォームURLに差し替え
- Google Tag Manager / Google Analytics のタグ追加
- Meta Pixel の追加
- Vercelで本番公開
