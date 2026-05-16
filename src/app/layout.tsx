import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "HvadMad – Hvad skal vi spise?",
  description:
    "Kan I ikke beslutte jer for hvad I skal spise? Opret et madrum, stem sammen, og find gruppens bedste match!",
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "HvadMad – Hvad skal vi spise?",
    description: "Stem sammen om aftensmaden. Hurtigt, sjovt og retfærdigt.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#f9a825",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="da">
      <body className={`${inter.variable} font-sans`}>
        <main className="mx-auto min-h-screen max-w-md px-4 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}
