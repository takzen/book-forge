import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
