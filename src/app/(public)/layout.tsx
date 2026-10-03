import { Navbar } from "@/components/public/Navbar";
import { Footer } from "@/components/public/Footer";
import { MobileTabBar } from "@/components/public/MobileTabBar";
import { HELP_BUTTON } from "@/content/placeholders";
import { Phone } from "lucide-react";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-[#FAF7F2]">
      <Navbar />
      {/* pb-16 on mobile so content clears the fixed bottom tab bar */}
      <main className="flex-1 pb-16 sm:pb-0">{children}</main>
      <Footer />
      <MobileTabBar />

      {/* Floating call button — desktop only */}
      {HELP_BUTTON.enabled && (
        <a
          href={`tel:${HELP_BUTTON.phone}`}
          aria-label={HELP_BUTTON.tooltip}
          title={HELP_BUTTON.tooltip}
          className="hidden sm:flex fixed bottom-6 right-5 z-50 items-center gap-2 bg-[#3D2B24] text-white px-4 py-2.5 rounded-full shadow-[0_4px_20px_0_rgb(61_43_36_/_0.30)] hover:bg-[#C88A58] transition-all duration-200 hover:-translate-y-0.5"
        >
          <Phone className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span className="text-[12px] font-semibold whitespace-nowrap">
            {HELP_BUTTON.displayPhone}
          </span>
        </a>
      )}
    </div>
  );
}
