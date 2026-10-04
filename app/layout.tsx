import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/navbar";

export const metadata: Metadata = {
  title: "KXRestApi — Anime REST API",
  description:
    "KXRestApi provides a clean REST API for anime metadata. Anime data, served clean.",
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: "KXRestApi — Anime REST API",
    description: "Anime data, served clean. Simple anime REST API for developers.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-surface-border px-4 py-6 text-center text-sm text-ink-dim">
          <p>KXRestApi · Anime data, served clean.</p>
          <p className="mt-1">Data sourced from Samehadaku. Not affiliated.</p>
        </footer>
      </body>
    </html>
  );
}
