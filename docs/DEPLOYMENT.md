# デプロイメントガイド

このドキュメントでは、Quiz Platformを本番環境にデプロイするための手順を説明します。

## 前提条件

- Node.js 18以上
- PostgreSQLデータベース
- Vercel、Railway、またはDockerをサポートするホスティングサービス

## 環境変数

以下の環境変数を設定してください。

### 必須

```bash
# データベース接続
DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"

# NextAuth.js
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"

# OAuth プロバイダー (少なくとも1つ)
# Google OAuth
AUTH_GOOGLE_ID="your-google-client-id"
AUTH_GOOGLE_SECRET="your-google-client-secret"

# GitHub OAuth
AUTH_GITHUB_ID="your-github-client-id"
AUTH_GITHUB_SECRET="your-github-client-secret"
```

### 任意

```bash
# サイトURL (SEO、サイトマップ生成に使用)
NEXT_PUBLIC_APP_URL="https://your-domain.com"

# Google Search Console verification
GOOGLE_SITE_VERIFICATION="your-verification-code"

# Google AdSense
NEXT_PUBLIC_ADSENSE_CLIENT="ca-pub-xxxxxxxx"
NEXT_PUBLIC_AD_SLOT_HEADER="xxxxxxxxxx"
NEXT_PUBLIC_AD_SLOT_SIDEBAR="xxxxxxxxxx"
NEXT_PUBLIC_AD_SLOT_INFEED="xxxxxxxxxx"
NEXT_PUBLIC_AD_SLOT_RESULT="xxxxxxxxxx"

# 分析
NEXT_PUBLIC_GA_ID="G-XXXXXXXXXX"
```

## Vercelへのデプロイ

### 1. リポジトリの準備

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/your-username/quiz-platform.git
git push -u origin main
```

### 2. Vercelプロジェクトの設定

1. [Vercel](https://vercel.com)にログイン
2. 「New Project」をクリック
3. GitHubリポジトリをインポート
4. 環境変数を設定（Settings > Environment Variables）
5. デプロイ

### 3. データベースの設定

Vercel Postgres、Supabase、Railway、またはNeonを推奨します。

```bash
# Prismaマイグレーションを実行
npx prisma migrate deploy

# シードデータを投入（必要な場合）
npx prisma db seed
```

## Dockerでのデプロイ

### Dockerfile

```dockerfile
FROM node:18-alpine AS base

# Install dependencies
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Build the application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - NEXTAUTH_URL=${NEXTAUTH_URL}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - AUTH_GOOGLE_ID=${AUTH_GOOGLE_ID}
      - AUTH_GOOGLE_SECRET=${AUTH_GOOGLE_SECRET}
    depends_on:
      - db

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=quiz_platform
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

## セキュリティ対策

### 1. 環境変数の保護

- 環境変数は絶対にコミットしない
- `.env.local`は`.gitignore`に含める
- 本番環境ではホスティングサービスの環境変数機能を使用

### 2. データベースセキュリティ

- SSL接続を有効化（`?sslmode=require`）
- 最小限の権限でデータベースユーザーを作成
- IPホワイトリストを設定

### 3. 認証セキュリティ

- `NEXTAUTH_SECRET`は必ず強力なランダム文字列を使用
- OAuthコールバックURLを正確に設定
- CSRFトークンはNextAuthが自動処理

## 監視とログ

### Vercel Analytics

```bash
npm install @vercel/analytics
```

`app/layout.tsx`に追加:

```tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

### エラーモニタリング

Sentryの導入を推奨:

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

## パフォーマンス最適化

### 1. 画像最適化

- Next.js Image コンポーネントを使用
- WebP形式を優先
- 適切なサイズを指定

### 2. キャッシュ戦略

- 静的アセットは長期キャッシュ
- APIレスポンスは適切にキャッシュ

```ts
// app/api/categories/route.ts
export const revalidate = 3600; // 1時間キャッシュ
```

### 3. データベース最適化

- 必要なフィールドのみselect
- インデックスを適切に設定
- N+1問題を避ける

## トラブルシューティング

### ビルドエラー

```bash
# キャッシュをクリア
rm -rf .next node_modules
npm install
npm run build
```

### データベース接続エラー

1. `DATABASE_URL`が正しいか確認
2. データベースサーバーが起動しているか確認
3. ファイアウォール/セキュリティグループを確認

### 認証エラー

1. `NEXTAUTH_URL`がデプロイ先のURLと一致しているか確認
2. OAuthプロバイダーのコールバックURLを確認
3. `NEXTAUTH_SECRET`が設定されているか確認

## チェックリスト

デプロイ前に確認:

- [ ] 環境変数がすべて設定されている
- [ ] データベースマイグレーションが完了している
- [ ] ビルドが成功する
- [ ] テストがすべてパスする
- [ ] SSL証明書が有効
- [ ] robots.txtとsitemap.xmlが正しく生成される
- [ ] OAuthログインが動作する
- [ ] 広告スロットが設定されている（収益化する場合）
