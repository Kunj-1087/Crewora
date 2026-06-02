import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '../styles/globals.css';
import { AuthProvider } from '@/lib/auth/AuthProvider';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { SocketProvider } from '@/contexts/SocketContext';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: 'Crewora — Find Trusted Blue-Collar Workers Near You',
  description:
    'Crewora connects you with verified, skilled tradespeople — plumbers, electricians, carpenters and more — fast, reliable, and without middlemen.',
  keywords: 'blue collar workers, plumber, electrician, carpenter, skilled labor, hire workers',
  openGraph: {
    title: 'Crewora — Find Trusted Workers Near You',
    description: 'Get matched with verified skilled workers in your area. Fast, reliable, no middlemen.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <LanguageProvider>
            <SocketProvider>
              <div className="min-h-screen flex flex-col bg-slate-50">
                <Navbar />
                <main className="flex-1 flex flex-col">
                  {children}
                </main>
                <Footer />
              </div>
            </SocketProvider>
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
