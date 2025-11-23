import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import MinikitProviderClient from "./MinikitProviderClient";
import { AuthProvider } from "@/contexts/AuthContext";

const gothic = localFont({
  src: [
    {
      path: "../public/fonts/gothic.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/gothicb.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-gothic",
});

export const metadata: Metadata = {
  title: "Ours - Real Estate Tokenization Platform",
  description:
    "Invest in high-yield real estate fractions. Powered by blockchain for transparency, security, and instant liquidity.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${gothic.variable} font-sans antialiased`}>
        <AuthProvider>
          <MinikitProviderClient>{children}</MinikitProviderClient>
        </AuthProvider>
      </body>
    </html>
  );
}
