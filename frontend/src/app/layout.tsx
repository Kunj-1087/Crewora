import type { Metadata } from 'next';
import '../styles/globals.css';
import { AuthProvider } from '@/lib/auth/AuthProvider';
import { SocketProvider } from '@/contexts/SocketContext';
import { MobileShell } from '@/components/layout/MobileShell';
import { MobileHeader } from '@/components/layout/MobileHeader';
import { MobileTabBar } from '@/components/layout/MobileTabBar';

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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AuthProvider>
          <SocketProvider>
            <MobileShell>
              <MobileHeader />
              <main className="flex-1 flex flex-col overflow-y-auto min-h-0 bg-slate-50">
                {children}
              </main>
              <MobileTabBar />
            </MobileShell>
          </SocketProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
