import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PulseCheck Launch - Google Ads Campaign Management',
  description: 'Multi-tenant SaaS platform for Google Ads campaign management and optimization',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
