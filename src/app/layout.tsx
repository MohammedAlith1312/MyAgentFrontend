import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";

import { Sidebar } from "./components/Layout/Sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "VoltAgent Dashboard",
  description: "AI Agent Management Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-gray-950`}>
        <div className="flex min-h-screen">
          {/* Modern Sidebar */}
          <Suspense fallback={<div className="w-64 bg-gray-50 border-r border-gray-200 h-screen sticky top-0" />}>
            <Sidebar />
          </Suspense>

          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}