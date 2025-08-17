"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "../hooks/useAuth";
import { useRouter } from "next/navigation";

interface UserProfile {
  name: string;
  role: string;
}

export default function Navbar() {
  const { user, signOut, getUserProfile } = useAuth();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user) {
        const profile = await getUserProfile();
        if (profile) {
          setUserProfile(profile);
        }
      }
    };

    fetchUserProfile();
  }, [user, getUserProfile]);

  const handleLogout = async () => {
    const result = await signOut();
    if (result.success) {
      router.push('/login');
    }
  };

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center">
          <div className="text-2xl font-bold text-blue-600">Gestion Stock</div>
          <ul className="flex space-x-6 text-sm font-medium ml-10">
            {/* <li>
              <Link href="/" className="text-gray-700 hover:text-blue-600">
                Accueil
              </Link>
            </li> */}
            <li>
              <Link href="/dashboard" className="text-gray-700 hover:text-blue-600">
                Dashboard
              </Link>
            </li>
            <li>
              <Link href="/stock" className="text-gray-700 hover:text-blue-600">
                Stock
              </Link>
            </li>
            <li>
              <Link href="/stock/ajout" className="text-gray-700 hover:text-blue-600">
                Ajouter Stock
              </Link>
            </li>
            <li>
              <Link href="/ventes" className="text-gray-700 hover:text-blue-600">
                Ventes
              </Link>
            </li>
            {/* <li>
              <Link href="/importPrix" className="text-gray-700 hover:text-blue-600">
                Import
              </Link>
            </li> */}
            {userProfile?.role === 'admin' && (
              <>
                <li>
                  <Link href="/admin" className="text-gray-700 hover:text-blue-600">
                    Admin
                  </Link>
                </li>
                {/* <li>
                  <Link href="/admin/historique-stock" className="text-gray-700 hover:text-blue-600">
                    Historique Stocks
                  </Link>
                </li> */}
              </>
            )}
          </ul>
        </div>
        
        <div className="flex items-center space-x-4">
          {user ? (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700">
                  {userProfile?.name}
                </span>
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600 capitalize">
                  {userProfile?.role}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-500 text-white px-4 py-2 rounded-md text-sm hover:bg-red-600 transition-colors"
              >
                Déconnexion
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="bg-blue-500 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-600 transition-colors"
            >
              Connexion
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
