import type { Metadata, Viewport } from 'next';
import './globals.css';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';
import { AuthProvider } from '@/contexts/AuthContext';
import AuthHeader from '@/components/AuthHeader';

export const metadata: Metadata = {
  title: 'Ink Vault',
  description: 'Daily journal and goal streak tracker',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Ink Vault',
  },
};

export const viewport: Viewport = {
  themeColor: '#1a1a1a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="bg-paper min-h-screen">
        <AuthProvider>
          <div className="max-w-lg mx-auto min-h-screen flex flex-col relative">
            <ServiceWorkerRegister />
            <AuthHeader />
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
