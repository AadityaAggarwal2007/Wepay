import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'WePay | Payment Gateway Dashboard',
  description: 'WePay — Premium UPI Payment Gateway. Manage merchants, transactions, and payment links with ease.',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
