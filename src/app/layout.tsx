import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://joaopanucci.com"),
  title: {
    default: "João Panucci | Software Developer",
    template: "%s | João Panucci",
  },
  description:
    "JoãoOS: portfólio interativo de João Paulo Panucci Bernardes. Java, Spring Boot, React, game engine e uma viagem do Big Bang ao código.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "João Panucci | Software Developer",
    description: "Um portfólio em forma de sistema operacional cósmico. Java, Spring Boot, React e Nyron Engine.",
    url: "https://joaopanucci.com",
    siteName: "João Panucci",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#04060f",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>{children}</body>
    </html>
  );
}
