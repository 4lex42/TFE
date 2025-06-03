"use client";

import "./globals.css";
import { Inter } from 'next/font/google';
import Navbar from "../components/Navbar";
import ProtectedRoute from "../components/ProtectedRoute";
import { usePathname } from 'next/navigation';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/register';
  const isHomePage = pathname === '/';

  return (
    <html lang="fr">
      <body className={inter.className}>
        {!isAuthPage && <Navbar />}
        {isAuthPage || isHomePage ? (
          children
        ) : (
          <ProtectedRoute>
            {children}
          </ProtectedRoute>
        )}
      </body>
    </html>
  );
}
