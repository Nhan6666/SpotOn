import type { Metadata } from "next";
import { Inter, Playfair_Display, Lexend } from "next/font/google";
import { AOSProvider } from "@/providers/AOSProvider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const lexend = Lexend({
  subsets: ["latin"],
  variable: "--font-lexend",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SpotOn — Find a table at your favorite branch",
  description:
    "Explore local dining, reserve your spot and curate your own dining experience. Discover restaurants, book tables, and find last-minute offers.",
  keywords: ["restaurant", "booking", "dining", "table reservation", "spoton"],
  openGraph: {
    title: "SpotOn — Find a table at your favorite branch",
    description: "Explore local dining and reserve your spot with SpotOn.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfair.variable} ${lexend.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col w-full">
        <AOSProvider>
          {children}
        </AOSProvider>
      </body>
    </html>
  );
}
