import type { Metadata } from "next";
import "./globals.css";
import Navigation from "@/components/Navigation";

export const metadata: Metadata = {
  title: "AeroCrash Aviator - Provably Fair Flight Betting",
  description: "Next Generation Aviator crash betting with M-PESA, Airtel Money, and Paystack integration."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#0B0E14] text-white min-h-screen md:pb-16">
        {children}
        <Navigation />
      </body>
    </html>
  );
}
