import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wasana Bakers | Handcrafted Cakes in Kandy, Sri Lanka",
  description:
    "Order custom celebration cakes online from Wasana Bakers, Kandy, Sri Lanka. Choose your cake, customize flavors and colors, and celebrate with sweetness.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-stone-50 text-stone-900 antialiased">
        {children}
      </body>
    </html>
  );
}
