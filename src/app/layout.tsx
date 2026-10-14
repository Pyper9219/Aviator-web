import type { Metadata } from 'next';
import './globals.css';
import ResponsiveNavigation from '@/components/ResponsiveNavigation';

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
      <body className="bg-[#0B0E14] text-white min-h-screen pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-16">
        <div className="app-shell mx-auto min-h-screen w-full max-w-screen-2xl bg-[#0B0E14] flex flex-col">
          {children}
          <ResponsiveNavigation />
        </div>
      </body>
    </html>
  );
}
