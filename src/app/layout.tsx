import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

/*
 * Self-hosted by next/font, so the interface renders identically on every
 * machine — including the headless Chromium that generates the PDFs.
 *
 * Explicit weights matter: the default is Inter's variable font, and Chromium
 * silently drops variable webfonts when exporting a PDF (the text came out in
 * the fallback serif). Static instances embed correctly.
 */
const inter = Inter({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Book Forge",
  description: "A local workspace for writing and exporting books.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
