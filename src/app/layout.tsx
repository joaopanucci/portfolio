import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"]
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"]
});

export const metadata: Metadata = {
  metadataBase: new URL("https://joaopanucci.com"),
  title: {
    default: "João Panucci | Software Developer",
    template: "%s | João Panucci"
  },
  description:
    "Portfólio de João Paulo Panucci Bernardes. Java, Spring Boot, React, APIs e desenvolvimento de software.",
  alternates: {
    canonical: "/"
  },
  openGraph: {
    title: "João Panucci | Software Developer",
    description:
      "Java, Spring Boot, React, APIs, arquitetura de software e produtos digitais.",
    url: "https://joaopanucci.com",
    siteName: "João Panucci",
    type: "website"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <Header />
        <main>
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}