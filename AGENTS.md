# Repository Guidelines

このファイルは、このリポジトリで作業する Codex およびその他のエージェント向けのルールです。
リポジトリ内の作業では、ユーザーから明示された指示を最優先し、その範囲を超える変更を行わないでください。

## Project Overview

- フロントエンド: Vue 3、TypeScript、Vite
- 状態管理: Pinia
- ルーティング: Vue Router（History Mode）
- スタイル: SCSS
- Backend / Database: Supabase、PostgreSQL
- 認証: Supabase Anonymous Auth
- DBアクセス制御: Row Level Security（RLS）、PostgreSQL Function / RPC
- 地図UI: Leaflet
- 地図データ: OpenStreetMap
- Geocoding / Reverse Geocoding: Geoapify
- ホスティング: Vercel

主要な実装箇所:

- `src/views`: 画面単位のVueコンポーネント
- `src/components`: 共通UIおよび予定関連コンポーネント
- `src/stores/schedule.ts`: 認証状態、予定、参加者、回答、集計の中心となるPinia Store
- `src/router/index.ts`: ルート定義と招待URLのガード
- `src/lib/supabase.ts`: Supabaseクライアント
- `src/lib/auth.ts`: Supabase匿名認証
- `src/services/geoapify.ts`: Geoapify API呼び出し
- `src/types/schedule.ts`: 予定・回答・集計結果の共通型
- `sql/migrations`: DB schema、RLS、Policy、Function / RPCのmigration
- `sql/seeds`: UI・結合・回帰確認用seed

## Scope and Change Safety

- 作業開始時に `git status --short` を確認し、既存の変更を把握してください。
- ユーザーの未コミット変更はユーザーの所有物です。取り消し、上書き、整形、移動、削除を行わないでください。
- タスクと無関係なファイルを変更しないでください。
- 既存の変更と作業対象が重なる場合は、差分を確認してユーザーの変更を保持してください。安全に分離できない場合は作業を止め、ユーザーに確認してください。
- `git reset --hard`、`git checkout --`、`git clean` など、未コミット変更を失う可能性がある操作を行わないでください。
- `dist`、`.eslintcache`、`*.tsbuildinfo` などの生成物を手作業で編集しないでください。
- 削除やデータ破壊を伴う操作は、対象を事前に特定し、ユーザーの明示的な許可なしに実行しないでください。

## Secrets and Environment Variables

- `.env*` の内容、SupabaseのURL・キー、Geoapify APIキー、認証トークンを出力しないでください。
- `.env*` を変更、作成、削除、コミットしないでください。ただし、ユーザーが対象ファイルと変更内容を明示的に指定した場合を除きます。
- 環境変数の調査が必要な場合は、値ではなく変数名の存在だけを確認してください。
- `VITE_` で始まる環境変数はブラウザへ公開される前提で扱い、秘密鍵を設定しないでください。
- ログ、テスト出力、エラー報告、スクリーンショットに秘密情報を含めないでください。

## Application Architecture

- Supabaseクライアントは `src/lib/supabase.ts` の単一インスタンスを使用してください。
- Supabase匿名認証は `src/lib/auth.ts` を経由してください。
- アプリ全体で共有するSchedule関連型は `src/types/schedule.ts` に定義してください。
- DBの `snake_case` と画面モデルの `camelCase` の変換箇所を明確に保ってください。
- RLSをフロントエンドの表示制御で代替しないでください。画面側の制御とDB側の認可は別々に確認してください。
- Storeを変更するときは、認証、データ取得、DB行から画面モデルへの変換、集計Getterへの影響を確認してください。
- Vue Routerのルートを変更するときは、VercelのSPA rewriteとHistory Modeを維持してください。

## Database Migrations

