"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AdminAvatar } from "@/components/common/admin-avatar";
import { User, Settings, LogOut, PlusCircle, LayoutDashboard, Shield } from "lucide-react";

interface UserMenuProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export function UserMenu({ user }: UserMenuProps) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [customAvatar, setCustomAvatar] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUserData() {
      try {
        const [adminRes, userRes] = await Promise.all([
          fetch("/api/admin/check"),
          fetch("/api/users/me"),
        ]);

        if (adminRes.ok) {
          const data = await adminRes.json();
          setIsAdmin(data.isAdmin);
        }

        if (userRes.ok) {
          const data = await userRes.json();
          setCustomAvatar(data.user?.customAvatar || null);
        }
      } catch {
        // Ignore errors
      }
    }
    fetchUserData();
  }, []);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative h-8 w-8 rounded-full">
          <AdminAvatar
            isAdmin={isAdmin}
            customAvatar={customAvatar || undefined}
            image={user.image}
            name={user.name}
            size="sm"
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard">
            <LayoutDashboard className="mr-2 h-4 w-4" />
            マイページ
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/create">
            <PlusCircle className="mr-2 h-4 w-4" />
            クイズ作成
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/profile">
            <User className="mr-2 h-4 w-4" />
            プロフィール
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings className="mr-2 h-4 w-4" />
            設定
          </Link>
        </DropdownMenuItem>
        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/admin/contacts">
                <Shield className="mr-2 h-4 w-4" />
                管理画面
              </Link>
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-red-600 focus:text-red-600"
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          <LogOut className="mr-2 h-4 w-4" />
          ログアウト
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
