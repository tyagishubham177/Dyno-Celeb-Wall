import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dyno Wall of Fame",
  description:
    "Vote celebs head-to-head, watch Elo rankings reshape a living 3D gallery.",
  metadataBase:
    process.env.NEXT_PUBLIC_SITE_URL
      ? new URL(process.env.NEXT_PUBLIC_SITE_URL)
      : undefined,
};

const navLinks = [
  { href: "/wall", label: "Wall" },
  { href: "/rate", label: "Rate" },
  { href: "/admin/seed", label: "Seed" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">
        <header className="border-b border-white/5 bg-slate-950/80 backdrop-blur supports-[backdrop-filter]:bg-slate-950/70">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
            <Link href="/" className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300">
              Dyno Wall
            </Link>
            <nav className="flex gap-4 text-sm">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-full px-3 py-1 text-slate-200 transition-colors hover:bg-white/10"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl px-6 py-10 sm:py-16">{children}</main>
        <footer className="border-t border-white/5 bg-slate-950/80 py-6 text-center text-xs text-slate-500">
          Built with Next.js, Three.js, and Neon Postgres.
        </footer>
      </body>
    </html>
  );
}
