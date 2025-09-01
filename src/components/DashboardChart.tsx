"use client";

import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useHistoriqueStock } from '../hooks/useHistoriqueStock';
import { useProduits } from '../hooks/useProduits';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface MouvementTemporel {
  date: string;
  ajouts: number;
  ventes: number;
  retraits: number;
  stockTotal: number;
}



interface DashboardChartProps {
  onProduitSelect?: (produitId: string) => void;
}

export default function DashboardChart({ onProduitSelect }: DashboardChartProps) {
  const { historique, refreshHistorique } = useHistoriqueStock();
  const { produits } = useProduits();
  const [selectedProduitId, setSelectedProduitId] = useState<string>('all');
  const [mouvementsTemporels, setMouvementsTemporels] = useState<MouvementTemporel[]>([]);
  const [displayedCount, setDisplayedCount] = useState(10);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'global' | 'produit'>('global');

  useEffect(() => {
    if (historique.length >= 0 && produits.length > 0) {
      if (viewMode === 'global') {
        // Mode global : mouvements par date
        const mouvementsParDate = new Map<string, MouvementTemporel>();

        // Initialiser toutes les dates avec des valeurs à 0
        historique.forEach(mouvement => {
          const date = new Date(mouvement.created_at).toLocaleDateString('fr-FR');
          if (!mouvementsParDate.has(date)) {
            mouvementsParDate.set(date, {
              date,
              ajouts: 0,
              ventes: 0,
              retraits: 0,
              stockTotal: 0
            });
          }
        });

        // Calculer les mouvements par date
        historique.forEach(mouvement => {
          const date = new Date(mouvement.created_at).toLocaleDateString('fr-FR');
          const dateData = mouvementsParDate.get(date);
          
          if (dateData) {
            switch (mouvement.type_mouvement) {
              case 'AJOUT':
                dateData.ajouts += mouvement.quantite;
                break;
              case 'VENTE':
                dateData.ventes += mouvement.quantite;
                break;
              case 'RETRAIT_MANUEL':
                dateData.retraits += mouvement.quantite;
                break;
            }
          }
        });

        // Calculer le stock total par date (approximatif)
        // Utiliser la somme des quantités et calculer l'évolution
        const stockActuelTotal = produits.reduce((total, p) => total + p.quantity, 0);
        
        // Calculer l'évolution du stock par date
        let stockCumulatif = stockActuelTotal;
        
        const resultat = Array.from(mouvementsParDate.entries())
          .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
          .map(([date, data]) => {
            // Pour chaque date, soustraire les mouvements de cette date
            const impactDate = data.ajouts - data.ventes - data.retraits;
            stockCumulatif = stockCumulatif - impactDate;
            
            return {
              ...data,
              stockTotal: Math.max(0, stockCumulatif)
            };
          });

        setMouvementsTemporels(resultat);
      } else {
        // Mode produit : mouvements pour un produit spécifique
        if (selectedProduitId !== 'all') {
          const mouvementsParDate = new Map<string, MouvementTemporel>();
          
          // Filtrer l'historique pour le produit sélectionné
          const historiqueProduit = historique.filter(m => m.produit_id === selectedProduitId);
          
          historiqueProduit.forEach(mouvement => {
            const date = new Date(mouvement.created_at).toLocaleDateString('fr-FR');
            if (!mouvementsParDate.has(date)) {
              mouvementsParDate.set(date, {
                date,
                ajouts: 0,
                ventes: 0,
                retraits: 0,
                stockTotal: 0
              });
            }
          });

          historiqueProduit.forEach(mouvement => {
            const date = new Date(mouvement.created_at).toLocaleDateString('fr-FR');
            const dateData = mouvementsParDate.get(date);
            
            if (dateData) {
              switch (mouvement.type_mouvement) {
                case 'AJOUT':
                  dateData.ajouts += mouvement.quantite;
                  break;
                case 'VENTE':
                  dateData.ventes += mouvement.quantite;
                  break;
                case 'RETRAIT_MANUEL':
                  dateData.retraits += mouvement.quantite;
                  break;
              }
            }
          });

          // Calculer le stock par date pour ce produit
          const produit = produits.find(p => p.id === selectedProduitId);
          if (produit) {
            // Pour un produit individuel, utiliser sa quantité
            let stockCumulatif = produit.quantity;
            
            const resultat = Array.from(mouvementsParDate.entries())
              .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
              .map(([date, data]) => {
                // Pour chaque date, soustraire les mouvements de cette date
                const impactDate = data.ajouts - data.ventes - data.retraits;
                stockCumulatif = stockCumulatif - impactDate;
                
                return {
                  ...data,
                  stockTotal: Math.max(0, stockCumulatif)
                };
              });

            setMouvementsTemporels(resultat);
          }
        }
      }


      setLoading(false);
    }
  }, [historique, produits, selectedProduitId, viewMode]);

  // Réinitialiser la pagination quand les données changent
  useEffect(() => {
    setDisplayedCount(10);
  }, [mouvementsTemporels, selectedProduitId, viewMode]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-xl border border-gray-100 p-8">
        <div className="animate-pulse">
          <div className="flex justify-between items-center mb-8">
            <div>
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
            <div className="h-12 bg-gray-200 rounded-lg w-32"></div>
          </div>
          
          <div className="mb-8 p-6 bg-gray-100 rounded-xl">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-12 bg-gray-200 rounded-lg mb-4"></div>
            <div className="flex gap-4">
              <div className="h-12 bg-gray-200 rounded-lg w-32"></div>
              <div className="h-12 bg-gray-200 rounded-lg w-32"></div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-gray-100 p-6 rounded-xl">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              </div>
            ))}
          </div>
          
          <div className="bg-gray-100 rounded-xl p-6">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const chartData = {
    labels: mouvementsTemporels.map(m => m.date).reverse(),
    datasets: [
      {
        label: 'Ajouts',
        data: mouvementsTemporels.map(m => m.ajouts).reverse(),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderWidth: 2,
        fill: false,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: 'Ventes',
        data: mouvementsTemporels.map(m => m.ventes).reverse(),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        fill: false,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: 'Retraits',
        data: mouvementsTemporels.map(m => m.retraits).reverse(),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 2,
        fill: false,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: 'Stock Total',
        data: mouvementsTemporels.map(m => m.stockTotal).reverse(),
        borderColor: 'rgb(168, 85, 247)',
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointRadius: 5,
        pointHoverRadius: 7,
        yAxisID: 'y',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            weight: '600'
          }
        }
      },
      title: {
        display: true,
        text: viewMode === 'global' 
          ? 'Évolution des Mouvements de Stock (Vue Globale)'
          : `Évolution pour ${produits.find(p => p.id === selectedProduitId)?.nom || 'Produit'} (${produits.find(p => p.id === selectedProduitId)?.code || 'Code'})`,
        font: {
          size: 16,
          weight: 'bold' as const,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        padding: 12,
        titleFont: {
          size: 14,
          weight: 'bold'
        },
        bodyFont: {
          size: 13
        },
        callbacks: {
          title: function(context: any) {
            return `Date: ${context[0].label}`;
          },
          afterBody: function(context: any) {
            const dateIndex = context[0].dataIndex;
            // Inverser l'index car les données sont maintenant inversées
            const reversedIndex = mouvementsTemporels.length - 1 - dateIndex;
            const dateData = mouvementsTemporels[reversedIndex];
            return [
              `Stock total: ${dateData.stockTotal.toLocaleString()}`,
              `Ajouts: ${dateData.ajouts.toLocaleString()}`,
              `Ventes: ${dateData.ventes.toLocaleString()}`,
              `Retraits: ${dateData.retraits.toLocaleString()}`,
            ];
          }
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Date',
          font: {
            size: 12,
            weight: '600'
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
          drawBorder: false
        },
        ticks: {
          maxRotation: 45,
          minRotation: 0,
          font: {
            size: 11
          }
        },
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Quantité',
          font: {
            size: 12,
            weight: '600'
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
          drawBorder: false
        },
        ticks: {
          font: {
            size: 11
          },
          callback: function(value: any) {
            return value.toLocaleString();
          }
        },
        beginAtZero: true,
      },
    },
    elements: {
      point: {
        hoverRadius: 8,
        hoverBorderWidth: 3
      },
      line: {
        tension: 0.4
      }
    },
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart' as const
    }
  };

  // Calculer les totaux pour les statistiques
  const totalAjouts = mouvementsTemporels.reduce((sum, m) => sum + m.ajouts, 0);
  const totalVentes = mouvementsTemporels.reduce((sum, m) => sum + m.ventes, 0);
  const totalRetraits = mouvementsTemporels.reduce((sum, m) => sum + m.retraits, 0);
  
  // Vérifier que tous les stocks initiaux sont bien inclus dans les ajouts
  const ajoutsInitiaux = produits.reduce((total, produit) => {
    // Vérifier si le produit a été créé avec un stock initial
    const produitCree = historique.find(m => 
      m.produit_id === produit.id && 
      m.type_mouvement === 'AJOUT' && 
      m.note?.includes('Création du nouveau produit')
    );
    return total + (produitCree ? produitCree.quantite : 0);
  }, 0);
  
  // Les stocks initiaux sont déjà inclus dans totalAjouts, mais on peut vérifier
  const totalAjoutsComplet = totalAjouts; // Les ajouts incluent déjà les stocks initiaux
  
  // Calculer le stock actuel basé sur le produit sélectionné ou la somme des quantités
  const stockActuel = selectedProduitId !== 'all' 
    ? produits.find(p => p.id === selectedProduitId)?.quantity || 0
    : produits.reduce((total, p) => total + p.quantity, 0);

  const handleProduitChange = (produitId: string) => {
    setSelectedProduitId(produitId);
    if (produitId === 'all') {
      setViewMode('global');
      onProduitSelect?.('');
    } else {
      setViewMode('produit');
      onProduitSelect?.(produitId);
    }
  };

  // Fonctions de pagination
  const handleShowMore = () => {
    setDisplayedCount(prev => Math.min(prev + 20, mouvementsTemporels.length));
  };





  // Données paginées pour le tableau
  const displayedMouvements = mouvementsTemporels.slice(0, displayedCount);
  const hasMoreMouvements = displayedCount < mouvementsTemporels.length;

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Évolution des Mouvements de Stock</h2>
          <p className="text-gray-600 text-sm">Suivez l'évolution de votre inventaire en temps réel</p>
        </div>
        <button
          onClick={() => {
            setLoading(true);
            refreshHistorique();
            setTimeout(() => setLoading(false), 1000);
          }}
          className="btn-modern bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-200 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          <span className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Rafraîchir
          </span>
        </button>
      </div>
      
      {/* Contrôles de sélection */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-end">
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Sélectionner un produit
            </label>
            <select
              value={selectedProduitId}
              onChange={(e) => handleProduitChange(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm"
            >
              <option value="all">Vue Globale (Tous les produits)</option>
              {produits.map(produit => (
                <option key={produit.id} value={produit.id}>
                  {produit.nom} ({produit.code}) - Stock: {produit.quantity}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => {
                setViewMode('global');
                setSelectedProduitId('all');
              }}
              className={`px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                viewMode === 'global'
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200 hover:border-blue-300'
              }`}
            >
              Vue Globale
            </button>
            <button
              onClick={() => {
                if (selectedProduitId !== 'all') {
                  setViewMode('produit');
                }
              }}
              className={`px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                viewMode === 'produit'
                  ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200 hover:border-green-300'
              }`}
              disabled={selectedProduitId === 'all'}
            >
              Vue Produit
            </button>
          </div>
        </div>
      </div>
      
      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-green-50 p-4 rounded-lg border border-green-200 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="mb-3">
            <div className="text-green-800 font-semibold text-sm">Total Ajouts</div>
          </div>
          <div className="text-3xl font-bold text-green-600">{totalAjoutsComplet.toLocaleString()}</div>
          <div className="text-green-600 text-xs mt-1">Mouvements d'ajout (incluant stocks initiaux)</div>
        </div>
        
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="mb-3">
            <div className="text-blue-800 font-semibold text-sm">Total Ventes</div>
          </div>
          <div className="text-3xl font-bold text-blue-600">{totalVentes.toLocaleString()}</div>
          <div className="text-blue-600 text-xs mt-1">Mouvements de vente</div>
        </div>
        
        <div className="bg-red-50 p-4 rounded-lg border border-red-200 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="mb-3">
            <div className="text-red-800 font-semibold text-sm">Total Retraits</div>
          </div>
          <div className="text-3xl font-bold text-red-600">{totalRetraits.toLocaleString()}</div>
          <div className="text-red-600 text-xs mt-1">Mouvements de retrait</div>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="mb-3">
            <div className="text-purple-800 font-semibold text-sm">
              {selectedProduitId !== 'all' ? 'Stock Produit' : 'Stock Total'}
            </div>
          </div>
          <div className="text-3xl font-bold text-purple-600">{stockActuel.toLocaleString()}</div>
          <div className="text-purple-600 text-xs mt-1">
            {selectedProduitId !== 'all' ? 'Quantité disponible' : 'Quantité totale'}
          </div>
        </div>
      </div>

      {/* Graphique en ligne */}
      <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg border border-gray-200 p-6 shadow-sm">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-800 mb-2">Évolution temporelle</h3>
          <p className="text-gray-600 text-sm">Visualisez les tendances de vos mouvements de stock dans le temps</p>
        </div>
        <div className="h-96 bg-white rounded-lg p-4 border border-gray-100">
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>

      {/* Tableau détaillé par date */}
      <div className="mt-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Détail par Date</h3>
            <p className="text-sm text-gray-600 mt-1">
              {mouvementsTemporels.length} date{mouvementsTemporels.length > 1 ? 's' : ''} de mouvements de stock
            </p>
          </div>
          {mouvementsTemporels.length > 10 && (
            <div className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              Pagination activée
            </div>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Ajouts</th>
                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Ventes</th>
                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Retraits</th>
                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Stock Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {displayedMouvements.map((mouvement, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium text-gray-900">
                    {mouvement.date}
                  </td>
                  <td className="px-4 py-2 text-center">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      {mouvement.ajouts}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-center">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {mouvement.ventes}
                    </span>
                  </td>
                  <td className="px-2 text-center">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                      {mouvement.retraits}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-center">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      mouvement.stockTotal > 0 ? 'bg-purple-100 text-purple-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {mouvement.stockTotal}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Contrôles de pagination */}
        <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-sm text-gray-600">
            Affichage de <span className="font-semibold">{displayedMouvements.length}</span> sur <span className="font-semibold">{mouvementsTemporels.length}</span> dates
            {hasMoreMouvements && (
              <span className="ml-2 text-blue-600">+{mouvementsTemporels.length - displayedCount} autres disponibles</span>
            )}
          </div>
          
          {hasMoreMouvements ? (
            <button
              onClick={handleShowMore}
              className="inline-flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-200 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              Afficher plus
            </button>
          ) : (
            <div className="text-sm text-gray-500 font-medium">
              Toutes les dates sont affichées
            </div>
          )}
        </div>
      </div>


    </div>
  );
}
