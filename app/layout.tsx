import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppNavbar } from "@/components/AppNavbar";
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
  title: "Real-Time Spoken English Proficiency Analytics",
  description:
    "Spoken English proficiency lab: live AI practice, drills, timed picture talk, transcript metrics, and session trends in your browser.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} flex min-h-screen flex-col text-zinc-100 antialiased`}
      >
        <AppNavbar />
        <div className="relative flex min-h-0 flex-1 flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
