# AGENTS.md

このリポジトリで作業するエージェント向けの共通ルールです。

## 基本方針

- サービス名は「家庭防災設計」で統一する。
- 本番URLは `https://www.katei-bousai.jp/`。
- フォームURLは `/form`、送信完了ページは `/thanks`。
- ユーザーは非エンジニア寄りなので、説明はできるだけ平易にする。
- デザインは高級感、安心感、シンプルさを維持する。

## 日本語ライティングルール

LP本文、サービス説明、記事、長文の解説文を新規作成・改稿するときは、作業前に以下を読む。

- `.agents/skills/japanese-tech-writing/SKILL.md`
- `.agents/skills/cognitive-rhythm-writing/SKILL.md`

`japanese-tech-writing` は、日本語の正確性、論理、段落構成、冗長排除の基本規範として使う。
`cognitive-rhythm-writing` は、LP本文や長文を読み進めやすくするための補助規範として使う。

Google広告の見出し・説明文、CTAボタン、フォームのラベル・エラー文、ナビゲーション、UI文言、短い数値・事実表現には、これらのSkillを機械的に適用しない。
短いコンバージョンコピーでは、文章上の演出よりも、検索意図との一致、意味の明確さ、信頼性、不安解消、問い合わせへの移行を優先する。

事実に存在しない体験談、利用者の声、場面、感情、実績、数値を創作しない。
Skillの規範とCV向上が衝突する場合は、正確性を維持したうえでCV目的を優先し、その判断を作業報告に記載する。

## デプロイ運用ルール

サイト改修依頼は、ユーザーから明示的に「本番反映して」「本番にも反映して」「そのまま公開して」などの指示がない限り、以下の流れで対応する。

1. ローカルで修正する
2. GitHubへPushする
3. Preview環境を作成する
4. Preview URLをユーザーへ共有する
5. ユーザーが画面確認・承認する
6. 承認後のみ本番へデプロイする

軽微な文言修正でも、明示的な本番反映指示がない限りPreview確認を挟む。

ただし、READMEやAGENTS.mdなどサイト表示に影響しないドキュメント更新は、必要に応じてmainへ直接反映してよい。

## 計測ルール

- `lp_scroll` は25%、50%、75%、90%で発火する。
- `cta_click` を壊さない。
- `form_view` を壊さない。
- `form_scroll` を壊さない。
- `form_start` を壊さない。
- `form_error` を壊さない。
- `form_submit` は送信操作時のイベントである。
- `form_success` は正常送信が完了した場合だけ1回発火する。
- Thanksページの再読み込み、直接アクセス、戻る・進む操作では `form_success` を再発火させない。
- `variant_id`、`scroll_percent`、`cta_id`、`cta_location`、`form_id`、`field_name`、`error_type`、`submission_id` の既存パラメータを壊さない。
- GTMタグ、GA4 ID、GTM IDを明示的な依頼なしに変更しない。

## フォーム運用ルール

- フォーム送信先はResend APIを使う。
- 通知メールの宛先は `info@katei-bousai.jp`。
- 送信元Fromは `家庭防災設計 <no-reply@katei-bousai.jp>`。
- Reply-Toはフォーム入力者のメールアドレスにする。
- フォーム送信後は `/thanks` へ遷移する。
- スパム対策用のhoneypotは維持する。

## DNS・メール認証ルール

明示的な依頼がない限り、以下のDNS設定は変更しない。

- `send.katei-bousai.jp`
- `resend._domainkey`
- SPF
- DKIM
- DMARC

## 実装時の注意

- スマホ表示で横スクロールを出さない。
- iPhone Safari相当の幅で、カードやテキストが画面外にはみ出さないようにする。
- 日本語の本文は不自然な位置で改行されないようにする。
- 大きな見出し以外では、強制改行を増やしすぎない。
- 既存の世界観や配色を大きく崩さない。
- 不要なファイルや古い案を増やさない。
