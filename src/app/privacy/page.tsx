import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-muted/30">
        <div className="container py-8">
          <div className="mb-6">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                トップに戻る
              </Link>
            </Button>
          </div>

          <div className="max-w-3xl mx-auto">
            <Card>
              <CardContent className="p-6 sm:p-8">
                <h1 className="text-3xl font-bold mb-2">プライバシーポリシー</h1>
                <p className="text-sm text-muted-foreground mb-8">最終更新日: 2024年1月1日</p>

                <p className="text-muted-foreground leading-relaxed mb-8">
                  Quiz Platform（以下「当サービス」といいます）は、ユーザーの個人情報の取扱いについて、
                  以下のとおりプライバシーポリシー（以下「本ポリシー」といいます）を定めます。
                </p>

                <div className="space-y-8">
                  <section>
                    <h2 className="text-xl font-semibold mb-3 pb-2 border-b">1. 収集する情報</h2>
                    <p className="text-muted-foreground leading-relaxed mb-4">
                      当サービスは、以下の情報を収集する場合があります。
                    </p>

                    <div className="space-y-4 ml-4">
                      <div>
                        <h3 className="font-medium mb-2">1.1 アカウント情報</h3>
                        <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
                          <li>メールアドレス</li>
                          <li>ユーザー名</li>
                          <li>プロフィール画像（ソーシャルログイン利用時）</li>
                        </ul>
                      </div>

                      <div>
                        <h3 className="font-medium mb-2">1.2 利用情報</h3>
                        <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
                          <li>作成したクイズの内容</li>
                          <li>クイズの回答履歴とスコア</li>
                          <li>サービスの利用履歴</li>
                        </ul>
                      </div>

                      <div>
                        <h3 className="font-medium mb-2">1.3 技術情報</h3>
                        <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
                          <li>IPアドレス</li>
                          <li>ブラウザの種類</li>
                          <li>アクセス日時</li>
                          <li>Cookie情報</li>
                        </ul>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold mb-3 pb-2 border-b">2. 情報の利用目的</h2>
                    <p className="text-muted-foreground leading-relaxed mb-3">
                      収集した情報は、以下の目的で利用します。
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-2">
                      <li>サービスの提供・運営</li>
                      <li>ユーザーからのお問い合わせへの対応</li>
                      <li>サービスの改善・新機能の開発</li>
                      <li>利用規約に違反する行為への対応</li>
                      <li>サービスに関するお知らせの送信</li>
                    </ul>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold mb-3 pb-2 border-b">3. 情報の第三者提供</h2>
                    <p className="text-muted-foreground leading-relaxed mb-3">
                      当サービスは、以下の場合を除き、ユーザーの個人情報を第三者に提供することはありません。
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-2">
                      <li>ユーザーの同意がある場合</li>
                      <li>法令に基づく場合</li>
                      <li>人の生命、身体または財産の保護のために必要な場合</li>
                      <li>サービスの提供に必要な範囲で業務委託先に提供する場合</li>
                    </ul>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold mb-3 pb-2 border-b">4. Cookieの使用</h2>
                    <p className="text-muted-foreground leading-relaxed">
                      当サービスは、サービスの提供およびユーザー体験の向上のためにCookieを使用しています。
                      Cookieは、ユーザーのブラウザ設定により無効にすることができますが、
                      一部の機能が利用できなくなる場合があります。
                    </p>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold mb-3 pb-2 border-b">5. セキュリティ</h2>
                    <p className="text-muted-foreground leading-relaxed">
                      当サービスは、個人情報の漏洩、滅失またはき損の防止のため、
                      適切なセキュリティ対策を講じています。
                      ただし、インターネット上の通信は完全に安全ではないことをご了承ください。
                    </p>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold mb-3 pb-2 border-b">6. 外部サービスとの連携</h2>
                    <p className="text-muted-foreground leading-relaxed">
                      当サービスは、Google、GitHubなどの外部サービスを利用したログイン機能を提供しています。
                      これらのサービスを利用する場合、各サービスのプライバシーポリシーも適用されます。
                    </p>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold mb-3 pb-2 border-b">7. 子どものプライバシー</h2>
                    <p className="text-muted-foreground leading-relaxed">
                      当サービスは、13歳未満の子どもから意図的に個人情報を収集することはありません。
                      13歳未満の方は、保護者の同意を得てからサービスをご利用ください。
                    </p>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold mb-3 pb-2 border-b">8. プライバシーポリシーの変更</h2>
                    <p className="text-muted-foreground leading-relaxed">
                      当サービスは、必要に応じて本ポリシーを変更することがあります。
                      重要な変更がある場合は、サービス上でお知らせします。
                    </p>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold mb-3 pb-2 border-b">9. お問い合わせ</h2>
                    <p className="text-muted-foreground leading-relaxed">
                      本ポリシーに関するお問い合わせは、サービス内のお問い合わせフォームからご連絡ください。
                    </p>
                  </section>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export const metadata = {
  title: "プライバシーポリシー | Quiz Platform",
  description: "Quiz Platformのプライバシーポリシー",
};
