import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { ThemeToggle } from "@/components/ThemeToggle";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "9‑Box Talent Assessment",
  description: "Assess performance and potential with a modern 9‑box UI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>
          <header className="sticky top-0 z-40 w-full border-b border-[var(--color-border)]/60 bg-[var(--color-background)]/80 backdrop-blur">
            <div className="container flex h-14 items-center justify-between">
              <div className="text-sm font-semibold tracking-tight">9‑Box Talent Assessment</div>
              <ThemeToggle />
            </div>
          </header>
          <div className="container py-6">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
