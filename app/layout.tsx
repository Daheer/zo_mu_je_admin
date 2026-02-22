import type { Metadata } from "next";
import { DM_Mono } from "next/font/google";
import { LayoutSwitcher } from "@/components/LayoutSwitcher";
import "./globals.css";

const dmMono = DM_Mono({
  weight: ["300", "400", "500"],
  subsets: ["latin"],
  variable: "--font-dm-mono",
});

export const metadata: Metadata = {
  title: "Zo Mu Je Admin",
  description: "Admin dashboard for Zo Mu Je ride-hailing",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={dmMono.variable}>
      <body className="min-h-screen bg-background font-sans antialiased">
        <LayoutSwitcher>{children}</LayoutSwitcher>
      </body>
    </html>
  );
}
