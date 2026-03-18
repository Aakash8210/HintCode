import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "HintCode — DSA Learning Platform",
  description: "Master Data Structures & Algorithms with AI-powered Socratic hints. Never see the answer, always grow.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} antialiased bg-[#0f0f0f] text-[#e8e8e8]`}>
        {children}
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: {
              background: "#1a1a1a",
              border: "1px solid #2a2a2a",
              color: "#e8e8e8",
            },
          }}
        />
      </body>
    </html>
  );
}
