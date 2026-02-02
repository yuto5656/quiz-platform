import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock, PlayCircle, Users } from "lucide-react";

interface QuizCardProps {
  quiz: {
    id: string;
    title: string;
    description: string | null;
    author: {
      id: string;
      name: string | null;
      image: string | null;
    };
    category: {
      id: string;
      name: string;
      slug: string;
    };
    questionCount: number;
    playCount: number;
    avgScore: number;
    timeLimit: number | null;
  };
  showAuthor?: boolean;
}

export function QuizCard({ quiz, showAuthor = true }: QuizCardProps) {
  const initials =
    quiz.author.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "?";

  return (
    <Link href={`/quiz/${quiz.id}`}>
      <Card className="h-full transition-colors hover:bg-muted/50">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <Badge variant="secondary" className="mb-2">
              {quiz.category.name}
            </Badge>
            {quiz.timeLimit && (
              <div className="flex items-center text-xs text-muted-foreground">
                <Clock className="mr-1 h-3 w-3" />
                {Math.floor(quiz.timeLimit / 60)}分
              </div>
            )}
          </div>
          <CardTitle className="line-clamp-2 text-lg">{quiz.title}</CardTitle>
          {quiz.description && (
            <CardDescription className="line-clamp-2">
              {quiz.description}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            {showAuthor && (
              <div className="flex items-center space-x-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={quiz.author.image || ""} />
                  <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                </Avatar>
                <span className="text-sm text-muted-foreground">
                  {quiz.author.name || "Unknown"}
                </span>
              </div>
            )}
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <div className="flex items-center">
                <PlayCircle className="mr-1 h-4 w-4" />
                {quiz.questionCount}問
              </div>
              <div className="flex items-center">
                <Users className="mr-1 h-4 w-4" />
                {quiz.playCount}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
