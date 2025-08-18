"use client";

import React, { useState, useEffect } from 'react';
import { useProduits, Produit } from '../../../hooks/useProduits';
import { supabase } from '../../../lib/supabase';
import { useFournisseurs } from '../../../hooks/useFournisseurs';
import { enregistrerAjoutStockViaAjoutProduits } from '../../../lib/stockUtils';
import { useAuth } from '../../../hooks/useAuth';

export default function AjoutStockPage() {
  const { produits, loading, error, updateProduit } = useProduits();
  const { fournisseurs, loading: fournisseursLoading, error: fournisseursError } = useFournisseurs();
  const { user } = useAuth();
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [selectedFournisseur, setSelectedFournisseur] = useState<string>('');
  const [quantityToAdd, setQuantityToAdd] = useState<number>(0);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || quantityToAdd <= 0 || !selectedFournisseur) {
      setMessage({ type: 'error', text: 'Veuillez sélectionner un produit, un fournisseur et une quantité valide' });
      return;
    }

    try {
      const produit = produits.find(p => p.id === selectedProduct);
      const fournisseur = fournisseurs.find(f => f.id === selectedFournisseur);
      
      if (!produit) {
        setMessage({ type: 'error', text: 'Produit non trouvé' });
        return;
      }

      if (!fournisseur) {
        setMessage({ type: 'error', text: 'Fournisseur non trouvé' });
        return;
      }

      // 1. Enregistrer l'ajout dans la table ajout_produits
      const { data: ajoutData, error: ajoutError } = await supabase
        .from('ajout_produits')
        .insert([{
          date: new Date().toISOString().split('T')[0], // Date au format YYYY-MM-DD
          fournisseur: fournisseur.nom,
          quantity: quantityToAdd,
          type: 'AJOUT',
          note: `Ajout de stock par ${fournisseur.nom}`
        }])
        .select()
        .single();

      if (ajoutError) {
        console.error('Erreur lors de l\'enregistrement de l\'ajout:', ajoutError);
        setMessage({ type: 'error', text: `Erreur lors de l'enregistrement: ${ajoutError.message}` });
        return;
      }

      // 2. Mettre à jour le stock du produit et lier à l'ajout_produits
      const newQuantity = produit.quantity + quantityToAdd;
      const result = await updateProduit(selectedProduct, { 
        quantity: newQuantity,
        ajout_produit_id: ajoutData.id
      });

              if (result.success) {
          // 3. Enregistrer le mouvement dans l'historique via ajout_produits
          const resultatHistorique = await enregistrerAjoutStockViaAjoutProduits(
            ajoutData.id,
            quantityToAdd,
            `Ajout de stock par ${fournisseur.nom}`,
            user?.id,
            selectedProduct
          );

          if (!resultatHistorique.success) {
            console.warn('Échec de l\'enregistrement de l\'historique:', resultatHistorique.error);
            // On continue même si l'historique échoue
          }

          // 4. Enregistrer le lien produit-fournisseur
          const { error: lienError } = await supabase
            .from('lien_produit_fournisseur')
            .insert([{ produit_id: selectedProduct, fournisseur_id: selectedFournisseur }] );

          if (lienError) {
            console.warn('Erreur lors de l\'association fournisseur:', lienError);
            // On continue même si l'association échoue
          }

          setMessage({ type: 'success', text: `Stock mis à jour avec succès. Nouvelle quantité: ${newQuantity}` });
          setQuantityToAdd(0);
          setSelectedFournisseur('');
          setSelectedProduct('');
        } else {
          setMessage({ type: 'error', text: result.error || 'Une erreur est survenue lors de la mise à jour du stock' });
        }
    } catch (err) {
      console.error('Erreur complète:', err);
      setMessage({ type: 'error', text: 'Une erreur est survenue lors de la mise à jour du stock' });
    }
  };

  if (loading || fournisseursLoading) return <div>Chargement...</div>;
  if (error || fournisseursError) return <div>Erreur: {error || fournisseursError}</div>;

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold text-center mb-8">Ajouter au Stock</h1>

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
              Sélectionner un fournisseur
            </label>
            <select
              value={selectedFournisseur}
              onChange={(e) => setSelectedFournisseur(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Choisir un fournisseur</option>
              {fournisseurs.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nom} {f.email ? `- ${f.email}` : ''}
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