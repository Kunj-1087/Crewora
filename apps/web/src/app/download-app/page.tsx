import type { Metadata } from 'next';
import { DownloadClientPage } from './DownloadClientPage';

export const metadata: Metadata = {
  title: 'Download Crewora Mobile App — Hire Verified Workers Instantly',
  description: 'Download the official Crewora Android app. Hire plumbers, electricians, and carpenters fast and direct with zero platform fees, in-app messaging, and live status tracking.',
  openGraph: {
    title: 'Download Crewora Mobile App — Hire Verified Workers Instantly',
    description: 'Get matched with verified local blue-collar workers instantly. Install the official Android APK directly on your phone.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Download Crewora Mobile App',
    description: 'Hire verified local workers instantly. Get the official Crewora Android APK.',
  }
};

export default function Page() {
  return <DownloadClientPage />;
}
