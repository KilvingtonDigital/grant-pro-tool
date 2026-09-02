import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GrantPro — FORTIFIED Roof Grant Checker',
  description: 'Find out in 2 minutes if your home qualifies for up to $15,000 in FORTIFIED roofing grants and insurance premium discounts.',
  keywords: ['FORTIFIED roof', 'roofing grant', 'insurance discount', 'storm hardening', 'home hardening grant'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
