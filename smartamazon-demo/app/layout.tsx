import type { Metadata } from "next";
import "./globals.css";

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
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
