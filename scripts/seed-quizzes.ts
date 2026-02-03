import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// クイズデータ
const quizzes = [
  // IT・プログラミングクイズ
  {
    title: "プログラミング基礎知識テスト",
    description: "プログラミングの基本的な概念や用語についてのクイズです。初心者から中級者向け。",
    categorySlug: "technology",
    questions: [
      {
        text: "変数の値を変更できないようにする宣言キーワードはどれ？(JavaScript)",
        options: ["const", "let", "var", "static"],
        correctIndex: 0,
        explanation: "constは定数を宣言するキーワードで、一度値を代入すると変更できません。",
      },
      {
        text: "HTMLは何の略称？",
        options: ["HyperText Markup Language", "High Tech Modern Language", "Home Tool Markup Language", "Hyperlink Text Management Language"],
        correctIndex: 0,
        explanation: "HTMLはHyperText Markup Languageの略で、Webページの構造を定義するマークアップ言語です。",
      },
      {
        text: "CSSで要素を横並びにするプロパティはどれ？",
        options: ["display: flex", "position: relative", "margin: auto", "text-align: center"],
        correctIndex: 0,
        explanation: "display: flexを使うとFlexboxが有効になり、子要素を簡単に横並びにできます。",
      },
      {
        text: "Gitで変更をリモートリポジトリに送信するコマンドは？",
        options: ["git push", "git pull", "git commit", "git fetch"],
        correctIndex: 0,
        explanation: "git pushはローカルの変更をリモートリポジトリにアップロードするコマンドです。",
      },
      {
        text: "APIとは何の略称？",
        options: ["Application Programming Interface", "Advanced Program Integration", "Automated Process Input", "Application Process Identifier"],
        correctIndex: 0,
        explanation: "APIはApplication Programming Interfaceの略で、ソフトウェア同士が通信するためのインターフェースです。",
      },
      {
        text: "次のうち、サーバーサイドで動作するプログラミング言語は？",
        options: ["Python", "HTML", "CSS", "Markdown"],
        correctIndex: 0,
        explanation: "PythonはサーバーサイドでWebアプリケーションやAPIの開発に使われます。",
      },
      {
        text: "SQLでデータを取得するコマンドは？",
        options: ["SELECT", "INSERT", "UPDATE", "DELETE"],
        correctIndex: 0,
        explanation: "SELECTはデータベースからデータを取得（読み取り）するためのSQLコマンドです。",
      },
      {
        text: "JSONの正式名称は？",
        options: ["JavaScript Object Notation", "Java Standard Object Name", "JavaScript Online Network", "Java Serialized Object Node"],
        correctIndex: 0,
        explanation: "JSONはJavaScript Object Notationの略で、軽量なデータ交換フォーマットです。",
      },
      {
        text: "Reactは何を作るためのライブラリ？",
        options: ["ユーザーインターフェース", "データベース", "サーバー", "オペレーティングシステム"],
        correctIndex: 0,
        explanation: "ReactはMeta社が開発したユーザーインターフェース構築のためのJavaScriptライブラリです。",
      },
      {
        text: "HTTPステータスコード404は何を意味する？",
        options: ["Not Found（リソースが見つからない）", "Server Error（サーバーエラー）", "OK（成功）", "Unauthorized（認証エラー）"],
        correctIndex: 0,
        explanation: "404 Not Foundは、リクエストしたリソースがサーバー上に存在しないことを示します。",
      },
      {
        text: "TypeScriptはJavaScriptに何を追加したもの？",
        options: ["静的型付け", "動的型付け", "マルチスレッド", "ガベージコレクション"],
        correctIndex: 0,
        explanation: "TypeScriptはJavaScriptに静的型付けを追加し、開発時のエラー検出を容易にします。",
      },
      {
        text: "npmは何の略称？",
        options: ["Node Package Manager", "New Programming Module", "Network Protocol Manager", "Node Process Monitor"],
        correctIndex: 0,
        explanation: "npmはNode Package Managerの略で、Node.jsのパッケージ管理ツールです。",
      },
      {
        text: "RESTfulAPIで新規リソースを作成する際に使用するHTTPメソッドは？",
        options: ["POST", "GET", "PUT", "DELETE"],
        correctIndex: 0,
        explanation: "POSTメソッドは新しいリソースを作成する際に使用されます。",
      },
      {
        text: "データベースでユニークな行を特定するためのカラムを何という？",
        options: ["主キー（Primary Key）", "外部キー（Foreign Key）", "インデックス", "シーケンス"],
        correctIndex: 0,
        explanation: "主キーはテーブル内の各行を一意に識別するためのカラムです。",
      },
      {
        text: "次のうち、バージョン管理システムはどれ？",
        options: ["Git", "Docker", "Kubernetes", "Jenkins"],
        correctIndex: 0,
        explanation: "Gitは分散型バージョン管理システムで、ソースコードの変更履歴を管理します。",
      },
    ],
  },
  // 一般常識クイズ
  {
    title: "日本の一般常識クイズ",
    description: "日本の文化、社会、日常に関する一般常識を試すクイズです。",
    categorySlug: "general",
    questions: [
      {
        text: "日本の国花として親しまれている花は？",
        options: ["桜", "菊", "梅", "藤"],
        correctIndex: 0,
        explanation: "日本では桜が国花として広く親しまれています。春の象徴でもあります。",
      },
      {
        text: "日本の首都はどこ？",
        options: ["東京", "京都", "大阪", "奈良"],
        correctIndex: 0,
        explanation: "東京は日本の首都であり、政治・経済の中心地です。",
      },
      {
        text: "日本の国歌の名前は？",
        options: ["君が代", "日本国歌", "大和の歌", "桜の歌"],
        correctIndex: 0,
        explanation: "「君が代」は日本の国歌で、世界で最も短い国歌の一つです。",
      },
      {
        text: "一年の最後の日を何という？",
        options: ["大晦日", "元日", "小正月", "節分"],
        correctIndex: 0,
        explanation: "12月31日を大晦日（おおみそか）と呼びます。",
      },
      {
        text: "成人の日は何月にある祝日？",
        options: ["1月", "3月", "5月", "7月"],
        correctIndex: 0,
        explanation: "成人の日は1月の第2月曜日に設定されている国民の祝日です。",
      },
      {
        text: "日本で一番高い山は？",
        options: ["富士山", "北岳", "奥穂高岳", "槍ヶ岳"],
        correctIndex: 0,
        explanation: "富士山は標高3,776mで、日本で最も高い山です。",
      },
      {
        text: "日本の通貨単位は？",
        options: ["円", "ドル", "ユーロ", "ポンド"],
        correctIndex: 0,
        explanation: "日本の通貨単位は「円（JPY）」です。",
      },
      {
        text: "日本の都道府県の数は？",
        options: ["47", "43", "50", "45"],
        correctIndex: 0,
        explanation: "日本には47の都道府県があります（1都1道2府43県）。",
      },
      {
        text: "お正月に食べる伝統的な料理は？",
        options: ["おせち料理", "ひな祭り料理", "七夕料理", "お盆料理"],
        correctIndex: 0,
        explanation: "おせち料理は新年を祝うために食べる伝統的な料理です。",
      },
      {
        text: "「敬老の日」は何を目的とした祝日？",
        options: ["高齢者を敬い長寿を祝う", "子供の成長を祝う", "春の訪れを祝う", "収穫に感謝する"],
        correctIndex: 0,
        explanation: "敬老の日は、多年にわたり社会に尽くしてきた老人を敬愛し、長寿を祝う日です。",
      },
      {
        text: "日本で最も長い川は？",
        options: ["信濃川", "利根川", "石狩川", "天塩川"],
        correctIndex: 0,
        explanation: "信濃川は全長367kmで、日本で最も長い川です。",
      },
      {
        text: "日本の元号「令和」は西暦何年から？",
        options: ["2019年", "2018年", "2020年", "2017年"],
        correctIndex: 0,
        explanation: "令和は2019年5月1日から始まった元号です。",
      },
      {
        text: "衆議院議員の任期は何年？",
        options: ["4年", "3年", "5年", "6年"],
        correctIndex: 0,
        explanation: "衆議院議員の任期は4年です（解散がなければ）。",
      },
      {
        text: "日本の国鳥は？",
        options: ["キジ", "ツル", "トキ", "ウグイス"],
        correctIndex: 0,
        explanation: "キジ（雉）が日本の国鳥として指定されています。",
      },
      {
        text: "日本国憲法が施行された年は？",
        options: ["1947年", "1945年", "1946年", "1950年"],
        correctIndex: 0,
        explanation: "日本国憲法は1947年5月3日に施行されました。",
      },
    ],
  },
  // 歴史クイズ
  {
    title: "世界史入門クイズ",
    description: "世界の重要な歴史的出来事についてのクイズです。",
    categorySlug: "history",
    questions: [
      {
        text: "第二次世界大戦が終結した年は？",
        options: ["1945年", "1944年", "1946年", "1943年"],
        correctIndex: 0,
        explanation: "第二次世界大戦は1945年に終結しました。",
      },
      {
        text: "アメリカの独立宣言が採択された年は？",
        options: ["1776年", "1789年", "1765年", "1783年"],
        correctIndex: 0,
        explanation: "アメリカ独立宣言は1776年7月4日に採択されました。",
      },
      {
        text: "フランス革命が始まった年は？",
        options: ["1789年", "1776年", "1799年", "1804年"],
        correctIndex: 0,
        explanation: "フランス革命は1789年7月14日のバスティーユ牢獄襲撃から始まりました。",
      },
      {
        text: "コロンブスがアメリカ大陸に到達した年は？",
        options: ["1492年", "1498年", "1500年", "1488年"],
        correctIndex: 0,
        explanation: "クリストファー・コロンブスは1492年にアメリカ大陸に到達しました。",
      },
      {
        text: "ベルリンの壁が崩壊した年は？",
        options: ["1989年", "1991年", "1987年", "1990年"],
        correctIndex: 0,
        explanation: "ベルリンの壁は1989年11月9日に崩壊しました。",
      },
      {
        text: "古代エジプトの王を何と呼ぶ？",
        options: ["ファラオ", "皇帝", "王", "シャー"],
        correctIndex: 0,
        explanation: "古代エジプトの王はファラオと呼ばれました。",
      },
      {
        text: "ローマ帝国が東西に分裂した年は？",
        options: ["395年", "476年", "330年", "410年"],
        correctIndex: 0,
        explanation: "ローマ帝国は395年に東西に分裂しました。",
      },
      {
        text: "ルネサンスが始まった地域は？",
        options: ["イタリア", "フランス", "イギリス", "ドイツ"],
        correctIndex: 0,
        explanation: "ルネサンスは14世紀のイタリアで始まりました。",
      },
      {
        text: "第一次世界大戦の引き金となった事件は？",
        options: ["サラエボ事件", "真珠湾攻撃", "ボストン茶会事件", "ウォーターゲート事件"],
        correctIndex: 0,
        explanation: "1914年のサラエボ事件（オーストリア皇太子暗殺）が第一次世界大戦の引き金となりました。",
      },
      {
        text: "中国を初めて統一した皇帝は？",
        options: ["秦の始皇帝", "漢の高祖", "唐の太宗", "明の太祖"],
        correctIndex: 0,
        explanation: "秦の始皇帝（嬴政）が紀元前221年に中国を初めて統一しました。",
      },
      {
        text: "産業革命が最初に起こった国は？",
        options: ["イギリス", "フランス", "アメリカ", "ドイツ"],
        correctIndex: 0,
        explanation: "産業革命は18世紀後半のイギリスで最初に起こりました。",
      },
      {
        text: "マグナ・カルタ（大憲章）が制定された年は？",
        options: ["1215年", "1066年", "1295年", "1100年"],
        correctIndex: 0,
        explanation: "マグナ・カルタは1215年にイギリスで制定されました。",
      },
      {
        text: "明治維新があった年は？",
        options: ["1868年", "1853年", "1871年", "1860年"],
        correctIndex: 0,
        explanation: "明治維新は1868年に起こりました。",
      },
      {
        text: "ナポレオン・ボナパルトがフランス皇帝になった年は？",
        options: ["1804年", "1799年", "1789年", "1812年"],
        correctIndex: 0,
        explanation: "ナポレオンは1804年にフランス皇帝に即位しました。",
      },
      {
        text: "宗教改革を始めたマルティン・ルターが95か条の論題を発表した年は？",
        options: ["1517年", "1520年", "1500年", "1530年"],
        correctIndex: 0,
        explanation: "マルティン・ルターは1517年に95か条の論題を発表しました。",
      },
    ],
  },
  // 科学クイズ
  {
    title: "科学の基礎知識クイズ",
    description: "物理、化学、生物など科学全般の基礎知識を問うクイズです。",
    categorySlug: "science",
    questions: [
      {
        text: "水の化学式は？",
        options: ["H2O", "CO2", "NaCl", "O2"],
        correctIndex: 0,
        explanation: "水は水素2原子と酸素1原子からなり、化学式はH2Oです。",
      },
      {
        text: "光の速度は秒速約何km？",
        options: ["30万km", "3万km", "300万km", "3千km"],
        correctIndex: 0,
        explanation: "光の速度は秒速約30万km（正確には299,792km/s）です。",
      },
      {
        text: "DNAの正式名称は？",
        options: ["デオキシリボ核酸", "リボ核酸", "アミノ酸", "タンパク質"],
        correctIndex: 0,
        explanation: "DNAはデオキシリボ核酸（Deoxyribonucleic Acid）の略です。",
      },
      {
        text: "地球の衛星は？",
        options: ["月", "太陽", "火星", "金星"],
        correctIndex: 0,
        explanation: "月は地球唯一の自然衛星です。",
      },
      {
        text: "元素記号「Fe」は何の元素？",
        options: ["鉄", "金", "銀", "銅"],
        correctIndex: 0,
        explanation: "Feは鉄（Iron）の元素記号です。ラテン語のFerrumに由来します。",
      },
      {
        text: "人体で最も大きい臓器は？",
        options: ["肝臓", "心臓", "肺", "腎臓"],
        correctIndex: 0,
        explanation: "肝臓は人体最大の臓器で、体重の約2%を占めます。",
      },
      {
        text: "太陽系で最も大きい惑星は？",
        options: ["木星", "土星", "海王星", "天王星"],
        correctIndex: 0,
        explanation: "木星は太陽系最大の惑星で、地球の約11倍の直径があります。",
      },
      {
        text: "音速は気温20℃の空気中で秒速約何m？",
        options: ["343m", "300m", "400m", "500m"],
        correctIndex: 0,
        explanation: "気温20℃の空気中での音速は約343m/sです。",
      },
      {
        text: "植物が光合成で放出する気体は？",
        options: ["酸素", "二酸化炭素", "窒素", "水素"],
        correctIndex: 0,
        explanation: "植物は光合成により二酸化炭素を取り込み、酸素を放出します。",
      },
      {
        text: "人体の骨の数は成人で約何本？",
        options: ["206本", "186本", "226本", "300本"],
        correctIndex: 0,
        explanation: "成人の人体には約206本の骨があります。",
      },
      {
        text: "絶対零度は摂氏何度？",
        options: ["-273.15℃", "-100℃", "-459.67℃", "0℃"],
        correctIndex: 0,
        explanation: "絶対零度は-273.15℃（0ケルビン）で、理論上の最低温度です。",
      },
      {
        text: "周期表で原子番号1の元素は？",
        options: ["水素", "ヘリウム", "炭素", "窒素"],
        correctIndex: 0,
        explanation: "水素（H）は原子番号1で、最も軽い元素です。",
      },
      {
        text: "地球の大気の約78%を占める気体は？",
        options: ["窒素", "酸素", "二酸化炭素", "アルゴン"],
        correctIndex: 0,
        explanation: "地球の大気は約78%が窒素、約21%が酸素で構成されています。",
      },
      {
        text: "ニュートンが発見した有名な法則は？",
        options: ["万有引力の法則", "相対性理論", "量子力学", "熱力学第二法則"],
        correctIndex: 0,
        explanation: "アイザック・ニュートンは万有引力の法則を発見しました。",
      },
      {
        text: "赤血球の主な機能は？",
        options: ["酸素の運搬", "免疫機能", "血液凝固", "栄養素の運搬"],
        correctIndex: 0,
        explanation: "赤血球はヘモグロビンを含み、全身に酸素を運搬する役割があります。",
      },
    ],
  },
];

