import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { MotionProvider } from "@/components/ui/MotionConfig";

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
      <head>
        <link rel="dns-prefetch" href="https://www.WeGoDigital.dk" />
      </head>
      <body
        className={`${inter.variable} min-h-screen bg-gray-50 font-sans`}
      >
        <MotionProvider>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-md focus:bg-brand-500 focus:px-3 focus:py-2 focus:text-white"
          >
            Spring til indhold
          </a>
          <main id="main" className="mx-auto w-full max-w-md px-4 py-6">
            {children}
          </main>
        </MotionProvider>
      </body>
    </html>
  );
}
