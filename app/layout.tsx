import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Build the Best — Blind Auction",
  description: "A two-player blind auction party game.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