async function main() {
  console.log("Starting quiz seeding...");

  // 管理者ユーザーを取得または作成
  const adminEmail = process.env.ADMIN_EMAILS?.split(",")[0]?.trim();
  if (!adminEmail) {
    console.error("ADMIN_EMAILS not set in environment");
    process.exit(1);
  }

  let adminUser = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!adminUser) {
    console.log("Creating admin user...");
    adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        name: "Admin",
      },
    });
  }

  console.log(`Using admin user: ${adminUser.email}`);

  for (const quizData of quizzes) {
    console.log(`Creating quiz: ${quizData.title}`);

    // カテゴリを取得
    const category = await prisma.category.findUnique({
      where: { slug: quizData.categorySlug },
    });

    if (!category) {
      console.error(`Category not found: ${quizData.categorySlug}`);
      continue;
    }

    // 既存のクイズをチェック
    const existingQuiz = await prisma.quiz.findFirst({
      where: {
        title: quizData.title,
        authorId: adminUser.id,
      },
    });

    if (existingQuiz) {
      console.log(`Quiz already exists: ${quizData.title}, skipping...`);
      continue;
    }

    // クイズを作成
    const quiz = await prisma.quiz.create({
      data: {
        title: quizData.title,
        description: quizData.description,
        authorId: adminUser.id,
        categoryId: category.id,
        isPublic: true,
        questions: {
          create: quizData.questions.map((q, index) => ({
            content: q.text,
            options: q.options,
            correctIndices: [q.correctIndex],
            isMultipleChoice: false,
            explanation: q.explanation,
            order: index + 1,
          })),
        },
      },
    });

    // ユーザーのquizzesCreatedを更新
    await prisma.user.update({
      where: { id: adminUser.id },
      data: {
        quizzesCreated: {
          increment: 1,
        },
      },
    });

    console.log(`Created quiz: ${quiz.title} with ${quizData.questions.length} questions`);
  }

  console.log("Quiz seeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
