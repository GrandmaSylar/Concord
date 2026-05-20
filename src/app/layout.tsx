import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import ThemeProvider from "@/components/ThemeProvider";
import { getSystemSettings } from "./actions/settings";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Concord - Bulk SMS Platform",
  description: "A clean, capable tool for sending messages, managing contacts, and automating reminders.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSystemSettings();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col relative" suppressHydrationWarning>
        <ThemeProvider settings={settings}>
          {children}
          <Toaster richColors position="top-center" closeButton expand={false} />
        </ThemeProvider>
      </body>
    </html>
  );
}
