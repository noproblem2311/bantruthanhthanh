import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bán trú Learning Hub",
  description: "Hệ thống quản lý bán trú học sinh tiểu học",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
