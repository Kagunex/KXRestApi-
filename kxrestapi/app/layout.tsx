import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "KXRestApi — Anime REST API",
  description: "Anime data, served clean. Simple anime REST API for developers.",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-surface-border px-4 py-6 text-center text-sm text-ink-dim">
          <p>
            KXRestApi · Anime data, served clean.
          </p>
          <p className="mt-1">
            Data sourced from Samehadaku. Not affiliated.
          </p>
        </footer>
      </body>
    </html>
  );
}
