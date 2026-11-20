"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminHeader() {
  const router = useRouter();
  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" }).catch(() => null);
    router.replace("/admin/login");
    router.refresh();
  };
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/admin" className="font-bold text-primary">
          Kathputli Colony · Complaints
        </Link>
        <Button variant="ghost" size="sm" onClick={logout}>
          <LogOut className="h-4 w-4" aria-hidden /> Logout
        </Button>
      </div>
    </header>
  );
}
