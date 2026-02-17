import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Office Game Request Tracker",
  description: "Track and manage office game requests",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen">{children}</body>
    </html>
  );
}
