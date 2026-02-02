# Quiz Platform 開発ルール

このファイルはClaude Codeが作業前に必ず読み込むプロジェクトルールです。

## 実装ルール

### 1. 受入基準の確認
- 実装前に受入基準を明確にすること
- 実装後、受入基準を満たしているか確認すること

### 2. コードレビュー（3回繰り返し）
実装後、以下の観点でレビューと改善を3回繰り返すこと：

1. **受入基準**: 要件を満たしているか
2. **テスト**: テストが通過しているか
3. **エッジケース**: null、空配列、境界値などに対応しているか
4. **命名**: 関数・変数名が分かりやすいか
5. **DRY原則**: 重複コードがないか
6. **エラーハンドリング**: 適切なエラー処理があるか
7. **セキュリティ**: SQL Injection、XSS対策ができているか
8. **パフォーマンス**: 計算量が適切か

### 3. テスト要件
- 単体テストを必ず実施すること
- カバレッジ80%以上を合格基準とする
- `npm run test` でテストを実行
- `npm run test:coverage` でカバレッジを確認

## 技術スタック

- **フレームワーク**: Next.js 16 (App Router)
- **言語**: TypeScript (strict mode)
- **DB**: PostgreSQL + Prisma
- **認証**: NextAuth.js v5
- **UI**: shadcn/ui + Tailwind CSS v4
- **バリデーション**: Zod
- **データフェッチ**: TanStack React Query
- **テスト**: Vitest + React Testing Library

## コーディング規約

### TypeScript
- `any` 型の使用禁止
- 明示的な型定義を推奨
- `as` によるキャストは最小限に

### React
- Server Components をデフォルトで使用
- Client Components は `"use client"` を明示
- カスタムフックは `src/hooks/` に配置

### API
- `src/lib/api-response.ts` の関数を使用
- 入力は必ずZodでバリデーション
- エラーは `handleApiError` で統一処理

### セキュリティ
- ユーザー入力は `sanitizeInput` でサニタイズ
- 認証必須エンドポイントは `auth()` でセッション確認
- 環境変数は `src/lib/env.ts` で型安全に管理

## ファイル構成

```
src/
├── app/           # ページ・API (App Router)
├── components/    # UIコンポーネント
│   ├── ui/        # shadcn/ui 基本コンポーネント
│   ├── layout/    # レイアウトコンポーネント
│   ├── quiz/      # クイズ関連
│   └── common/    # 共通コンポーネント
├── hooks/         # カスタムフック
├── lib/           # ユーティリティ・設定
├── providers/     # Reactプロバイダー
└── types/         # 型定義
```

## コマンド

```bash
# 開発サーバー
npm run dev

# ビルド
npm run build

# テスト
npm run test
npm run test:coverage

# Lint
npm run lint

# Prisma
npx prisma migrate dev    # マイグレーション
npx prisma generate       # クライアント生成
npx prisma studio         # DB管理UI
```
