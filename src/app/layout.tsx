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

export const metadata: Metadata = {
  title: "Planetary Dynamics Explorer",
  description:
    "Explore how radius, density, gravity, and rotation evolve across 4.5 billion years of planetary history. Interactive physics model — exploration, not endorsement.",
  metadataBase: new URL("https://isitbiggernow.com"),
  openGraph: {
    title: "Planetary Dynamics Explorer",
    description:
      "Explore how radius, density, gravity, and rotation evolve across 4.5 billion years of planetary history.",
    siteName: "Planetary Dynamics Explorer",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Planetary Dynamics Explorer",
    description:
      "Explore how radius, density, gravity, and rotation evolve across 4.5 billion years of planetary history.",
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
