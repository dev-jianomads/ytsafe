import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'StreamSafe Kids - ESRB Age Ratings for YouTube Channels',
  description: 'Get ESRB-style age ratings for any YouTube channel. Free safety analysis tool helps parents make informed decisions about family-friendly viewing. Check violence, language, and inappropriate content instantly.',
  keywords: [
    'YouTube safety',
    'parental controls',
    'ESRB ratings',
    'YouTube channel checker',
    'family-friendly YouTube',
    'content rating',
    'YouTube kids safety',
    'parent tools',
    'video content analysis',
    'child safety online'
  ],
  authors: [{ name: 'StreamSafe Kids' }],
  creator: 'StreamSafe Kids',
  publisher: 'StreamSafe Kids',
  robots: 'index, follow',
  openGraph: {
    title: 'StreamSafe Kids - ESRB Age Ratings for YouTube Channels',
    description: 'Free safety analysis tool for YouTube channels. Get ESRB-style age ratings to help parents make informed decisions about family-friendly viewing.',
    url: 'https://streamsafekids.com',
    siteName: 'StreamSafe Kids',
    type: 'website',
    locale: 'en_US',
  },
  alternates: {
    canonical: 'https://streamsafekids.com',
  },
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