- `sql/migrations` の既存migrationファイルを直接書き換えないでください。
- schema、制約、RLS、Policy、Function、RPCを変更する場合は、新しい連番のmigrationファイルを追加してください。
- 新しいファイル名は既存の命名に合わせ、次の未使用番号を使用してください。例: `003_describe_change.sql`。
- migrationの実行順序と前提となるmigrationをファイル内のコメントに記載してください。
- 可能な処理はトランザクションで囲み、再実行時の挙動を考慮してください。
- 適用済みmigrationを推測で修正しないでください。現在のDB状態が不明な場合はユーザーに確認してください。
- schema変更時は、TypeScript型、StoreのDB行型と変換処理、RLS、Policy、RPC、seed、READMEへの影響を確認してください。
- `schedules.created_by`、`members.user_id`、`responses.user_id` は現状で型が統一されていません。比較時の `auth.uid()` と `auth.uid()::text` を取り違えないでください。

## RLS and Policies

- RLSを無効化したり、認証済みユーザーへ無条件の書き込み権限を与えたりしないでください。
- RLS変更時は、DB列の型、Policy、利用するFunction / RPC、Storeのクエリ、seedをセットで確認してください。
- RLS変更後は少なくとも次の利用者ケースを確認してください。
  - 予定作成者
  - 対象予定の参加者
  - 招待コードを持つ未参加ユーザー
  - 別予定にだけ参加しているユーザー
- `schedules`、`members`、`responses` のSELECT / INSERT / UPDATE / DELETEを個別に確認してください。
- `SECURITY DEFINER` Functionでは `search_path`、実行権限、返却列、RLS迂回範囲を確認してください。
- フロントエンドから渡されたユーザーIDを信用せず、DB側で `auth.uid()` と照合してください。

## Seed Data

- seedを実行する前に、対象がローカル、開発、ステージング、本番のどのSupabase環境かを必ず確認してください。
- seedを実行する前に、DELETE、TRUNCATE、UPSERTなどで削除・上書きされる対象テーブル、条件、予定IDや接頭辞を必ず確認してください。
- 対象環境と削除対象をユーザーへ明示し、ユーザーの承認を得るまでseedを実行しないでください。
- UIテスト用seedを本番環境へ実行しないでください。
- seed内のAuth UID、表示名、その他の環境依存値を実行前に確認してください。
- seed変更時は現在のschema、列型、制約、RLS、Policyとの互換性チェックを維持してください。

## Maps and Geoapify

- GeoapifyへのHTTP呼び出しは `src/services/geoapify.ts` に集約してください。ViewやコンポーネントからGeoapify APIを直接 `fetch` しないでください。
- 位置情報のアプリ内表現は `{ lat, lng }` を使用し、Geoapifyの `lon` との変換をサービス層で行ってください。
- Geocoding処理では通信失敗、結果なし、入力の連続変更、AbortSignalによるキャンセルを扱ってください。
- Geoapify APIキーをソースコードへ直接記載しないでください。
- OpenStreetMapのattributionを削除、非表示化、判読不能化しないでください。
- 地図タイル提供元を変更する場合は、利用規約、attribution、利用量制限を確認してください。
- 出発地点を変更するときは、表示名、緯度、経度の整合性と既存回答の復元を確認してください。

## Domain and Data Integrity

- `responses` の交通条件に関するUIとDB制約を同期してください。
  - 徒歩・車: 出発地点、緯度、経度、移動時間が必要
  - 電車: 出発地点と移動時間は不要で、希望エリアが1件以上必要
  - 条件なし: 出発地点と移動時間は不要
- `preferred_areas` は最大5件という制約をUIとDBの両方で維持してください。
- 集計ロジック変更時は、回答0件、同票、全員一致、`何でもOK`、表記揺れ、同一回答内の重複投票を確認してください。
- 日付処理変更時は、月またぎ、年またぎ、開始日と終了日が同じ場合、ローカルタイムゾーンを確認してください。
- 予定作成、参加登録、回答保存では途中失敗による不完全データを考慮してください。

## Commands and Verification

