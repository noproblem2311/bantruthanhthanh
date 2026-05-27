import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Phát Triển Toàn Diện",
  description: "Hệ thống quản lý bán trú học sinh tiểu học",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: "/icon.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
