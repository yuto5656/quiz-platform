"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  MessageSquare,
  Loader2,
  Send,
  Trash2,
  Edit2,
  Reply,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";

interface User {
  id: string;
  name: string | null;
  image: string | null;
}

interface Comment {
  id: string;
  content: string;
  user: User;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  replies?: Comment[];
}

interface CommentSectionProps {
  quizId: string;
  quizAuthorId: string;
}

export function CommentSection({ quizId, quizAuthorId }: CommentSectionProps) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  useEffect(() => {
    fetchComments();
  }, [quizId]);

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/comments?quizId=${quizId}`);
      if (!res.ok) throw new Error("Failed to fetch comments");
      const data = await res.json();
      setComments(data.comments);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id) {
      toast.error("コメントするにはログインが必要です");
      return;
    }
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizId, content }),
      });

      if (!res.ok) throw new Error("Failed to post comment");

      setContent("");
      toast.success("コメントを投稿しました");
      fetchComments();
    } catch (error) {
      toast.error("コメントの投稿に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReply = async (parentId: string) => {
    if (!session?.user?.id) {
      toast.error("返信するにはログインが必要です");
      return;
    }
    if (!replyContent.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizId, content: replyContent, parentId }),
      });

      if (!res.ok) throw new Error("Failed to post reply");

      setReplyContent("");
      setReplyingTo(null);
      toast.success("返信を投稿しました");
      fetchComments();
    } catch (error) {
      toast.error("返信の投稿に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (commentId: string) => {
    if (!editContent.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent }),
      });

      if (!res.ok) throw new Error("Failed to update comment");

      setEditingId(null);
      setEditContent("");
      toast.success("コメントを更新しました");
      fetchComments();
    } catch (error) {
      toast.error("コメントの更新に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete comment");

      toast.success("コメントを削除しました");
      fetchComments();
    } catch (error) {
      toast.error("コメントの削除に失敗しました");
    }
  };

  const startEdit = (comment: Comment) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
    setReplyingTo(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditContent("");
  };

  const startReply = (commentId: string) => {
    setReplyingTo(commentId);
    setReplyContent("");
    setEditingId(null);
  };

  const cancelReply = () => {
    setReplyingTo(null);
    setReplyContent("");
  };

  const renderComment = (comment: Comment, isReply = false) => {
    const isAuthor = session?.user?.id === comment.user.id;
    const isQuizAuthor = session?.user?.id === quizAuthorId;
    const canDelete = isAuthor || isQuizAuthor;
    const canEdit = isAuthor;

    return (
      <div
        key={comment.id}
        className={`${isReply ? "ml-8 mt-3 border-l-2 pl-4" : ""}`}
      >
        <div className="flex gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={comment.user.image || undefined} />
            <AvatarFallback>
              {comment.user.name?.[0] || "?"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">
                {comment.user.name || "匿名ユーザー"}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(comment.createdAt), {
                  addSuffix: true,
                  locale: ja,
                })}
              </span>
              {comment.createdAt !== comment.updatedAt && (
                <span className="text-xs text-muted-foreground">(編集済み)</span>
              )}
            </div>

            {editingId === comment.id ? (
              <div className="mt-2 space-y-2">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleEdit(comment.id)}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "保存"
                    )}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={cancelEdit}>
                    キャンセル
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm mt-1 whitespace-pre-wrap">{comment.content}</p>
                <div className="flex items-center gap-2 mt-2">
                  {!isReply && session?.user && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => startReply(comment.id)}
                    >
                      <Reply className="h-3 w-3 mr-1" />
                      返信
                    </Button>
                  )}
                  {canEdit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => startEdit(comment)}
                    >
                      <Edit2 className="h-3 w-3 mr-1" />
                      編集
                    </Button>
                  )}
                  {canDelete && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          削除
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>コメントを削除</AlertDialogTitle>
                          <AlertDialogDescription>
                            このコメントを削除してもよろしいですか？この操作は取り消せません。
                            {comment.replies && comment.replies.length > 0 && (
                              <span className="block mt-2 text-red-500">
                                このコメントへの返信もすべて削除されます。
                              </span>
                            )}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>キャンセル</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(comment.id)}
                            className="bg-red-500 hover:bg-red-600"
                          >
                            削除
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </>
            )}

            {/* Reply form */}
            {replyingTo === comment.id && (
              <div className="mt-3 space-y-2">
                <Textarea
                  placeholder="返信を入力..."
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  rows={2}
                  className="resize-none"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleReply(comment.id)}
                    disabled={isSubmitting || !replyContent.trim()}
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="h-3 w-3 mr-1" />
                        返信
                      </>
                    )}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={cancelReply}>
                    <X className="h-3 w-3 mr-1" />
                    キャンセル
                  </Button>
                </div>
              </div>
            )}

            {/* Replies */}
            {comment.replies && comment.replies.length > 0 && (
              <div className="mt-3 space-y-3">
                {comment.replies.map((reply) => renderComment(reply, true))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          コメント ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Comment form */}
        {session?.user ? (
          <form onSubmit={handleSubmit} className="mb-6">
            <div className="flex gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={session.user.image || undefined} />
                <AvatarFallback>
                  {session.user.name?.[0] || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <Textarea
                  placeholder="コメントを入力..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={isSubmitting || !content.trim()}
                    size="sm"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-1" />
                        投稿
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        ) : (
          <p className="text-sm text-muted-foreground mb-6">
            コメントするにはログインしてください
          </p>
        )}

        {/* Comments list */}
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : comments.length > 0 ? (
          <div className="space-y-6">
            {comments.map((comment) => renderComment(comment))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">
            まだコメントはありません
          </p>
        )}
      </CardContent>
    </Card>
  );
}
