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
  suppressions: number;
  stockTotal: number;
}

interface ProduitMouvements {
  nom: string;
  code: string;
  ajouts: number;
  ventes: number;
  retraits: number;
  suppressions: number;
  stockActuel: number;
}

interface DashboardChartProps {
  onProduitSelect?: (produitId: string) => void;
}

export default function DashboardChart({ onProduitSelect }: DashboardChartProps) {
  const { historique } = useHistoriqueStock();
  const { produits } = useProduits();
  const [selectedProduitId, setSelectedProduitId] = useState<string>('all');
  const [mouvementsTemporels, setMouvementsTemporels] = useState<MouvementTemporel[]>([]);
  const [produitsMouvements, setProduitsMouvements] = useState<ProduitMouvements[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'global' | 'produit'>('global');

  useEffect(() => {
    if (historique.length > 0 && produits.length > 0) {
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
              suppressions: 0,
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
              case 'SUPPRESSION':
                dateData.suppressions += mouvement.quantite;
                break;
            }
          }
        });

        // Calculer le stock total par date (approximatif)
        const stockInitial = produits.reduce((total, p) => total + p.quantity, 0);
        let stockCumulatif = stockInitial;
        
        const resultat = Array.from(mouvementsParDate.entries())
          .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
          .map(([date, data]) => {
            const stockPourDate = stockCumulatif + data.ajouts - data.ventes - data.retraits - data.suppressions;
            stockCumulatif = stockPourDate;
            
            return {
              ...data,
              stockTotal: Math.max(0, stockPourDate)
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
                suppressions: 0,
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
                case 'SUPPRESSION':
                  dateData.suppressions += mouvement.quantite;
                  break;
              }
            }
          });

          // Calculer le stock par date pour ce produit
          const produit = produits.find(p => p.id === selectedProduitId);
          if (produit) {
            let stockCumulatif = produit.quantity;
            
            const resultat = Array.from(mouvementsParDate.entries())
              .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
              .map(([date, data]) => {
                const stockPourDate = stockCumulatif + data.ajouts - data.ventes - data.retraits - data.suppressions;
                stockCumulatif = stockPourDate;
                
                return {
                  ...data,
                  stockTotal: Math.max(0, stockPourDate)
                };
              });

            setMouvementsTemporels(resultat);
          }
        }
      }

      // Toujours calculer les statistiques par produit pour la vue d'ensemble
      const mouvementsParProduit = new Map<string, ProduitMouvements>();

      produits.forEach(produit => {
        mouvementsParProduit.set(produit.id, {
          nom: produit.nom,
          code: produit.code,
          ajouts: 0,
          ventes: 0,
          retraits: 0,
          suppressions: 0,
          stockActuel: produit.quantity
        });
      });

      historique.forEach(mouvement => {
        if (mouvement.produit_id && mouvement.produit) {
          const produit = mouvementsParProduit.get(mouvement.produit_id);
          if (produit) {
            switch (mouvement.type_mouvement) {
              case 'AJOUT':
                produit.ajouts += mouvement.quantite;
                break;
              case 'VENTE':
                produit.ventes += mouvement.quantite;
                break;
              case 'RETRAIT_MANUEL':
                produit.retraits += mouvement.quantite;
                break;
              case 'SUPPRESSION':
                produit.suppressions += mouvement.quantite;
                break;
            }
          }
        }
      });

      const resultatProduits = Array.from(mouvementsParProduit.values())
        .sort((a, b) => b.stockActuel - a.stockActuel)
        .slice(0, 10);

      setProduitsMouvements(resultatProduits);
      setLoading(false);
    }
  }, [historique, produits, selectedProduitId, viewMode]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const chartData = {
    labels: mouvementsTemporels.map(m => m.date),
    datasets: [
      {
        label: 'Ajouts',
        data: mouvementsTemporels.map(m => m.ajouts),
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
        data: mouvementsTemporels.map(m => m.ventes),
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
        data: mouvementsTemporels.map(m => m.retraits),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 2,
        fill: false,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: 'Suppressions',
        data: mouvementsTemporels.map(m => m.suppressions),
        borderColor: 'rgb(156, 163, 175)',
        backgroundColor: 'rgba(156, 163, 175, 0.1)',
        borderWidth: 2,
        fill: false,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: 'Stock Total',
        data: mouvementsTemporels.map(m => m.stockTotal),
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
      },
      title: {
        display: true,
        text: viewMode === 'global' 
          ? 'Évolution des Mouvements de Stock dans le Temps (Vue Globale)'
          : `Évolution des Mouvements de Stock pour ${produits.find(p => p.id === selectedProduitId)?.nom || 'Produit'} (${produits.find(p => p.id === selectedProduitId)?.code || 'Code'})`,
        font: {
          size: 16,
          weight: 'bold' as const,
        },
      },
      tooltip: {
        callbacks: {
          title: function(context: any) {
            return `Date: ${context[0].label}`;
          },
          afterBody: function(context: any) {
            const dateIndex = context[0].dataIndex;
            const dateData = mouvementsTemporels[dateIndex];
            return [
              `Stock total: ${dateData.stockTotal}`,
              `Ajouts: ${dateData.ajouts}`,
              `Ventes: ${dateData.ventes}`,
              `Retraits: ${dateData.retraits}`,
              `Suppressions: ${dateData.suppressions}`,
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
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45,
        },
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Quantité',
        },
        beginAtZero: true,
      },
    },
  };

  // Calculer les totaux pour les statistiques
  const totalAjouts = mouvementsTemporels.reduce((sum, m) => sum + m.ajouts, 0);
  const totalVentes = mouvementsTemporels.reduce((sum, m) => sum + m.ventes, 0);
  const totalRetraits = mouvementsTemporels.reduce((sum, m) => sum + m.retraits, 0);
  const totalSuppressions = mouvementsTemporels.reduce((sum, m) => sum + m.suppressions, 0);
  const stockActuel = mouvementsTemporels.length > 0 ? mouvementsTemporels[mouvementsTemporels.length - 1].stockTotal : 0;

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

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-bold mb-4">Évolution des Mouvements de Stock</h2>
      
      {/* Contrôles de sélection */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sélectionner un produit
            </label>
            <select
              value={selectedProduitId}
              onChange={(e) => handleProduitChange(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Vue Globale (Tous les produits)</option>
              {produits.map(produit => (
                <option key={produit.id} value={produit.id}>
                  {produit.nom} ({produit.code}) - Stock: {produit.quantity}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => {
                setViewMode('global');
                setSelectedProduitId('all');
              }}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                viewMode === 'global'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
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
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                viewMode === 'produit'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              disabled={selectedProduitId === 'all'}
            >
              Vue Produit
            </button>
          </div>
        </div>
      </div>
      
      {/* Statistiques rapides */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-green-50 p-3 rounded-lg">
          <div className="text-green-800 font-semibold text-sm">Total Ajouts</div>
          <div className="text-2xl font-bold text-green-600">{totalAjouts}</div>
        </div>
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="text-blue-800 font-semibold text-sm">Total Ventes</div>
          <div className="text-2xl font-bold text-blue-600">{totalVentes}</div>
        </div>
        <div className="bg-red-50 p-3 rounded-lg">
          <div className="text-red-800 font-semibold text-sm">Total Retraits</div>
          <div className="text-2xl font-bold text-red-600">{totalRetraits}</div>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="text-gray-800 font-semibold text-sm">Total Suppressions</div>
          <div className="text-2xl font-bold text-gray-600">{totalSuppressions}</div>
        </div>
        <div className="bg-purple-50 p-3 rounded-lg">
          <div className="text-purple-800 font-semibold text-sm">Stock Actuel</div>
          <div className="text-2xl font-bold text-purple-600">{stockActuel}</div>
        </div>
      </div>

      {/* Graphique en ligne */}
      <div className="h-96">
        <Line data={chartData} options={chartOptions} />
      </div>

      {/* Tableau détaillé par date */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-3">Détail par Date</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Ajouts</th>
                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Ventes</th>
                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Retraits</th>
                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Suppressions</th>
                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Stock Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {mouvementsTemporels.map((mouvement, index) => (
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
                  <td className="px-4 py-2 text-center">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                      {mouvement.retraits}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-center">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                      {mouvement.suppressions}
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
      </div>

      {/* Vue d'ensemble des produits (si vue globale) */}
      {viewMode === 'global' && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-3">Vue d'ensemble des Produits</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Produit</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Ajouts</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Ventes</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Retraits</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Suppressions</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Stock Actuel</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {produitsMouvements.map((produit, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-2">
                      <div>
                        <div className="font-medium text-gray-900">{produit.nom}</div>
                        <div className="text-sm text-gray-500">{produit.code}</div>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-center">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        {produit.ajouts}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-center">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {produit.ventes}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-center">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                        {produit.retraits}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-center">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                        {produit.suppressions}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-center">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        produit.stockActuel > 0 ? 'bg-purple-100 text-purple-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {produit.stockActuel}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
