import type { Metadata } from "next";
import { IBM_Plex_Mono, Noto_Naskh_Arabic, Space_Grotesk } from "next/font/google";

import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin", "latin-ext"],
  variable: "--font-space-grotesk",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin", "latin-ext"],
  variable: "--font-ibm-plex-mono",
  weight: ["400", "500", "700"],
});

const notoNaskhArabic = Noto_Naskh_Arabic({
  subsets: ["arabic"],
  variable: "--font-noto-naskh-arabic",
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Fuzzy Typo Corrector Web",
  description: "Single-word typo correction via local fuzzy inference.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.JSX.Element {
  return (
    <html lang="en">
      <body
        className={`${spaceGrotesk.variable} ${ibmPlexMono.variable} ${notoNaskhArabic.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
