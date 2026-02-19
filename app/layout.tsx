import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "Attensi Game Hub",
  description: "Find and request games for the office",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen overflow-x-hidden bg-zinc-950 text-zinc-100 antialiased">
        <Sidebar />
        <div className="min-h-screen w-full min-w-0 pt-14 lg:pl-56 lg:pt-0">
          {children}
        </div>
      </body>
    </html>
  );
}
