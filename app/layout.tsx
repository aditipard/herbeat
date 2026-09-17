import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HerBeat — Sync your cycle. Power your life.",
  description:
    "Track your cycle, mood and habits in one place, and understand the hormones behind how you feel each day.",
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#4e2a84",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
