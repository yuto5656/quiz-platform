"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, Mail, Trash2, Eye, ChevronLeft, ChevronRight } from "lucide-react";

interface Contact {
  id: string;
  name: string;
  email: string;
  content: string;
  status: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  } | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const statusLabels: Record<string, string> = {
  unread: "未読",
  read: "既読",
  replied: "返信済み",
  closed: "対応完了",
};

const statusColors: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  unread: "destructive",
  read: "secondary",
  replied: "outline",
  closed: "default",
};

export default function AdminContactsPage() {
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.push("/login?callbackUrl=/admin/contacts");
    }
  }, [authStatus, router]);

  useEffect(() => {
    async function fetchContacts() {
      setIsLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (filterStatus !== "all") {
          params.set("status", filterStatus);
        }
        params.set("page", pagination?.page?.toString() || "1");

        const res = await fetch(`/api/admin/contacts?${params}`);
        if (res.status === 403) {
          setError("管理者権限がありません");
          return;
        }
        if (!res.ok) {
          throw new Error("Failed to fetch contacts");
        }
        const data = await res.json();
        setContacts(data.contacts);
        setPagination(data.pagination);
      } catch {
        setError("データの取得に失敗しました");
      } finally {
        setIsLoading(false);
      }
    }

    if (authStatus === "authenticated") {
      fetchContacts();
    }
  }, [authStatus, filterStatus, pagination?.page]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/contacts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setContacts((prev) =>
          prev.map((c) => (c.id === id ? { ...c, status: newStatus } : c))
        );
        if (selectedContact?.id === id) {
          setSelectedContact({ ...selectedContact, status: newStatus });
        }
      }
    } catch {
      console.error("Failed to update status");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("このお問い合わせを削除しますか？")) return;

    try {
      const res = await fetch(`/api/admin/contacts/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setContacts((prev) => prev.filter((c) => c.id !== id));
        setSelectedContact(null);
      }
    } catch {
      console.error("Failed to delete contact");
    }
  };

  const handleViewContact = async (contact: Contact) => {
    setSelectedContact(contact);
    if (contact.status === "unread") {
      await handleStatusChange(contact.id, "read");
    }
  };

  if (authStatus === "loading" || isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-red-500">エラー</CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-muted/30">
        <div className="container py-8">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    お問い合わせ管理
                  </CardTitle>
                  <CardDescription>
                    ユーザーからのお問い合わせを確認・管理します
                  </CardDescription>
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべて</SelectItem>
                    <SelectItem value="unread">未読</SelectItem>
                    <SelectItem value="read">既読</SelectItem>
                    <SelectItem value="replied">返信済み</SelectItem>
                    <SelectItem value="closed">対応完了</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {contacts.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  お問い合わせはありません
                </p>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ステータス</TableHead>
                        <TableHead>名前</TableHead>
                        <TableHead>メール</TableHead>
                        <TableHead>日時</TableHead>
                        <TableHead className="text-right">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contacts.map((contact) => (
                        <TableRow key={contact.id}>
                          <TableCell>
                            <Badge variant={statusColors[contact.status]}>
                              {statusLabels[contact.status]}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">
                            {contact.name}
                          </TableCell>
                          <TableCell>{contact.email}</TableCell>
                          <TableCell>
                            {new Date(contact.createdAt).toLocaleString("ja-JP")}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleViewContact(contact)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(contact.id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {pagination && pagination.totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="icon"
                        disabled={pagination.page === 1}
                        onClick={() =>
                          setPagination((p) =>
                            p ? { ...p, page: p.page - 1 } : null
                          )
                        }
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-sm">
                        {pagination.page} / {pagination.totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        disabled={pagination.page === pagination.totalPages}
                        onClick={() =>
                          setPagination((p) =>
                            p ? { ...p, page: p.page + 1 } : null
                          )
                        }
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />

      {/* Detail Dialog */}
      <Dialog
        open={!!selectedContact}
        onOpenChange={(open) => !open && setSelectedContact(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>お問い合わせ詳細</DialogTitle>
            <DialogDescription>
              {selectedContact?.createdAt &&
                new Date(selectedContact.createdAt).toLocaleString("ja-JP")}
            </DialogDescription>
          </DialogHeader>
          {selectedContact && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">名前</p>
                  <p className="font-medium">{selectedContact.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">メールアドレス</p>
                  <p className="font-medium">{selectedContact.email}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">お問い合わせ内容</p>
                <div className="p-4 bg-muted rounded-lg whitespace-pre-wrap">
                  {selectedContact.content}
                </div>
              </div>
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">ステータス:</span>
                  <Select
                    value={selectedContact.status}
                    onValueChange={(value) =>
                      handleStatusChange(selectedContact.id, value)
                    }
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unread">未読</SelectItem>
                      <SelectItem value="read">既読</SelectItem>
                      <SelectItem value="replied">返信済み</SelectItem>
                      <SelectItem value="closed">対応完了</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  variant="outline"
                  onClick={() =>
                    window.open(`mailto:${selectedContact.email}`, "_blank")
                  }
                >
                  <Mail className="mr-2 h-4 w-4" />
                  メールで返信
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
