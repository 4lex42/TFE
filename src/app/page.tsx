"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from '../hooks/useAuth';

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) return <div>Chargement...</div>;

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold text-center mb-8">
          Système de Gestion de Stock
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {user && (
            <>
              <Link href="/dashboard" className="block">
                <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
                  <h2 className="text-xl font-bold mb-2">Tableau de Bord</h2>
                  <p className="text-gray-600">
                    Vue d'ensemble des stocks et des prédictions
                  </p>
                </div>
              </Link>

              <Link href="/stock" className="block">
                <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
                  <h2 className="text-xl font-bold mb-2">Gestion des Stocks</h2>
                  <p className="text-gray-600">
                    Gérer les produits et leurs quantités
                  </p>
                </div>
              </Link>

              <Link href="/importPrix" className="block">
                <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
                  <h2 className="text-xl font-bold mb-2">Import des Données</h2>
                  <p className="text-gray-600">
                    Importer des données depuis Excel
                  </p>
                </div>
              </Link>

              {user.role === 'admin' && (
                <Link href="/admin" className="block">
                  <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
                    <h2 className="text-xl font-bold mb-2">Administration</h2>
                    <p className="text-gray-600">
                      Gérer les utilisateurs et les magasins
                    </p>
                  </div>
                </Link>
              )}
            </>
          )}

          {!user && (
            <div className="col-span-full text-center">
              <p className="text-xl mb-6">
                Bienvenue sur notre système de gestion de stock. Veuillez vous connecter pour accéder à toutes les fonctionnalités.
              </p>
              <div className="space-x-4">
                <Link
                  href="/login"
                  className="inline-block bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Se connecter
                </Link>
                <Link
                  href="/register"
                  className="inline-block bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  S'inscrire
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="mt-12 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">Fonctionnalités Principales</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-600">
            <li>Suivi en temps réel des niveaux de stock</li>
            <li>Prédictions mathématiques des besoins futurs</li>
            <li>Alertes automatiques pour les stocks critiques</li>
            <li>Import/export de données via Excel</li>
            <li>Gestion multi-magasins</li>
          </ul>
    </div>
  </div>
    </main>
  );
}
