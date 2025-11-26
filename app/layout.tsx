import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Firebolt Late Materialization Demo",
  description: "Interactive demo of Firebolt's automatic query optimization delivering 30x faster top-K queries",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-50">
        {children}
      </body>
    </html>
  );
}

