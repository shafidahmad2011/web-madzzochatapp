import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'MadzzoChatApp',
  description: 'WhatsApp access portal via browser'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
