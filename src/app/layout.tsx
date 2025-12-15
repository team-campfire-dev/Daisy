import type { Metadata } from "next";
import { Inter } from "next/font/google"; // or your preferred font
import "./globals.css";
import Script from 'next/script';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: '데이트픽',
  description: 'AI-powered date course recommendations',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head />
      <body className={inter.className}>

        {children}
      </body>
    </html>
  );
}
