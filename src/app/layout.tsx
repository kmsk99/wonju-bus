import type { Metadata, Viewport } from "next";
import "./globals.css";

import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "원주시 버스 종점 출발 시간",
  description:
    "원주시 버스의 종점 출발 시간을 확인하고 남은 시간을 확인할 수 있는 사이트입니다.",
  applicationName: "원주 버스 시간표",
  authors: [{ name: "원주 버스 시간표 개발팀" }],
  keywords: ["원주", "버스", "시간표", "종점", "출발시간"],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#0070f3",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50">
          <header className="bg-primary text-white p-4 sticky top-0 z-10 shadow-md">
            <div className="container mx-auto px-4">
              <h1 className="text-xl font-bold">원주시 버스 종점 정보</h1>
            </div>
          </header>
          <main className="container mx-auto p-4">{children}</main>
          <footer className="bg-gray-100 py-4 mt-8 text-xs">
            <div className="container mx-auto text-center text-gray-600 px-4">
              <p>© 2023 원주시 버스 종점 정보 서비스</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
