import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/app/globals.css";
import AppWrapper from "@/components/layout/AppWrapper";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "MaFlores",
  description: "Sistema para Florerías",
  icons: {
    icon: "/favicon-simple.svg",
    shortcut: "/favicon-simple.svg",
    apple: "/favicon-simple.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning className={inter.variable}>
      <head>
        <link rel="icon" href="/favicon-simple.svg" type="image/svg+xml" />
        <link rel="shortcut icon" href="/favicon-simple.svg" />
      </head>
      <body className="font-sans antialiased">
        <AppWrapper>{children}</AppWrapper>
      </body>
    </html>
  );
}
