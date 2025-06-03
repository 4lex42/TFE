"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../hooks/useAuth';

interface AdminRouteProps {
  children: React.ReactNode;
}

export default function AdminRoute({ children }: AdminRouteProps) {
  const router = useRouter();
  const { user, getUserProfile, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
      // Attendre que la vérification initiale de l'authentification soit terminée
      if (authLoading) return;

      if (!user) {
        setLoading(false);
        router.push('/login');
        return;
      }

      try {
        const profile = await getUserProfile();
        if (!profile || profile.role !== 'admin') {
          setLoading(false);
          router.push('/dashboard');
          return;
        }

        setIsAdmin(true);
      } catch (error) {
        console.error('Erreur lors de la vérification du rôle:', error);
        router.push('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [user, router, getUserProfile, authLoading]);

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Vérification des autorisations...
          </h2>
          <p className="text-gray-600">
            Veuillez patienter pendant que nous vérifions vos droits d'accès.
          </p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return <>{children}</>;
} 