- `npm run lint`、`npm run lint:oxlint`、`npm run lint:eslint` は現在 `--fix` を含み、ソースを変更します。検査だけの目的では実行しないでください。
- 非修正lintは、設定を変更せず次のコマンドで実行してください。
  - `npx oxlint .`
  - `npx eslint . --cache=false`
- 変更後は、タスクの範囲とリスクに応じて少なくとも次を確認してください。
  1. `npm run type-check`
  2. 非修正lint
  3. `npm run build`
- `npm run build` は型チェックとVite buildを実行し、`dist` を更新します。生成物の差分をコミット対象に含めるかはユーザーの指示と既存方針に従ってください。
- 検証コマンドが既存ファイルや生成物を変更し得る場合は、実行前後に `git status --short` を確認し、ユーザーの変更と区別してください。
- 自動テスト用の `test` scriptは現状ありません。テスト基盤を追加する場合は、ユーザーの依頼範囲を超えて導入しないでください。
- コマンドを実行できなかった場合は、未実行の項目と理由を最終報告へ明記してください。

## Documentation and Handoff

- 技術、環境変数名、SQL構成、コマンドを変更した場合はREADMEや設計資料への影響を確認してください。
- 外部サービスを追加・変更する場合は、`docs/design/TECH_DECISIONS.md` の方針に沿って採用理由と見直し条件を記録してください。
- 最終報告では、変更したファイル、実施した検証、未実施の検証、既知の注意点を簡潔に説明してください。

## UI Design Rules

- UIのアイコンは原則として絵文字を使わず、`stroke="currentColor"` の線画SVGを使用する。
- パステル背景上のアイコンは黒系にせず、背景・アクセント色と同系統の少し濃い色を使用する。
- UIで使用する色は、原則として共通のカラートークンとして定義・一元管理し、Vueコンポーネント内にHEX・RGB等の色値を直接記述しない。
- 同じ役割・意味を持つ色は画面ごとに個別定義せず、既存のカラートークンを再利用する。
- 新しい色が必要な場合は、既存のカラートークンで表現できないかを先に確認し、追加する場合も既存の配色・明度・彩度との統一感を保つ。

### Visual Design Direction

このアプリのUIは、シンプルで洗練されたモバイルUIをベースに、
控えめなポップさと遊び心を加える。

- 白〜ごく淡い背景と十分な余白を基本とし、情報階層を明確にする
- パステルカラーを活用するが、装飾を増やしすぎず、静かで見やすい画面を保つ
- ポップさは、意味のない装飾ではなく「色・形・レイアウト・情報構造」で表現する
- キラキラ、丸、三角、紙吹雪などの装飾を周囲に無目的に散らさない
- 装飾を追加する場合は、その画面の意味や情報を視覚化する役割を持たせる
- 例：複数人の希望がまとまることを、重なった図形や交差部分として表現する
- 図形表現はシンプルかつ幾何学的にし、幼すぎるイラスト表現は避ける
- 重なり、アウトライン、透過などを使った控えめな視覚表現を好む
- UIアイコンは絵文字ではなく、既存方針どおり line SVG / currentColor を基本とする
- 「かわいい」だけを目的にせず、親しみやすさ・軽快さ・洗練のバランスを取る

### Visual Hierarchy

- 画面内で最も重要なユーザーデータを、装飾より優先して目立たせる
- 予定詳細や集計結果では、予定名を主要な情報として十分なサイズ・ウェイトで表示する
- 「集計結果」などの画面種別ラベルと、「テスト作成」などのユーザーデータは明確に階層を分ける
- 装飾を成立させるために、重要なタイトルやユーザーデータを小さくしない
- 文字サイズ、ウェイト、余白、配置によって重要度が自然に伝わるようにする

### Design Principle

遊び心は「飾って楽しくする」より、
「情報やコンセプトそのものを視覚的に楽しくする」ことを優先する。

装飾を追加する前に、
「この表現は何を伝えているか」を確認する。
意味を持たない装飾であれば、原則として追加しない。
