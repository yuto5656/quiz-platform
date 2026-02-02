import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const categories = [
  {
    name: "一般常識",
    slug: "general",
    description: "日常生活で役立つ一般的な知識",
    icon: "📚",
    order: 1,
  },
  {
    name: "科学",
    slug: "science",
    description: "物理、化学、生物などの科学全般",
    icon: "🔬",
    order: 2,
  },
  {
    name: "歴史",
    slug: "history",
    description: "日本史、世界史、歴史上の出来事",
    icon: "🏛️",
    order: 3,
  },
  {
    name: "地理",
    slug: "geography",
    description: "世界の国々、都市、地形",
    icon: "🌍",
    order: 4,
  },
  {
    name: "エンタメ",
    slug: "entertainment",
    description: "映画、音楽、テレビ、ゲーム",
    icon: "🎬",
    order: 5,
  },
  {
    name: "スポーツ",
    slug: "sports",
    description: "各種スポーツに関する知識",
    icon: "⚽",
    order: 6,
  },
  {
    name: "IT・テクノロジー",
    slug: "technology",
    description: "コンピュータ、プログラミング、最新技術",
    icon: "💻",
    order: 7,
  },
  {
    name: "ビジネス・経済",
    slug: "business",
    description: "経済、金融、ビジネス知識",
    icon: "💼",
    order: 8,
  },
  {
    name: "語学",
    slug: "language",
    description: "英語、日本語、その他言語",
    icon: "🗣️",
    order: 9,
  },
  {
    name: "資格試験",
    slug: "certification",
    description: "各種資格試験の対策問題",
    icon: "📝",
    order: 10,
  },
];

async function main() {
  console.log("Seeding categories...");

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: category,
      create: category,
    });
  }

  console.log(`Created ${categories.length} categories`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
