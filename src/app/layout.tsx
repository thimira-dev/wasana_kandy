import type { Metadata } from "next";
import { Playfair_Display, Plus_Jakarta_Sans, Dancing_Script } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const dancing = Dancing_Script({
  subsets: ["latin"],
  variable: "--font-dancing",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

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
    <html
      lang="en"
      className={`h-full ${playfair.variable} ${jakarta.variable} ${dancing.variable}`}
    >
      <body className="min-h-full flex flex-col bg-[#FAF7F2] text-[#3D2B24] antialiased font-jakarta">
        {children}
      </body>
    </html>
  );
}
