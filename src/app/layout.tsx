import type { Metadata } from "next";
import { Sora, JetBrains_Mono } from "next/font/google";
import { NavHeader } from "@/components/nav-header";
import "./globals.css";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Shipyard — Cursor Boston Cohort 1",
  description:
    "See what your cohort is building. Track who shipped, browse projects, and prep for Friday.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${sora.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <NavHeader />
        <div className="flex-1">{children}</div>
      </body>
    </html>
  );
}
