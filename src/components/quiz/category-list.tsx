import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  quizCount: number;
}

interface CategoryListProps {
  categories: Category[];
}

export function CategoryList({ categories }: CategoryListProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {categories.map((category) => (
        <Link key={category.id} href={`/quiz/category/${category.slug}`}>
          <Card className="h-full transition-colors hover:bg-muted/50">
            <CardContent className="flex flex-col items-center justify-center p-4 text-center">
              <span className="text-2xl mb-2">{category.icon || "📁"}</span>
              <span className="font-medium text-sm">{category.name}</span>
              <span className="text-xs text-muted-foreground">
                {category.quizCount}クイズ
              </span>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
