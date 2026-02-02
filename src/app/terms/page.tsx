import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
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
                <h1 className="text-3xl font-bold mb-2">利用規約</h1>
                <p className="text-sm text-muted-foreground mb-8">最終更新日: 2024年1月1日</p>

                <div className="space-y-8">
                  <section>
                    <h2 className="text-xl font-semibold mb-3 pb-2 border-b">第1条（適用）</h2>
                    <p className="text-muted-foreground leading-relaxed">
                      本利用規約（以下「本規約」といいます）は、Quiz Platform（以下「当サービス」といいます）の利用条件を定めるものです。
                      ユーザーの皆様には、本規約に従って当サービスをご利用いただきます。
                    </p>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold mb-3 pb-2 border-b">第2条（利用登録）</h2>
                    <p className="text-muted-foreground leading-relaxed">
                      当サービスの利用を希望する方は、本規約に同意の上、所定の方法によって利用登録を行うものとします。
                      利用登録は、当サービスが登録申請を承認した時点で完了するものとします。
                    </p>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold mb-3 pb-2 border-b">第3条（ユーザーIDおよびパスワードの管理）</h2>
                    <p className="text-muted-foreground leading-relaxed">
                      ユーザーは、自己の責任において、当サービスのユーザーIDおよびパスワードを管理するものとします。
                      ユーザーは、いかなる場合にも、ユーザーIDおよびパスワードを第三者に譲渡または貸与することはできません。
                    </p>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold mb-3 pb-2 border-b">第4条（禁止事項）</h2>
                    <p className="text-muted-foreground leading-relaxed mb-3">
                      ユーザーは、当サービスの利用にあたり、以下の行為をしてはなりません。
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-2">
                      <li>法令または公序良俗に違反する行為</li>
                      <li>犯罪行為に関連する行為</li>
                      <li>当サービスのサーバーまたはネットワークの機能を破壊したり、妨害したりする行為</li>
                      <li>当サービスの運営を妨害するおそれのある行為</li>
                      <li>他のユーザーに関する個人情報等を収集または蓄積する行為</li>
                      <li>他のユーザーに成りすます行為</li>
                      <li>当サービスに関連して、反社会的勢力に対して直接または間接に利益を供与する行為</li>
                      <li>その他、当サービスが不適切と判断する行為</li>
                    </ul>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold mb-3 pb-2 border-b">第5条（コンテンツの権利）</h2>
                    <p className="text-muted-foreground leading-relaxed">
                      ユーザーが当サービス上で作成したクイズ等のコンテンツに関する著作権は、当該ユーザーに帰属します。
                      ただし、ユーザーは、当サービスに対し、当該コンテンツを当サービスの提供および改善のために利用する権利を許諾するものとします。
                    </p>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold mb-3 pb-2 border-b">第6条（利用制限および登録抹消）</h2>
                    <p className="text-muted-foreground leading-relaxed mb-3">
                      当サービスは、以下の場合には、事前の通知なく、ユーザーに対して、当サービスの全部もしくは一部の利用を制限し、
                      またはユーザーとしての登録を抹消することができるものとします。
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-2">
                      <li>本規約のいずれかの条項に違反した場合</li>
                      <li>登録事項に虚偽の事実があることが判明した場合</li>
                      <li>その他、当サービスが利用を適当でないと判断した場合</li>
                    </ul>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold mb-3 pb-2 border-b">第7条（免責事項）</h2>
                    <p className="text-muted-foreground leading-relaxed">
                      当サービスは、当サービスに事実上または法律上の瑕疵がないことを明示的にも黙示的にも保証しておりません。
                      当サービスは、当サービスに起因してユーザーに生じたあらゆる損害について一切の責任を負いません。
                    </p>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold mb-3 pb-2 border-b">第8条（サービス内容の変更等）</h2>
                    <p className="text-muted-foreground leading-relaxed">
                      当サービスは、ユーザーに通知することなく、当サービスの内容を変更しまたは当サービスの提供を中止することができるものとし、
                      これによってユーザーに生じた損害について一切の責任を負いません。
                    </p>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold mb-3 pb-2 border-b">第9条（利用規約の変更）</h2>
                    <p className="text-muted-foreground leading-relaxed">
                      当サービスは、必要と判断した場合には、ユーザーに通知することなくいつでも本規約を変更することができるものとします。
                    </p>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold mb-3 pb-2 border-b">第10条（準拠法・裁判管轄）</h2>
                    <p className="text-muted-foreground leading-relaxed">
                      本規約の解釈にあたっては、日本法を準拠法とします。
                      当サービスに関して紛争が生じた場合には、当サービスの本店所在地を管轄する裁判所を専属的合意管轄とします。
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
  title: "利用規約 | Quiz Platform",
  description: "Quiz Platformの利用規約",
};
