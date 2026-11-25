import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ToastProvider } from "@/components/Toast";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "A.E.L. — Платформа работы с заявками для сервисного центра",
  description: "Веб-форма колл-центра A.E.L. для создания заявок в Bitrix24",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full font-sans text-[#1F2328]">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
