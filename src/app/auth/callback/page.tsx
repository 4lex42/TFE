"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../hooks/useAuth';

export default function AuthCallbackPage() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Vérification de votre email...
          </h2>
          <p className="text-gray-600">
            Veuillez patienter pendant que nous vérifions votre email.
          </p>
        </div>
      </div>
    </div>
  );
} 