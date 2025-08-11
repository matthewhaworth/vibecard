import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import {SessionManager} from "@/components/SessionManager";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vibecard",
  description: "Generate AI postcards",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className={'mx-auto font-bold mt-6 text-center text-3xl'}>vibecard</div>
        <div className={'max-w-2xl mx-auto mt-12'}>
          <SessionManager>
            {children}
          </SessionManager>
        </div>
      </body>
    </html>
  );
}
