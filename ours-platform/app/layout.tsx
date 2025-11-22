import type { Metadata } from "next";
import "./globals.css";
import MinikitProviderClient from "./MinikitProviderClient";

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
      <body className="antialiased font-bold">
        <MinikitProviderClient>{children}</MinikitProviderClient>
      </body>
    </html>
  );
}
