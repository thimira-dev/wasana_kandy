import Link from "next/link";
import Image from "next/image";
import { Shield } from "lucide-react";

export function Navbar() {
  return (
    <header className="bg-white border-b border-stone-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/cakes" className="flex items-center gap-3 group">
          <div className="relative w-11 h-11 shrink-0 overflow-hidden rounded-lg bg-amber-50 p-1 border border-amber-100/60 group-hover:scale-105 transition-transform">
            <Image
              src="/branding/wasana-logo.png"
              alt="Wasana Bakers Logo"
              fill
              sizes="44px"
              priority
              className="object-contain"
            />
          </div>
          <div>
            <span className="font-serif text-xl font-bold tracking-tight text-stone-900 block leading-tight">
              Wasana Bakers
            </span>
            <span className="text-xs text-amber-700 font-medium block">
              Kandy, Sri Lanka
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-6">
          <Link
            href="/cakes"
            className="text-sm font-medium text-stone-700 hover:text-amber-700 transition-colors"
          >
            Cake Catalogue
          </Link>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md bg-stone-100 text-stone-700 hover:bg-stone-200 transition-colors border border-stone-200"
          >
            <Shield className="w-3.5 h-3.5 text-stone-500" />
            Admin Portal
          </Link>
        </nav>
      </div>
    </header>
  );
}
