import type { Metadata } from 'next';
import './globals.css';
import Navigation from '@/components/Navigation';

export const metadata: Metadata = {
  title: 'Aviator AeroCrash - Next Generation Crash Game',
  description: 'Real-time Aviator crash betting platform with Paystack deposits and provably fair flight mechanics.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#0B0E14] text-white min-h-screen pb-20">
        <main className="max-w-md mx-auto min-h-screen bg-[#0B0E14] border-x border-[#282C35]/50 flex flex-col">
          {children}
        </main>
        <Navigation />
      </body>
    </html>
  );
}
