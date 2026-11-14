import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Manrope, Marck_Script } from "next/font/google";
import "./globals.css";

const display = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const ui = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

const script = Marck_Script({
  variable: "--font-marck",
  subsets: ["latin", "cyrillic"],
  weight: "400",
  display: "swap",
  // only needed from the third chapter on — keep it out of the first paint
  preload: false,
});

export const metadata: Metadata = {
  title: "LANA — The Fidelio Secret",
  description: "Some secrets are written in the stars. Others are unlocked at midnight.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
  appleWebApp: {
    capable: true,
    title: "LANA",
    statusBarStyle: "black-translucent",
  },
  formatDetection: { telephone: false, date: false, address: false, email: false },
  other: { "apple-mobile-web-app-capable": "yes" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#160F1C",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-world="midnight"
      className={`${display.variable} ${ui.variable} ${script.variable} antialiased`}
      suppressHydrationWarning
    >
      <body>{children}</body>
    </html>
  );
}
