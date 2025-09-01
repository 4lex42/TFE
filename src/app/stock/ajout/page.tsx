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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showProductInfo, setShowProductInfo] = useState(false);

  // Produit sélectionné pour afficher les informations
  const selectedProductData = produits.find(p => p.id === selectedProduct);
  const selectedFournisseurData = fournisseurs.find(f => f.id === selectedFournisseur);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || quantityToAdd <= 0 || !selectedFournisseur) {
      setMessage({ type: 'error', text: 'Veuillez sélectionner un produit, un fournisseur et une quantité valide' });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

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
        setShowProductInfo(false);
      } else {
        setMessage({ type: 'error', text: result.error || 'Une erreur est survenue lors de la mise à jour du stock' });
      }
    } catch (err) {
      console.error('Erreur complète:', err);
      setMessage({ type: 'error', text: 'Une erreur est survenue lors de la mise à jour du stock' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedProduct('');
    setSelectedFournisseur('');
    setQuantityToAdd(0);
    setMessage(null);
    setShowProductInfo(false);
  };

  if (loading || fournisseursLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Chargement des données...</p>
        </div>
      </div>
    );
  }

  if (error || fournisseursError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Erreur de chargement</h2>
          <p className="text-gray-600">{error || fournisseursError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Ajouter au Stock
          </h1>
          <p className="text-gray-600 text-lg">
            Augmentez le stock de vos produits via vos fournisseurs
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Formulaire principal */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
                  <h2 className="text-xl font-semibold text-white">Formulaire d'ajout</h2>
                </div>
                
                <div className="p-6">
                  {message && (
                    <div className={`mb-6 p-4 rounded-lg border-l-4 ${
                      message.type === 'success' 
                        ? 'bg-green-50 border-green-400 text-green-700' 
                        : 'bg-red-50 border-red-400 text-red-700'
                    }`}>
                      <div className="flex items-center">
                        {message.type === 'success' ? (
                          <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                        )}
                        <span className="font-medium">{message.text}</span>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Sélection du produit */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Produit à approvisionner
                      </label>
                      <select
                        value={selectedProduct}
                        onChange={(e) => {
                          setSelectedProduct(e.target.value);
                          setShowProductInfo(!!e.target.value);
                        }}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white hover:border-gray-400"
                        required
                      >
                        <option value="">Choisir un produit</option>
                        {produits.map((produit) => (
                          <option key={produit.id} value={produit.id}>
                            {produit.nom} - Stock actuel: {produit.quantity}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Sélection du fournisseur */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Fournisseur
                      </label>
                      <select
                        value={selectedFournisseur}
                        onChange={(e) => setSelectedFournisseur(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white hover:border-gray-400"
                        required
                      >
                        <option value="">Choisir un fournisseur</option>
                        {fournisseurs.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.nom} {f.email ? `(${f.email})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Quantité */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Quantité à ajouter
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="1"
                          value={quantityToAdd}
                          onChange={(e) => setQuantityToAdd(parseInt(e.target.value) || 0)}
                          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white hover:border-gray-400"
                          placeholder="Entrez la quantité"
                          required
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                          <span className="text-gray-500 text-sm">unités</span>
                        </div>
                      </div>
                    </div>

                    {/* Boutons d'action */}
                    <div className="flex gap-4 pt-4">
                      <button
                        type="submit"
                        disabled={isSubmitting || !selectedProduct || !selectedFournisseur || quantityToAdd <= 0}
                        className={`flex-1 flex items-center justify-center py-3 px-6 rounded-lg font-medium transition-all duration-200 ${
                          isSubmitting || !selectedProduct || !selectedFournisseur || quantityToAdd <= 0
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-blue-500 text-white hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transform hover:scale-105'
                        }`}
                      >
                        {isSubmitting ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                            Traitement...
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Ajouter au Stock
                          </>
                        )}
                      </button>
                      
                      <button
                        type="button"
                        onClick={resetForm}
                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200"
                      >
                        Réinitialiser
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>

            {/* Panneau d'information */}
            <div className="space-y-6">
              {/* Informations du produit sélectionné */}
              {showProductInfo && selectedProductData && (
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                  <div className="bg-gradient-to-r from-green-500 to-green-600 px-4 py-3">
                    <h3 className="text-lg font-semibold text-white">Informations du produit</h3>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">Nom:</span>
                      <span className="font-semibold text-gray-800">{selectedProductData.nom}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">Code:</span>
                      <span className="font-mono text-sm text-gray-700">{selectedProductData.code}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">Stock actuel:</span>
                      <span className={`font-bold ${
                        selectedProductData.quantity === 0 ? 'text-red-600' :
                        selectedProductData.quantity <= selectedProductData.quantity_critique ? 'text-orange-600' :
                        'text-green-600'
                      }`}>
                        {selectedProductData.quantity}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">Prix:</span>
                      <span className="font-semibold text-gray-800">{selectedProductData.prix}€</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">Catégorie:</span>
                      <span className="text-sm text-gray-700">
                        {selectedProductData.categories && selectedProductData.categories.length > 0 
                          ? selectedProductData.categories.map(cat => cat.nom_categorie).join(', ')
                          : 'Aucune catégorie'
                        }
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Informations du fournisseur sélectionné */}
              {selectedFournisseurData && (
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                  <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-4 py-3">
                    <h3 className="text-lg font-semibold text-white">Informations du fournisseur</h3>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">Nom:</span>
                      <span className="font-semibold text-gray-800">{selectedFournisseurData.nom}</span>
                    </div>
                    {selectedFournisseurData.email && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600">Email:</span>
                        <span className="text-sm text-gray-700">{selectedFournisseurData.email}</span>
                      </div>
                    )}
                    {selectedFournisseurData.telephone && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600">Téléphone:</span>
                        <span className="text-sm text-gray-700">{selectedFournisseurData.telephone}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Aperçu de l'opération */}
              {selectedProduct && selectedFournisseur && quantityToAdd > 0 && (
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-3">
                    <h3 className="text-lg font-semibold text-white">Aperçu de l'opération</h3>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">Nouveau stock:</span>
                      <span className="font-bold text-lg text-blue-600">
                        {selectedProductData ? selectedProductData.quantity + quantityToAdd : 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">Augmentation:</span>
                      <span className="font-semibold text-green-600">+{quantityToAdd}</span>
                    </div>
                    <div className="pt-2 border-t border-gray-200">
                      <div className="text-xs text-gray-500">
                        L'opération sera enregistrée dans l'historique des mouvements de stock
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Statistiques rapides */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-gray-500 to-gray-600 px-4 py-3">
                  <h3 className="text-lg font-semibold text-white">Statistiques</h3>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Total produits:</span>
                    <span className="font-semibold text-gray-800">{produits.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Total fournisseurs:</span>
                    <span className="font-semibold text-gray-800">{fournisseurs.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Produits en rupture:</span>
                    <span className="font-semibold text-red-600">
                      {produits.filter(p => p.quantity === 0).length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 