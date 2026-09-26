"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { Package, LogOut, ExternalLink, ShieldCheck } from "lucide-react";

interface AdminNavbarProps {
  user?: {
    name: string;
    email: string;
    role: string;
  } | null;
}

export function AdminNavbar({ user }: AdminNavbarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/admin/login");
      router.refresh();
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <header className="bg-stone-900 text-white border-b border-stone-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/admin/products" className="flex items-center gap-2.5 group">
            <div className="relative w-9 h-9 rounded-lg bg-stone-800 p-1 flex items-center justify-center border border-stone-700 overflow-hidden">
              <Image
                src="/branding/wasana-logo.png"
                alt="Wasana Bakers Logo"
                fill
                sizes="36px"
                className="object-contain"
              />
            </div>
            <div>
              <span className="font-serif font-bold text-base tracking-tight text-white block leading-tight">
                Wasana Bakers
              </span>
              <span className="text-[11px] text-amber-400 font-medium block">
                Bakery Admin
              </span>
            </div>
          </Link>

          <nav className="hidden sm:flex items-center gap-2">
            <Link
              href="/admin/products"
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                pathname.startsWith("/admin/products")
                  ? "bg-amber-600 text-white"
                  : "text-stone-300 hover:bg-stone-800 hover:text-white"
              }`}
            >
              <Package className="w-4 h-4" />
              Manage Cakes
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/cakes"
            target="_blank"
            className="hidden md:inline-flex items-center gap-1 text-xs font-medium text-stone-400 hover:text-amber-300 transition-colors"
          >
            <span>View Public Website</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          {user && (
            <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-stone-800 text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <div>
                <span className="font-semibold text-stone-200 block leading-tight">
                  {user.name}
                </span>
                <span className="text-[10px] text-stone-400 block">
                  {user.role}
                </span>
              </div>
            </div>
          )}

          <button
            onClick={handleLogout}
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
}
