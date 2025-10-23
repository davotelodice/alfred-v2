import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClientAuthProvider } from "@/components/ClientAuthProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Asistente Contable Inteligente",
  description: "Dashboard para gestión de finanzas personales",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.variable} font-sans antialiased`}>
        <ClientAuthProvider>
          {children}
        </ClientAuthProvider>
      </body>
    </html>
  );
}
