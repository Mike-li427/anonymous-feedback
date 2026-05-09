import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "匿名评价 - 来匿名评价我",
  description:
    "生成你的匿名主页，让朋友们匿名给你留言。支持完全匿名和可解锁身份两种模式。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
          {children}
        </main>
      </body>
    </html>
  );
}
