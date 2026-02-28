import type { Metadata, Viewport } from "next";
import "./globals.css";

import { ClientLayout } from "@/widgets/Layout";

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
      <body>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
