import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "MultiBiz AI | Software de gestión de negocios con IA",
  description:
    "Gestiona citas, clientes, ventas y automatiza tu negocio con inteligencia artificial. MultiBiz AI es el sistema todo en uno para emprendedores y negocios.",
  keywords: [
    "software para negocios",
    "gestión de citas",
    "app para negocios",
    "CRM para pequeñas empresas",
    "automatización de negocios",
    "sistema de citas",
    "MultiBiz AI",
  ],
  openGraph: {
    title: "MultiBiz AI",
    description:
      "Administra tu negocio con inteligencia artificial: citas, clientes, ventas y más.",
    url: "https://multibizai.com",
    siteName: "MultiBiz AI",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
