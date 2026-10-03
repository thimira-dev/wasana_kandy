"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Cake, User } from "lucide-react";

const TABS = [
  { label: "Home",    href: "/",      icon: Home },
  { label: "Cakes",   href: "/cakes", icon: Cake },
  { label: "Profile", href: "/admin", icon: User },
];

export function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="sm:hidden fixed bottom-0 inset-x-0 z-50 bg-white border-t border-[#E8E0D8] shadow-[0_-2px_12px_0_rgb(61_43_36_/_0.08)]"
      aria-label="Mobile navigation"
    >
      <div className="flex items-stretch">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active =
            tab.href === "/"
              ? pathname === "/"
              : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.label}
              href={tab.href}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 text-[10px] font-semibold transition-colors ${
                active ? "text-[#C88A58]" : "text-[#8A7568] hover:text-[#3D2B24]"
              }`}
              aria-current={active ? "page" : undefined}
            >
              <Icon
                className={`w-5 h-5 ${active ? "text-[#C88A58]" : "text-[#BDB0A7]"}`}
                aria-hidden="true"
              />
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
