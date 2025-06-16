"use client";

import React, { useState, useEffect } from 'react';
import { useProduits, Produit } from '../../../hooks/useProduits';
import { supabase } from '../../../lib/supabase';

export default function AjoutStockPage() {
  const { produits, loading, error, updateProduit } = useProduits();
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [quantityToAdd, setQuantityToAdd] = useState<number>(0);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || quantityToAdd <= 0) {
      setMessage({ type: 'error', text: 'Veuillez sélectionner un produit et une quantité valide' });
      return;
    }

    try {
      const produit = produits.find(p => p.id === selectedProduct);
      if (!produit) {
        setMessage({ type: 'error', text: 'Produit non trouvé' });
        return;
      }

      const newQuantity = produit.quantity + quantityToAdd;
      const result = await updateProduit(selectedProduct, { quantity: newQuantity });

      if (result.success) {
        setMessage({ type: 'success', text: `Stock mis à jour avec succès. Nouvelle quantité: ${newQuantity}` });
        setQuantityToAdd(0);
      } else {
        setMessage({ type: 'error', text: result.error || 'Une erreur est survenue' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Une erreur est survenue lors de la mise à jour du stock' });
    }
  };

  if (loading) return <div>Chargement...</div>;
  if (error) return <div>Erreur: {error}</div>;

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold text-center mb-8">
        Ajouter au Stock
      </h1>

      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
        {message && (
          <div className={`mb-4 p-4 rounded ${
            message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sélectionner un produit
            </label>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Choisir un produit</option>
              {produits.map((produit) => (
                <option key={produit.id} value={produit.id}>
                  {produit.nom} (Stock actuel: {produit.quantity})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantité à ajouter
            </label>
            <input
              type="number"
              min="1"
              value={quantityToAdd}
              onChange={(e) => setQuantityToAdd(parseInt(e.target.value) || 0)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Ajouter au Stock
          </button>
        </form>
      </div>
    </div>
  );
} 