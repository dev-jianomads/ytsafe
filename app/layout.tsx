import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'StreamSafe Kids - ESRB Age Ratings for YouTube Channels',
  description: 'ESRB age ratings for any YouTube channel—clear, fast, parent-friendly. Get instant safety analysis to help parents make informed decisions about family-friendly viewing.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}