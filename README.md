# 家庭防災設計 LP

首都圏直下型地震に備えた家庭防災設計サービスのLPです。Vercelで静的ページを配信し、無料診断フォームはVercel Serverless FunctionからResend経由でメール通知します。

## 公開URL

- 本番ドメイン: https://katei-bousai.jp/
- Vercel URL: https://bousai-lp.vercel.app/
- フォーム: https://katei-bousai.jp/form
- 送信完了: https://katei-bousai.jp/thanks

## ファイル構成

```text
/
├── index.html              # LP本体
├── form.html               # 無料診断フォーム
├── thanks.html             # 送信完了ページ
├── privacy-policy.html     # プライバシーポリシー
├── vercel.json             # /form と /thanks のルーティング設定
├── api/
│   └── contact.js          # フォーム送信用Vercel Function
└── assets/
    ├── hero-v2.png
    └── profile-shirahama.jpg
```

## 使用ライブラリ

追加のnpmライブラリは使っていません。

- HTML / CSS / JavaScript
- Vercel Serverless Function
- Resend REST API
- Google Tag Manager
- GA4

## フォーム送信の仕組み

1. ユーザーが `/form` から申し込み
2. ブラウザが `/api/contact` に送信
3. Vercel Functionが入力内容を検証
4. Resend API経由で `kota.nagahama1103@gmail.com` に通知
5. 送信成功後、`/thanks` に遷移

## Vercelの環境変数

Vercelの Project Settings > Environment Variables に以下を設定してください。

| 変数名 | 必須 | 内容 |
| --- | --- | --- |
| `RESEND_API_KEY` | 必須 | Resendで発行したAPIキー |
| `RESEND_TO_EMAIL` | 任意 | 通知先メール。未設定時は `kota.nagahama1103@gmail.com` |
| `RESEND_FROM_EMAIL` | 任意 | 送信元メール。例: `家庭防災設計 <no-reply@katei-bousai.jp>` |

環境変数を追加・変更した後は、Vercelで再デプロイしてください。

## Resendの本番設定

本番運用では、Resendで `katei-bousai.jp` を送信ドメインとして認証してください。

1. ResendでDomainを追加
2. 表示されたDNSレコードを、お名前.comのDNSに追加
3. Resend上で認証完了を確認
4. Vercelの `RESEND_FROM_EMAIL` を `家庭防災設計 <no-reply@katei-bousai.jp>` に設定

ドメイン認証前は、Resendのテスト用送信元 `onboarding@resend.dev` を使います。

## スパム対策

現在入れている対策:

- 見えない入力欄による簡易bot判定
- 許可したドメインからの送信のみ受け付けるOriginチェック
- 必須項目とメール形式のサーバー側検証

広告配信後に迷惑送信が増えた場合は、Cloudflare TurnstileやreCAPTCHAの追加を推奨します。

## 計測

GTM ID: `GTM-TDXNCJTG`

送信しているイベント:

- `cta_click`: LP内の主要CTAクリック
- `form_view`: フォームページ表示
- `form_submit`: フォーム送信成功

GTM側で以下のカスタムイベントトリガーを作ると、GA4で計測できます。

- `cta_click`
- `form_view`
- `form_submit`

GA4では、`form_submit` をキーイベントに設定すると、広告の成果計測に使いやすくなります。

## PDF保存手順

LPをA4印刷用PDFとして保存する場合:

1. `index.html` または公開URLをChromeで開く
2. `Ctrl + P` を押す
3. 送信先で「PDFに保存」を選ぶ
4. 用紙サイズを「A4」にする
5. 「背景のグラフィック」をオンにする
6. 必要に応じて倍率を調整して保存

## 運用メモ

- フォーム送信後の対応目安は「1営業日以内」
- 個人情報を扱うため、プライバシーポリシーは常にフォームから辿れる状態にする
- 広告を始める前に、GTMプレビューで `form_submit` が発火することを確認する
- 広告開始後は、LP訪問数、CTAクリック数、フォーム送信数、実際に相談につながった件数を週次で見る
