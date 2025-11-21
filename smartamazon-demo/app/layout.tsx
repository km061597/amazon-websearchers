import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";

export const metadata: Metadata = {
  title: "SmartAmazon - Intelligent Deal Discovery & Price Comparison",
  description: "AI-powered product search with comprehensive deal ranking, price history tracking, bulk savings calculation, and side-by-side comparison",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-50">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
