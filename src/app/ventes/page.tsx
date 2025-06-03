"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface Produit {
  id: string;
  nom: string;
  quantity: number;
  prix: number;
  code: string;
}

interface ProduitPanier {
  produit: Produit;
  quantite: number;
}

export default function VentesPage() {
  const [produits, setProduits] = useState<Produit[]>([]);
  const [panier, setPanier] = useState<ProduitPanier[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProduits();
  }, []);

  const fetchProduits = async () => {
    try {
      const { data, error } = await supabase
        .from('produit')
        .select('id, nom, quantity, prix, code')
        .order('nom');

      if (error) throw error;
      setProduits(data || []);
    } catch (err) {
      setError('Erreur lors du chargement des produits');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToPanier = (produit: Produit) => {
    setPanier(current => {
      const existingItem = current.find(item => item.produit.id === produit.id);
      if (existingItem) {
        if (existingItem.quantite >= produit.quantity) {
          setError('Stock insuffisant');
          return current;
        }
        return current.map(item =>
          item.produit.id === produit.id
            ? { ...item, quantite: item.quantite + 1 }
            : item
        );
      }
      return [...current, { produit, quantite: 1 }];
    });
  };

  const handleRemoveFromPanier = (produitId: string) => {
    setPanier(current => current.filter(item => item.produit.id !== produitId));
  };

  const handleUpdateQuantite = (produitId: string, newQuantite: number) => {
    setPanier(current =>
      current.map(item => {
        if (item.produit.id === produitId) {
          if (newQuantite > item.produit.quantity) {
            setError('Stock insuffisant');
            return item;
          }
          return { ...item, quantite: newQuantite };
        }
        return item;
      })
    );
  };

  const handleValiderVente = async () => {
    try {
      // 1. Créer l'achat
      const { data: achatData, error: achatError } = await supabase
        .from('achat')
        .insert([{
          date: new Date().toISOString(),
          mode_paiement: 'especes'
        }])
        .select()
        .single();

      if (achatError) throw achatError;

      // 2. Ajouter les produits à l'achat
      const achatProduits = panier.map(item => ({
        achat_id: achatData.id,
        produit_id: item.produit.id,
        quantite: item.quantite,
        prix_unitaire: item.produit.prix
      }));

      const { error: detailsError } = await supabase
        .from('achat_produit')
        .insert(achatProduits);

      if (detailsError) throw detailsError;

      // 3. Mettre à jour les stocks
      for (const item of panier) {
        const { error: updateError } = await supabase
          .from('produit')
          .update({ 
            quantity: item.produit.quantity - item.quantite 
          })
          .eq('id', item.produit.id);

        if (updateError) throw updateError;
      }

      // 4. Vider le panier et rafraîchir les produits
      setPanier([]);
      fetchProduits();
      setError(null);
    } catch (err) {
      setError('Erreur lors de l\'enregistrement de la vente');
    }
  };

  const filteredProduits = produits.filter(produit =>
    produit.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    produit.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const total = panier.reduce(
    (sum, item) => sum + (item.quantite * item.produit.prix),
    0
  );

  if (loading) return <div>Chargement...</div>;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Enregistrer une vente</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Liste des produits */}
        <div>
          <div className="mb-4">
            <input
              type="text"
              placeholder="Rechercher un produit..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>

          <div className="bg-white rounded-lg shadow-lg p-4 max-h-[600px] overflow-y-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left">Produit</th>
                  <th className="text-right">Prix</th>
                  <th className="text-right">Stock</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredProduits.map(produit => (
                  <tr key={produit.id} className="border-b">
                    <td className="py-2">
                      <div>
                        <div className="font-semibold">{produit.nom}</div>
                        <div className="text-sm text-gray-600">{produit.code}</div>
                      </div>
                    </td>
                    <td className="text-right">{produit.prix.toFixed(2)}€</td>
                    <td className="text-right">{produit.quantity}</td>
                    <td className="text-right">
                      <button
                        onClick={() => handleAddToPanier(produit)}
                        disabled={produit.quantity === 0}
                        className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 disabled:bg-gray-300"
                      >
                        +
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Panier */}
        <div>
          <div className="bg-white rounded-lg shadow-lg p-4">
            <h2 className="text-xl font-bold mb-4">Panier</h2>
            
            {panier.length === 0 ? (
              <p className="text-gray-600">Le panier est vide</p>
            ) : (
              <>
                <div className="space-y-4 mb-4">
                  {panier.map(item => (
                    <div key={item.produit.id} className="flex items-center justify-between border-b pb-2">
                      <div>
                        <div className="font-semibold">{item.produit.nom}</div>
                        <div className="text-sm text-gray-600">
                          {item.produit.prix.toFixed(2)}€ × {item.quantite}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          min="1"
                          max={item.produit.quantity}
                          value={item.quantite}
                          onChange={e => handleUpdateQuantite(item.produit.id, parseInt(e.target.value))}
                          className="w-16 p-1 border rounded"
                        />
                        <button
                          onClick={() => handleRemoveFromPanier(item.produit.id)}
                          className="text-red-500 hover:text-red-600"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-bold">Total:</span>
                    <span className="text-xl font-bold">{total.toFixed(2)}€</span>
                  </div>

                  <button
                    onClick={handleValiderVente}
                    className="w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600"
                  >
                    Valider la vente
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 