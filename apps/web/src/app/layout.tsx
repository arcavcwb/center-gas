import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Header } from "../components/Header";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Center Gas - B2B Panel",
  description: "Panel de control B2B de Center Gas Curitiba",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.variable} font-sans antialiased bg-slate-50 text-slate-900 min-h-screen flex flex-col`}>
        <Header />
        <div className="flex-1">
          {children}
        </div>
      </body>
    </html>
  );
}
