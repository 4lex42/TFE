"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../hooks/useAuth';

interface Vente {
  id: string;
  date: string;
  mode_paiement: string;
  produits: VenteProduit[];
  total: number;
}

interface VenteProduit {
  id: string;
  produit_id: string;
  quantite: number;
  prix_unitaire: number;
  produit: {
    id: string;
    nom: string;
    code: string;
  };
}

export default function HistoriqueVentesPage() {
  const [ventes, setVentes] = useState<Vente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterDate, setFilterDate] = useState<string>('');
  const [filterModePaiement, setFilterModePaiement] = useState<string>('');
  const { user } = useAuth();

  useEffect(() => {
    fetchVentes();
  }, []);

  const fetchVentes = async () => {
    try {
      setLoading(true);
      
      // Récupérer toutes les ventes avec leurs produits
      const { data: achats, error: achatsError } = await supabase
        .from('achat')
        .select(`
          id,
          date,
          mode_paiement,
          achat_produit(
            id,
            quantite,
            prix_unitaire,
            produit(id, nom, code)
          )
        `)
        .order('date', { ascending: false });

      if (achatsError) throw achatsError;

      // Transformer les données pour calculer les totaux
      const ventesTransformees = (achats || []).map(achat => {
        const produits = achat.achat_produit || [];
        const total = produits.reduce((sum, prod) => sum + (prod.quantite * prod.prix_unitaire), 0);
        
        return {
          id: achat.id,
          date: achat.date,
          mode_paiement: achat.mode_paiement,
          produits: produits.map(prod => ({
            id: prod.id,
            produit_id: prod.produit.id,
            quantite: prod.quantite,
            prix_unitaire: prod.prix_unitaire,
            produit: prod.produit
          })),
          total
        };
      });

      setVentes(ventesTransformees);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const filteredVentes = ventes.filter(vente => {
    const matchesDate = !filterDate || vente.date.startsWith(filterDate);
    const matchesMode = !filterModePaiement || vente.mode_paiement === filterModePaiement;
    return matchesDate && matchesMode;
  });

  const totalVentes = filteredVentes.reduce((sum, vente) => sum + vente.total, 0);
  const totalTransactions = filteredVentes.length;

  if (loading) return <div className="flex justify-center items-center h-64">Chargement...</div>;
  if (error) return <div className="text-red-600 text-center p-4">{error}</div>;

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Historique des Ventes</h1>
        
        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700">Total des Ventes</h3>
            <p className="text-2xl font-bold text-green-600">{totalVentes.toFixed(2)} €</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700">Nombre de Transactions</h3>
            <p className="text-2xl font-bold text-blue-600">{totalTransactions}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700">Moyenne par Transaction</h3>
            <p className="text-2xl font-bold text-purple-600">
              {totalTransactions > 0 ? (totalVentes / totalTransactions).toFixed(2) : '0'} €
            </p>
          </div>
        </div>

        {/* Filtres */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filtrer par date</label>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filtrer par mode de paiement</label>
              <select
                value={filterModePaiement}
                onChange={(e) => setFilterModePaiement(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tous les modes</option>
                <option value="especes">Espèces</option>
                <option value="carte">Carte</option>
                <option value="cheque">Chèque</option>
              </select>
            </div>
          </div>
        </div>

        {/* Liste des ventes */}
        <div className="space-y-4">
          {filteredVentes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Aucune vente trouvée
            </div>
          ) : (
            filteredVentes.map((vente) => (
              <div key={vente.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Vente #{vente.id.slice(0, 8)}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {new Date(vente.date).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    <p className="text-sm text-gray-600">
                      Mode de paiement: <span className="font-medium">{vente.mode_paiement}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-green-600">
                      {vente.total.toFixed(2)} €
                    </p>
                  </div>
                </div>

                {/* Produits de la vente */}
                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-900 mb-2">Produits vendus:</h4>
                  <div className="space-y-2">
                    {vente.produits.map((produit) => (
                      <div key={produit.id} className="flex justify-between items-center text-sm">
                        <div>
                          <span className="font-medium">{produit.produit.nom}</span>
                          <span className="text-gray-600 ml-2">({produit.produit.code})</span>
                        </div>
                        <div className="text-right">
                          <span>{produit.quantite} x {produit.prix_unitaire.toFixed(2)} €</span>
                          <span className="font-medium ml-2">
                            = {(produit.quantite * produit.prix_unitaire).toFixed(2)} €
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
