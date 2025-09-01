"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../hooks/useAuth';
import Link from 'next/link';

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
  tva_appliquee?: number;
  produit: {
    id: string;
    nom: string;
    code: string;
    tva_direct?: number;
  };
}

export default function HistoriqueVentesPage() {
  const [ventes, setVentes] = useState<Vente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterDate, setFilterDate] = useState<string>('');
  const [filterModePaiement, setFilterModePaiement] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [expandedVente, setExpandedVente] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'total' | 'mode'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // État pour la pagination
  const [displayedCount, setDisplayedCount] = useState(10);
  
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
            tva_appliquee,
            produit(id, nom, code, tva_direct)
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
          produits: produits.map(prod => {
            // Vérifier que prod.produit est un objet et non un tableau
            const produitData = Array.isArray(prod.produit) ? prod.produit[0] : prod.produit;
            
            return {
              id: prod.id,
              produit_id: produitData?.id || '',
              quantite: prod.quantite,
              prix_unitaire: prod.prix_unitaire,
              tva_appliquee: prod.tva_appliquee,
              produit: {
                id: produitData?.id || '',
                nom: produitData?.nom || '',
                code: produitData?.code || '',
                tva_direct: produitData?.tva_direct
              }
            };
          }),
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

  const filteredAndSortedVentes = ventes
    .filter(vente => {
      const matchesDate = !filterDate || vente.date.startsWith(filterDate);
      const matchesMode = !filterModePaiement || vente.mode_paiement === filterModePaiement;
      
      // Recherche avancée avec parsing des critères
      let matchesSearch = true;
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        
        // Recherche par ID de vente
        if (vente.id.toLowerCase().includes(searchLower)) {
          matchesSearch = true;
        }
        // Recherche par nom/code de produit
        else if (vente.produits.some(prod => 
          prod.produit.nom.toLowerCase().includes(searchLower) ||
          prod.produit.code.toLowerCase().includes(searchLower)
        )) {
          matchesSearch = true;
        }
        // Recherche par montant approximatif
        else if (searchLower.includes('montant>=') || searchLower.includes('montant<=')) {
          const minMatch = searchLower.match(/montant>=(\d+(?:\.\d+)?)/);
          const maxMatch = searchLower.match(/montant<=(\d+(?:\.\d+)?)/);
          
          if (minMatch && parseFloat(minMatch[1]) > vente.total) {
            matchesSearch = false;
          } else if (maxMatch && parseFloat(maxMatch[1]) < vente.total) {
            matchesSearch = false;
          } else {
            matchesSearch = true;
          }
        }
        // Recherche par nombre de produits
        else if (searchLower.includes('produits>=')) {
          const match = searchLower.match(/produits>=(\d+)/);
          if (match && vente.produits.length < parseInt(match[1])) {
            matchesSearch = false;
          } else {
            matchesSearch = true;
          }
        }
        // Recherche par montant exact ou approximatif
        else if (!isNaN(parseFloat(searchTerm))) {
          const searchAmount = parseFloat(searchTerm);
          const tolerance = 0.5; // Tolérance de ±0.50€
          if (Math.abs(vente.total - searchAmount) <= tolerance) {
            matchesSearch = true;
          } else {
            matchesSearch = false;
          }
        }
        // Recherche par texte libre
        else {
          matchesSearch = vente.produits.some(prod => 
            prod.produit.nom.toLowerCase().includes(searchLower) ||
            prod.produit.code.toLowerCase().includes(searchLower)
          );
        }
      }
      
      return matchesDate && matchesMode && matchesSearch;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'total':
          comparison = a.total - b.total;
          break;
        case 'mode':
          comparison = a.mode_paiement.localeCompare(b.mode_paiement);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  // Ventes à afficher (pagination)
  const displayedVentes = filteredAndSortedVentes.slice(0, displayedCount);

  // Vérifier s'il y a plus de ventes à afficher
  const hasMoreVentes = displayedCount < filteredAndSortedVentes.length;

  // Fonction pour afficher plus de ventes
  const handleShowMore = () => {
    setDisplayedCount(prev => Math.min(prev + 20, filteredAndSortedVentes.length));
  };

  // Réinitialiser la pagination quand les filtres changent
  useEffect(() => {
    setDisplayedCount(10);
  }, [filterDate, filterModePaiement, searchTerm, sortBy, sortOrder]);

  const totalVentes = filteredAndSortedVentes.reduce((sum, vente) => sum + vente.total, 0);
  const totalTransactions = filteredAndSortedVentes.length;
  const moyenneTransaction = totalTransactions > 0 ? totalVentes / totalTransactions : 0;

  const clearFilters = () => {
    setFilterDate('');
    setFilterModePaiement('');
    setSearchTerm('');
    setExpandedVente(null);
    setDisplayedCount(10); // Réinitialiser la pagination
  };

  const toggleVenteExpansion = (venteId: string) => {
    setExpandedVente(expandedVente === venteId ? null : venteId);
  };

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Chargement de l'historique...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Erreur de chargement</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchVentes}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Réessayer
          </button>
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
            Historique des Ventes
          </h1>
          <p className="text-gray-600 text-lg">
            Consultez l'historique complet de vos transactions
          </p>
        </div>

        {/* Navigation */}
        <div className="max-w-4xl mx-auto mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <Link 
              href="/ventes" 
              className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-200 transform hover:scale-105"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Nouvelle vente
            </Link>
            
            <div className="text-sm text-gray-600">
              Affichage de {displayedVentes.length} sur {totalTransactions} transaction{totalTransactions > 1 ? 's' : ''} trouvée{totalTransactions > 1 ? 's' : ''}
              {hasMoreVentes && (
                <span className="text-blue-600 font-medium ml-2">
                  +{filteredAndSortedVentes.length - displayedVentes.length} autres disponibles
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Statistiques */}
        <div className="max-w-6xl mx-auto mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4">
                <div className="flex items-center">
                  <svg className="w-8 h-8 text-white mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Total des Ventes</h3>
                    <p className="text-2xl font-bold text-white">{totalVentes.toFixed(2)} €</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
                <div className="flex items-center">
                  <svg className="w-8 h-8 text-white mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Transactions</h3>
                    <p className="text-2xl font-bold text-white">{totalTransactions}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-4">
                <div className="flex items-center">
                  <svg className="w-8 h-8 text-white mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Moyenne</h3>
                    <p className="text-2xl font-bold text-white">{moyenneTransaction.toFixed(2)} €</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filtres et recherche améliorés */}
        <div className="max-w-6xl mx-auto mb-8">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Recherche et Filtres Avancés
              </h2>
            </div>
            
            <div className="p-8 space-y-6">
              {/* Première ligne de filtres */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
                    <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Recherche globale
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Rechercher par ID vente, nom produit, code produit, montant..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-lg"
                    />
                    <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Recherchez par ID vente, nom/code produit, ou montant approximatif
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
                    <svg className="w-4 h-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Date
                  </label>
                  <input
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
                    <svg className="w-4 h-4 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    Mode de paiement
                  </label>
                  <select
                    value={filterModePaiement}
                    onChange={(e) => setFilterModePaiement(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                  >
                    <option value="">Tous les modes</option>
                    <option value="especes">Espèces</option>
                    <option value="carte">Carte</option>
                    <option value="cheque">Chèque</option>
                  </select>
                </div>
              </div>

              {/* Deuxième ligne - Filtres avancés */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  Filtres avancés
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Montant minimum</label>
                    <div className="relative">
                      <input
                        type="number"
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value) {
                            // Ajouter un filtre par montant minimum
                            setSearchTerm(prev => {
                              const withoutAmount = prev.replace(/montant[>=]\d+(\.\d+)?/g, '').trim();
                              return `${withoutAmount} montant>=${value}`.trim();
                            });
                          }
                        }}
                      />
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">€</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Montant maximum</label>
                    <div className="relative">
                      <input
                        type="number"
                        placeholder="9999.99"
                        step="0.01"
                        min="0"
                        className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200"
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value) {
                            // Ajouter un filtre par montant maximum
                            setSearchTerm(prev => {
                              const withoutAmount = prev.replace(/montant[<=]\d+(\.\d+)?/g, '').trim();
                              return `${withoutAmount} montant<=${value}`.trim();
                            });
                          }
                        }}
                      />
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">€</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nombre de produits</label>
                    <select
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value) {
                          setSearchTerm(prev => {
                            const withoutProducts = prev.replace(/produits[>=]\d+/g, '').trim();
                            return `${withoutProducts} produits>=${value}`.trim();
                          });
                        }
                      }}
                    >
                      <option value="">Tous</option>
                      <option value="1">1 produit</option>
                      <option value="2">2+ produits</option>
                      <option value="5">5+ produits</option>
                      <option value="10">10+ produits</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section de tri et contrôles */}
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="flex items-center space-x-3">
                    <label className="text-sm font-semibold text-gray-700 flex items-center">
                      <svg className="w-4 h-4 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h18M7 8h8M7 12h6M7 16h4" />
                      </svg>
                      Trier par:
                    </label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as 'date' | 'total' | 'mode')}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                    >
                      <option value="date">Date</option>
                      <option value="total">Montant</option>
                      <option value="mode">Mode de paiement</option>
                    </select>
                    
                    <button
                      onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                      className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                      title={sortOrder === 'asc' ? 'Tri croissant' : 'Tri décroissant'}
                    >
                      <svg className={`w-5 h-5 transform transition-transform ${sortOrder === 'asc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  {/* Filtres actifs */}
                  {(filterDate || filterModePaiement || searchTerm) && (
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="text-gray-600 font-medium">Filtres actifs:</span>
                      {filterDate && (
                        <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                          {filterDate}
                          <button
                            onClick={() => setFilterDate('')}
                            className="ml-1 text-green-600 hover:text-green-800"
                          >
                            ×
                          </button>
                        </span>
                      )}
                      {filterModePaiement && (
                        <span className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                          {filterModePaiement}
                          <button
                            onClick={() => setFilterModePaiement('')}
                            className="ml-1 text-purple-600 hover:text-purple-800"
                          >
                            ×
                          </button>
                        </span>
                      )}
                      {searchTerm && (
                        <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                          {searchTerm.length > 20 ? searchTerm.substring(0, 20) + '...' : searchTerm}
                          <button
                            onClick={() => setSearchTerm('')}
                            className="ml-1 text-blue-600 hover:text-blue-800"
                          >
                            ×
                          </button>
                        </span>
                      )}
                    </div>
                  )}

                  <button
                    onClick={clearFilters}
                    className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Effacer tous les filtres
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Liste des ventes */}
        <div className="max-w-6xl mx-auto">
          {filteredAndSortedVentes.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-12 text-center">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-600 mb-2">Aucune vente trouvée</h3>
              <p className="text-gray-500">Ajustez vos filtres ou créez votre première vente</p>
            </div>
          ) : (
            <div className="space-y-6">
              {displayedVentes.map((vente) => (
                <div key={vente.id} className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            Vente #{vente.id.slice(0, 8)}
                          </h3>
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                            {getModePaiementIcon(vente.mode_paiement)}
                            <span className="ml-1 capitalize">{vente.mode_paiement}</span>
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-1">
                          {new Date(vente.date).toLocaleDateString('fr-FR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        
                        <p className="text-sm text-gray-600">
                          {vente.produits.length} produit{vente.produits.length > 1 ? 's' : ''} vendu{vente.produits.length > 1 ? 's' : ''}
                        </p>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600">
                          {vente.total.toFixed(2)} €
                        </p>
                        <button
                          onClick={() => toggleVenteExpansion(vente.id)}
                          className="mt-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                        >
                          {expandedVente === vente.id ? 'Masquer' : 'Voir détails'}
                        </button>
                      </div>
                    </div>

                    {/* Produits de la vente (expandable) */}
                    {expandedVente === vente.id && (
                      <div className="border-t pt-4 mt-4 animate-fadeIn">
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                          <svg className="w-4 h-4 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                          Produits vendus
                        </h4>
                        
                        <div className="space-y-3">
                          {vente.produits.map((produit) => (
                            <div key={produit.id} className="bg-gray-50 rounded-lg p-3">
                              <div className="flex justify-between items-center">
                                <div className="flex-1">
                                  <div className="font-medium text-gray-900">{produit.produit.nom}</div>
                                  <div className="text-sm text-gray-600">{produit.produit.code}</div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    TVA: {produit.tva_appliquee || produit.produit.tva_direct || 20.00}%
                                  </div>
                                </div>
                                
                                <div className="text-right">
                                  <div className="text-sm text-gray-600">
                                    {produit.quantite} × {produit.prix_unitaire.toFixed(2)} €
                                  </div>
                                  <div className="font-semibold text-gray-900">
                                    {(produit.quantite * produit.prix_unitaire).toFixed(2)} €
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {/* Bouton "Afficher plus" et informations de pagination */}
              {hasMoreVentes && (
                <div className="mt-6 text-center">
                  <button
                    onClick={handleShowMore}
                    className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    Afficher 20 ventes de plus
                  </button>
                  <p className="text-sm text-gray-600 mt-2">
                    Affichage de {displayedVentes.length} sur {filteredAndSortedVentes.length} ventes
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    {Math.min(20, filteredAndSortedVentes.length - displayedVentes.length)} ventes restantes
                  </p>
                </div>
              )}
              
              {/* Message quand toutes les ventes sont affichées */}
              {!hasMoreVentes && filteredAndSortedVentes.length > 0 && (
                <div className="mt-6 text-center">
                  <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-lg">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Toutes les ventes sont affichées ({filteredAndSortedVentes.length} ventes)
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
