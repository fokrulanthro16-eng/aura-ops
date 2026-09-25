import "./globals.css";
import type { Metadata } from "next";
import localFont from "next/font/local";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "AURA-OPS // WebXR Industrial Digital Twin",
  description: "Production-Grade WebXR Industrial Digital Twin for Meta VR Start Developer Competition 2026",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="w-full h-full m-0 p-0 overflow-hidden bg-slate-950">
      <body
        className={`${geistSans.variable} ${geistMono.variable} w-full h-full m-0 p-0 overflow-hidden bg-[#020617] text-slate-100 antialiased`}
        style={{ width: '100vw', height: '100vh', margin: 0, padding: 0, overflow: 'hidden' }}
      >
        {children}
      </body>
    </html>
  );
}
