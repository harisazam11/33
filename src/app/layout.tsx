
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import ThemeInitializer from '@/components/layout/ThemeInitializer';
import AuthProvider from '@/components/shared/AuthProvider';
import QueryProvider from '@/components/shared/QueryProvider';

// Static metadata can still be defined
export const metadata: Metadata = {
  title: 'Quetta Parking E-Challan System',
  description: 'Digital parking challan system for Quetta traffic police.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased min-h-screen flex flex-col">
        <QueryProvider>
          <AuthProvider>
            <ThemeInitializer />
            {children}
            <Toaster />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
