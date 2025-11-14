import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "将棋オンライン対戦",
  description: "オンラインで将棋を対戦できるアプリケーション",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
