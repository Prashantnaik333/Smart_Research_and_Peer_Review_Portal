import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import LiquidEtherBackground from "@/components/LiquidEtherBackground";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ResearchHub | Research & Peer Review",
  description: "Academic Research and Peer Review Portal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <body className="relative isolate min-h-screen bg-[#080B14]">
        <LiquidEtherBackground />

        <div className="relative z-10 min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}