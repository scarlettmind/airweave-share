import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "airweave · Share your experience",
  description: "Share your airweave experience. 中文 · English. Post and receive a Sleep Omamori.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
