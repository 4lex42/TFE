"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import { enregistrerVenteStock } from '../../lib/stockUtils';
import { useAuth } from '../../hooks/useAuth';

// Styles CSS personnalisés pour les animations
const customStyles = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes slideIn {
    from { transform: translateX(-20px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  
  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }
  
  .animate-fade-in {
    animation: fadeIn 0.3s ease-out;
  }
  
  .animate-slide-in {
    animation: slideIn 0.3s ease-out;
  }
  
  .animate-pulse-slow {
    animation: pulse 2s infinite;
  }
  
  .hover-lift {
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  
  .hover-lift:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  }
`;

interface Produit {
  id: string;
  nom: string;
  quantity: number;
  prix: number;
  code: string;
  tva_direct?: number | null;
  categories?: {
    id: string;
    nom_categorie: string;
  }[];
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
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<{id: string, nom_categorie: string}[]>([]);
  const [modePaiement, setModePaiement] = useState<string>('especes');
  const { user } = useAuth();

  useEffect(() => {
    fetchProduits();
  }, []);

  const fetchProduits = async () => {
    try {
      const { data, error } = await supabase
        .from('produit')
        .select(`
          id, 
          nom, 
          quantity, 
          prix, 
          code,
          tva_direct,
          categories:lien_categorie_produit(
            id_categorie,
            categorie:categorie(id, nom_categorie)
          )
        `)
        .order('nom');

      if (error) throw error;
      
      // Log de débogage pour voir la structure des données
      console.log('Produits récupérés avec TVA:', data);
      
      // Vérifier d'abord si la table lien_categorie_produit contient des données
      const { data: lienData, error: lienError } = await supabase
        .from('lien_categorie_produit')
        .select('*')
        .limit(5);
      
      console.log('Données de lien_categorie_produit:', lienData);
      console.log('Erreur lien_categorie_produit:', lienError);
      
      // Récupérer les catégories pour chaque produit séparément
      const produitsAvecCategories = await Promise.all((data || []).map(async (produit) => {
        const { data: categoriesData, error: catError } = await supabase
          .from('lien_categorie_produit')
          .select(`
            id_categorie,
            categorie:categorie(id, nom_categorie)
          `)
          .eq('id_produit', produit.id);
        
        if (catError) {
          console.log(`Erreur catégories pour ${produit.nom}:`, catError);
        }
        
        const categories = categoriesData?.map(item => item.categorie).filter(Boolean) || [];
        
        return {
          ...produit,
          categories
        };
      }));
      
      console.log('Produits avec catégories:', produitsAvecCategories);
      
      // Vérifier la structure des catégories
      produitsAvecCategories.forEach(produit => {
        console.log(`Produit ${produit.nom}:`, {
          id: produit.id,
          categories: produit.categories,
          categoriesLength: produit.categories?.length || 0
        });
      });
      
      // Extraire les catégories uniques pour le filtre
      const uniqueCategories = Array.from(
        new Set(
          produitsAvecCategories
            .flatMap(produit => produit.categories || [])
            .map(cat => cat.nom_categorie)
        )
      ).sort();
      
      console.log('Catégories uniques trouvées:', uniqueCategories);
      
      setCategories(uniqueCategories.map(nom => ({ id: nom, nom_categorie: nom })));
      setProduits(produitsAvecCategories);
    } catch (err) {
      setError('Erreur lors du chargement des produits');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToPanier = (produit: Produit) => {
    setError(null);
    setSuccessMessage(null);
    
    setPanier(current => {
      const existingItem = current.find(item => item.produit.id === produit.id);
      if (existingItem) {
        if (existingItem.quantite >= produit.quantity) {
          setError('Stock insuffisant pour ce produit');
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
    
    setSuccessMessage(`${produit.nom} ajouté au panier`);
    setTimeout(() => setSuccessMessage(null), 2000);
  };

  const handleRemoveFromPanier = (produitId: string) => {
    setPanier(current => current.filter(item => item.produit.id !== produitId));
    setError(null);
  };

  const handleUpdateQuantite = (produitId: string, newQuantite: number) => {
    setError(null);
    
    if (newQuantite <= 0) {
      handleRemoveFromPanier(produitId);
      return;
    }
    
    setPanier(current =>
      current.map(item => {
        if (item.produit.id === produitId) {
          if (newQuantite > item.produit.quantity) {
            setError('Stock insuffisant pour cette quantité');
            return item;
          }
          return { ...item, quantite: newQuantite };
        }
        return item;
      })
    );
  };

  const handleValiderVente = async () => {
    if (panier.length === 0) {
      setError('Le panier est vide');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // 1. Créer l'achat
      const { data: achatData, error: achatError } = await supabase
        .from('achat')
        .insert([{
          date: new Date().toISOString(),
          mode_paiement: modePaiement
        }])
        .select()
        .single();

      if (achatError) throw achatError;

      // 2. Ajouter les produits à l'achat
      const achatProduits = panier.map(item => ({
        achat_id: achatData.id,
        produit_id: item.produit.id,
        quantite: item.quantite,
        prix_unitaire: item.produit.prix,
        tva_appliquee: getTvaRate(item.produit)
      }));

      const { error: detailsError } = await supabase
        .from('achat_produit')
        .insert(achatProduits);

      if (detailsError) throw detailsError;

      // 3. Mettre à jour les stocks et enregistrer dans l'historique
      for (const item of panier) {
        const { error: updateError } = await supabase
          .from('produit')
          .update({ 
            quantity: item.produit.quantity - item.quantite 
          })
          .eq('id', item.produit.id);

        if (updateError) throw updateError;

        // Enregistrer la vente dans l'historique
        await enregistrerVenteStock(
          item.produit.id,
          item.quantite,
          `Vente - Achat #${achatData.id}`,
          user?.id
        );
      }

      // 4. Vider le panier et rafraîchir les produits
      setPanier([]);
      setModePaiement('especes'); // Réinitialiser le mode de paiement
      fetchProduits();
      setSuccessMessage('Vente enregistrée avec succès !');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Erreur lors de l\'enregistrement de la vente');
    } finally {
      setIsProcessing(false);
    }
  };

  const clearPanier = () => {
    setPanier([]);
    setError(null);
    setModePaiement('especes'); // Réinitialiser le mode de paiement
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
  };

  // Fonctions de calcul TVA
  const getTvaRate = (produit: Produit): number => {
    console.log('Calcul TVA pour produit:', produit.nom, 'TVA directe:', produit.tva_direct);
    
    // Priorité 1: TVA directe sur le produit
    if (produit.tva_direct !== undefined && produit.tva_direct !== null) {
      console.log('TVA trouvée:', produit.tva_direct);
      return produit.tva_direct;
    }
    
    // Valeur par défaut: 20%
    console.log('TVA par défaut: 20%');
    return 20;
  };

  const calculerPrixAvecTVA = (prix: number, tva: number) => {
    return prix * (1 + tva / 100);
  };

  const calculerTVA = (prix: number, tva: number) => {
    return prix * (tva / 100);
  };

  const filteredProduits = produits.filter(produit => {
    const matchesSearch = produit.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         produit.code.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || 
                           produit.categories?.some(cat => cat.nom_categorie === selectedCategory);
    
    return matchesSearch && matchesCategory;
  });

  const total = panier.reduce(
    (sum, item) => sum + (item.quantite * item.produit.prix),
    0
  );

  const totalTVA = panier.reduce(
    (sum, item) => sum + (item.quantite * calculerTVA(item.produit.prix, getTvaRate(item.produit))),
    0
  );

  const totalAvecTVA = total + totalTVA;

  const totalItems = panier.reduce((sum, item) => sum + item.quantite, 0);

  // Fonction pour obtenir l'icône du mode de paiement
  const getModePaiementIcon = (mode: string) => {
    switch (mode.toLowerCase()) {
      case 'especes':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
        );
      case 'carte':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        );
      case 'cheque':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        );
    }
  };

  const getModePaiementLabel = (mode: string) => {
    switch (mode.toLowerCase()) {
      case 'especes':
        return 'Espèces';
      case 'carte':
        return 'Carte bancaire';
      case 'cheque':
        return 'Chèque';
      default:
        return 'Autre';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Chargement des produits...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style jsx>{customStyles}</style>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="container mx-auto py-8 px-4">
          {/* Header */}
          <div className="text-center mb-8 animate-fade-in">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              Enregistrer une vente
            </h1>
            <p className="text-gray-600 text-lg">
              Sélectionnez les produits et finalisez la transaction
            </p>
          </div>

          {/* Messages de feedback */}
          {error && (
            <div className="max-w-4xl mx-auto mb-6 animate-slide-in">
              <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <span className="text-red-700 font-medium">{error}</span>
                </div>
              </div>
            </div>
          )}

          {successMessage && (
            <div className="max-w-4xl mx-auto mb-6 animate-slide-in">
              <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-lg">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-green-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-green-700 font-medium">{successMessage}</span>
                </div>
              </div>
            </div>
          )}

          {/* Navigation et actions */}
          <div className="max-w-4xl mx-auto mb-6 animate-fade-in" style={{animationDelay: '0.1s'}}>
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center space-x-4">
                <Link 
                  href="/ventes/historique" 
                  className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-200 transform hover:scale-105 hover-lift"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Historique des ventes
                </Link>
              </div>
              
              {panier.length > 0 && (
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-600">
                    {totalItems} article{totalItems > 1 ? 's' : ''} dans le panier
                  </span>
                  <button
                    onClick={clearPanier}
                    className="px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                  >
                    Vider le panier
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              {/* Liste des produits */}
              <div className="xl:col-span-2 animate-fade-in" style={{animationDelay: '0.2s'}}>
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover-lift">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
                    <h2 className="text-xl font-semibold text-white">Produits disponibles</h2>
                  </div>
                  
                  <div className="p-6">
                    {/* Recherche et filtres */}
                    <div className="mb-6 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Recherche par nom/code */}
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Rechercher un produit..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                          />
                          <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </div>
                        
                        {/* Filtre par catégorie */}
                        <div className="relative">
                          <select
                            value={selectedCategory}
                            onChange={e => setSelectedCategory(e.target.value)}
                            className="w-full pl-4 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 appearance-none bg-white"
                          >
                            <option value="all">Toutes les catégories</option>
                            {categories.map(category => (
                              <option key={category.id} value={category.nom_categorie}>
                                {category.nom_categorie}
                              </option>
                            ))}
                          </select>
                          <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                          {filteredProduits.length} produit{filteredProduits.length > 1 ? 's' : ''} trouvé{filteredProduits.length > 1 ? 's' : ''}
                        </div>
                        
                        {/* Bouton de réinitialisation des filtres */}
                        {(searchTerm !== '' || selectedCategory !== 'all') && (
                          <button
                            onClick={resetFilters}
                            className="text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-1 rounded-md transition-colors flex items-center"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Réinitialiser les filtres
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Liste des produits */}
                    <div className="max-h-[600px] overflow-y-auto space-y-3">
                      {filteredProduits.map((produit, index) => (
                        <div
                          key={produit.id}
                          className={`p-4 border rounded-lg transition-all duration-200 hover:shadow-md hover-lift ${
                            produit.quantity === 0 
                              ? 'bg-gray-50 border-gray-200' 
                              : 'bg-white border-gray-200 hover:border-blue-300'
                          }`}
                          style={{animationDelay: `${0.3 + index * 0.05}s`}}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3">
                                <div className="flex-1">
                                  <h3 className="font-semibold text-gray-800">{produit.nom}</h3>
                                  <div className="text-sm text-gray-600">{produit.code}</div>
                                  
                                  {/* Affichage des catégories */}
                                  {produit.categories && produit.categories.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {produit.categories.map(category => (
                                        <span
                                          key={category.id}
                                          className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full"
                                        >
                                          {category.nom_categorie}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-4">
                              <div className="text-right">
                                <div className="font-semibold text-gray-800">
                                  {calculerPrixAvecTVA(produit.prix, getTvaRate(produit)).toFixed(2)}€
                                </div>
                                <div className="text-xs text-gray-500">
                                  HT: {produit.prix.toFixed(2)}€ + {getTvaRate(produit)}% TVA
                                </div>
                                <div className={`text-sm ${
                                  produit.quantity === 0 ? 'text-red-600' :
                                  produit.quantity <= 5 ? 'text-orange-600' :
                                  'text-green-600'
                                }`}>
                                  Stock: {produit.quantity}
                                </div>
                              </div>
                              
                              <button
                                onClick={() => handleAddToPanier(produit)}
                                disabled={produit.quantity === 0}
                                className={`p-2 rounded-lg transition-all duration-200 transform hover:scale-110 ${
                                  produit.quantity === 0
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-blue-500 text-white hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                                }`}
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {filteredProduits.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                          <p>Aucun produit trouvé</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Panier */}
              <div className="xl:col-span-1 animate-fade-in" style={{animationDelay: '0.3s'}}>
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden sticky top-8 hover-lift">
                  <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4">
                    <h2 className="text-xl font-semibold text-white flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m6 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01M9 9h.01M15 9h.01" />
                      </svg>
                      Panier ({totalItems})
                    </h2>
                  </div>
                  
                  <div className="p-6">
                    {panier.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m6 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01M9 9h.01M15 9h.01" />
                        </svg>
                        <p className="text-gray-600">Votre panier est vide</p>
                        <p className="text-sm text-gray-500">Sélectionnez des produits pour commencer</p>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-4 mb-6">
                          {panier.map((item, index) => (
                            <div 
                              key={item.produit.id} 
                              className="p-3 bg-gray-50 rounded-lg border border-gray-200 animate-slide-in"
                              style={{animationDelay: `${0.4 + index * 0.1}s`}}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex-1">
                                  <h4 className="font-semibold text-gray-800 text-sm">{item.produit.nom}</h4>
                                  <div className="text-xs text-gray-600">{item.produit.code}</div>
                                </div>
                                <button
                                  onClick={() => handleRemoveFromPanier(item.produit.id)}
                                  className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded transition-colors"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                              
                                                          <div className="flex items-center justify-between">
                                <div className="text-sm text-gray-600">
                                  <div className="flex items-center space-x-2">
                                    <span>{item.produit.prix.toFixed(2)}€</span>
                                    <span className="text-xs text-gray-500">+{getTvaRate(item.produit)}% TVA</span>
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {calculerPrixAvecTVA(item.produit.prix, getTvaRate(item.produit)).toFixed(2)}€ avec TVA × {item.quantite}
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="number"
                                    min="1"
                                    max={item.produit.quantity}
                                    value={item.quantite}
                                    onChange={e => handleUpdateQuantite(item.produit.id, parseInt(e.target.value) || 1)}
                                    className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  />
                                  <span className="text-xs text-gray-500">qté</span>
                                </div>
                              </div>
                              
                              <div className="text-right mt-2">
                                <div className="text-sm text-gray-600">
                                  <div>HT: {(item.quantite * item.produit.prix).toFixed(2)}€</div>
                                  <div>TVA: {(item.quantite * calculerTVA(item.produit.prix, getTvaRate(item.produit))).toFixed(2)}€</div>
                                </div>
                                <span className="font-semibold text-gray-800 text-lg">
                                  {(item.quantite * calculerPrixAvecTVA(item.produit.prix, getTvaRate(item.produit))).toFixed(2)}€
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="border-t pt-4 space-y-4">
                          {/* Sélection du moyen de paiement */}
                          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                              <svg className="w-4 h-4 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                              </svg>
                              Moyen de paiement
                            </h4>
                            
                            <div className="grid grid-cols-3 gap-3">
                              <button
                                onClick={() => setModePaiement('especes')}
                                className={`p-3 rounded-lg border-2 transition-all duration-200 flex flex-col items-center ${
                                  modePaiement === 'especes'
                                    ? 'border-green-500 bg-green-50 text-green-700'
                                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                                }`}
                              >
                                <svg className="w-6 h-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                </svg>
                                <span className="text-sm font-medium">Espèces</span>
                              </button>
                              
                              <button
                                onClick={() => setModePaiement('carte')}
                                className={`p-3 rounded-lg border-2 transition-all duration-200 flex flex-col items-center ${
                                  modePaiement === 'carte'
                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                                }`}
                              >
                                <svg className="w-6 h-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                </svg>
                                <span className="text-sm font-medium">Carte</span>
                              </button>
                              
                              <button
                                onClick={() => setModePaiement('cheque')}
                                className={`p-3 rounded-lg border-2 transition-all duration-200 flex flex-col items-center ${
                                  modePaiement === 'cheque'
                                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                                }`}
                              >
                                <svg className="w-6 h-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span className="text-sm font-medium">Chèque</span>
                              </button>
                            </div>
                            
                            <div className="mt-3 text-xs text-gray-500 text-center">
                              Mode sélectionné : <span className="font-medium">{getModePaiementLabel(modePaiement)}</span>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between items-center text-sm text-gray-600">
                              <span>Sous-total HT:</span>
                              <span>{total.toFixed(2)}€</span>
                            </div>
                            <div className="flex justify-between items-center text-sm text-gray-600">
                              <span>TVA:</span>
                              <span>{totalTVA.toFixed(2)}€</span>
                            </div>
                            <div className="border-t pt-2">
                              <div className="flex justify-between items-center text-lg">
                                <span className="font-semibold text-gray-700">Total TTC:</span>
                                <span className="text-2xl font-bold text-green-600">{totalAvecTVA.toFixed(2)}€</span>
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={handleValiderVente}
                            disabled={isProcessing || panier.length === 0}
                            className={`w-full py-3 px-6 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 ${
                              isProcessing || panier.length === 0
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-green-500 text-white hover:bg-green-600 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 animate-pulse-slow'
                            }`}
                          >
                            {isProcessing ? (
                              <div className="flex items-center justify-center">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                Traitement...
                              </div>
                            ) : (
                              <div className="flex items-center justify-center">
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Valider la vente
                                <span className="ml-2 text-xs opacity-75">({getModePaiementLabel(modePaiement)})</span>
                              </div>
                            )}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 