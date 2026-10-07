import { Suspense } from "react";
import { Navbar } from "@/components/public/Navbar";
import { Footer } from "@/components/public/Footer";
import { HELP_BUTTON } from "@/content/placeholders";
import { Phone } from "lucide-react";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-[#FAF9F5]">
      <Suspense fallback={null}>
        <Navbar />
      </Suspense>
      <main className="flex-1">{children}</main>
      <Footer />

      {/* Floating call button — desktop only */}
      {HELP_BUTTON.enabled && (
        <a
          href={`tel:${HELP_BUTTON.phone}`}
          aria-label={HELP_BUTTON.tooltip}
          title={HELP_BUTTON.tooltip}
          className="hidden sm:flex fixed bottom-6 right-5 z-40 items-center gap-2 bg-[#1B1C1A] text-white px-4 py-2.5 rounded-full shadow-lg hover:bg-[#F59E0B] hover:text-[#1B1C1A] transition-all duration-200 hover:-translate-y-0.5"
        >
          <Phone className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span className="text-[12px] font-bold whitespace-nowrap">
            {HELP_BUTTON.displayPhone}
          </span>
        </a>
      )}
    </div>
  );
}
