"use client";

import React, { useEffect, useState, useMemo } from 'react';
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

interface Point {
  x: number; // Date en jours depuis le début
  y: number; // Stock à cette date
}

interface PredictionResult {
  slope: number;
  intercept: number;
  rSquared: number;
  predictedValues: Point[];
  futurePrediction: number;
  daysUntilStockout: number | null;
}

interface ProduitPredictionChartProps {
  selectedProduitId: string;
}

export default function ProduitPredictionChart({ selectedProduitId }: ProduitPredictionChartProps) {
  const { historique } = useHistoriqueStock();
  const { produits } = useProduits();
  const [predictionDays, setPredictionDays] = useState<number>(30);
  const [loading, setLoading] = useState(false);

  // Calculer la méthode des moindres carrés
  const calculateLeastSquares = (points: Point[]): PredictionResult => {
    if (points.length < 2) {
      return {
        slope: 0,
        intercept: 0,
        rSquared: 0,
        predictedValues: [],
        futurePrediction: 0,
        daysUntilStockout: null
      };
    }

    const n = points.length;
    const sumX = points.reduce((sum, p) => sum + p.x, 0);
    const sumY = points.reduce((sum, p) => sum + p.y, 0);
    const sumXY = points.reduce((sum, p) => sum + p.x * p.y, 0);
    const sumXX = points.reduce((sum, p) => sum + p.x * p.x, 0);

    // Calculer la pente et l'intercept
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calculer R² (coefficient de détermination)
    const meanY = sumY / n;
    const ssRes = points.reduce((sum, p) => {
      const predicted = slope * p.x + intercept;
      return sum + Math.pow(p.y - predicted, 2);
    }, 0);
    const ssTot = points.reduce((sum, p) => sum + Math.pow(p.y - meanY, 2), 0);
    const rSquared = ssTot > 0 ? 1 - (ssRes / ssTot) : 0;

    // Générer les valeurs prédites
    const maxX = Math.max(...points.map(p => p.x));
    const predictedValues: Point[] = [];
    
    for (let x = 0; x <= maxX + predictionDays; x++) {
      predictedValues.push({
        x,
        y: slope * x + intercept
      });
    }

    // Prédiction future
    const futurePrediction = slope * (maxX + predictionDays) + intercept;

    // Calculer quand le stock sera épuisé
    let daysUntilStockout = null;
    if (slope < 0) { // Si la tendance est décroissante
      daysUntilStockout = Math.ceil(-intercept / slope);
    }

    return {
      slope,
      intercept,
      rSquared,
      predictedValues,
      futurePrediction,
      daysUntilStockout
    };
  };

  // Préparer les données pour un produit spécifique
  const produitData = useMemo(() => {
    if (!selectedProduitId) return null;

    const produit = produits.find(p => p.id === selectedProduitId);
    if (!produit) return null;

    // Filtrer l'historique pour ce produit
    const historiqueProduit = historique.filter(m => m.produit_id === selectedProduitId);
    
    if (historiqueProduit.length === 0) return null;

    // Créer un map des dates et stocks
    const stockParDate = new Map<string, number>();
    
    // Initialiser avec le stock actuel
    stockParDate.set(new Date().toISOString().split('T')[0], produit.quantity);

    // Calculer le stock à chaque date
    let stockCumulatif = produit.quantity;
    const dates = historiqueProduit
      .map(m => new Date(m.created_at))
      .sort((a, b) => a.getTime() - b.getTime());

    dates.forEach(date => {
      const dateStr = date.toISOString().split('T')[0];
      const mouvements = historiqueProduit.filter(m => 
        new Date(m.created_at).toISOString().split('T')[0] === dateStr
      );

      mouvements.forEach(mouvement => {
        switch (mouvement.type_mouvement) {
          case 'AJOUT':
            stockCumulatif += mouvement.quantite;
            break;
          case 'VENTE':
            stockCumulatif -= mouvement.quantite;
            break;
          case 'RETRAIT_MANUEL':
            stockCumulatif -= mouvement.quantite;
            break;
          case 'SUPPRESSION':
            stockCumulatif -= mouvement.quantite;
            break;
        }
      });

      stockParDate.set(dateStr, Math.max(0, stockCumulatif));
    });

    // Convertir en points pour la régression
    const sortedDates = Array.from(stockParDate.keys()).sort();
    const startDate = new Date(sortedDates[0]);
    
    const points: Point[] = sortedDates.map(dateStr => {
      const date = new Date(dateStr);
      const daysSinceStart = Math.floor((date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      return {
        x: daysSinceStart,
        y: stockParDate.get(dateStr) || 0
      };
    });

    return {
      produit,
      points,
      startDate
    };
  }, [selectedProduitId, produits, historique]);

  // Calculer la prédiction
  const prediction = useMemo(() => {
    if (!produitData) return null;
    return calculateLeastSquares(produitData.points);
  }, [produitData, predictionDays]);

  // Préparer les données du graphique
  const chartData = useMemo(() => {
    if (!produitData || !prediction) return null;

    const labels = prediction.predictedValues.map(p => {
      const date = new Date(produitData.startDate);
      date.setDate(date.getDate() + p.x);
      return date.toLocaleDateString('fr-FR');
    });

    return {
      labels,
      datasets: [
        {
          label: 'Stock Réel',
          data: produitData.points.map(p => p.y),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 3,
          fill: false,
          tension: 0.1,
          pointRadius: 6,
          pointHoverRadius: 8,
        },
        {
          label: 'Tendance Prédite',
          data: prediction.predictedValues.map(p => p.y),
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          borderWidth: 2,
          fill: false,
          tension: 0.1,
          pointRadius: 0,
          borderDash: [5, 5],
        },
        {
          label: 'Zone de Prédiction',
          data: prediction.predictedValues.map(p => p.y),
          borderColor: 'rgba(239, 68, 68, 0.3)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          borderWidth: 1,
          fill: true,
          tension: 0.1,
          pointRadius: 0,
        }
      ],
    };
  }, [produitData, prediction, predictionDays]);

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
        text: produitData 
          ? `Prédiction de Stock pour ${produitData.produit.nom} (${produitData.produit.code})`
          : 'Sélectionnez un produit pour voir la prédiction',
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
            if (prediction) {
              return [
                `Tendance: ${prediction.slope > 0 ? 'Croissante' : 'Décroissante'}`,
                `Pente: ${prediction.slope.toFixed(2)} unités/jour`,
                `Précision: ${(prediction.rSquared * 100).toFixed(1)}%`,
                prediction.daysUntilStockout 
                  ? `Rupture de stock dans ${prediction.daysUntilStockout} jours`
                  : 'Pas de rupture de stock prévue'
              ];
            }
            return [];
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
        title: {
          display: true,
          text: 'Stock',
        },
        beginAtZero: true,
      },
    },
  };

  if (!selectedProduitId) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold mb-4">Prédiction de Stock par Produit</h2>
        <div className="text-center py-8 text-gray-500">
          Sélectionnez un produit dans le graphique principal pour voir sa prédiction
        </div>
      </div>
    );
  }

  if (!produitData || !prediction || !chartData) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold mb-4">Prédiction de Stock par Produit</h2>
        <div className="text-center py-8 text-gray-500">
          Pas assez de données pour calculer la prédiction
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-bold mb-4">Prédiction de Stock par Produit</h2>
      
      {/* Contrôles */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Produit sélectionné
            </label>
            <div className="text-lg font-semibold text-gray-900">
              {produitData.produit.nom} ({produitData.produit.code})
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Jours de prédiction
            </label>
            <input
              type="number"
              value={predictionDays}
              onChange={(e) => setPredictionDays(parseInt(e.target.value) || 30)}
              min="7"
              max="365"
              className="w-20 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Statistiques de prédiction */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="text-blue-800 font-semibold text-sm">Tendance</div>
          <div className="text-lg font-bold text-blue-600">
            {prediction.slope > 0 ? 'Croissante' : 'Décroissante'}
          </div>
        </div>
        <div className="bg-green-50 p-3 rounded-lg">
          <div className="text-green-800 font-semibold text-sm">Pente</div>
          <div className="text-lg font-bold text-green-600">
            {prediction.slope.toFixed(2)} unités/jour
          </div>
        </div>
        <div className="bg-purple-50 p-3 rounded-lg">
          <div className="text-purple-800 font-semibold text-sm">Précision</div>
          <div className="text-lg font-bold text-purple-600">
            {(prediction.rSquared * 100).toFixed(1)}%
          </div>
        </div>
        <div className="bg-red-50 p-3 rounded-lg">
          <div className="text-red-800 font-semibold text-sm">Rupture de Stock</div>
          <div className="text-lg font-bold text-red-600">
            {prediction.daysUntilStockout 
              ? `Dans ${prediction.daysUntilStockout} jours`
              : 'Non prévue'
            }
          </div>
        </div>
      </div>

      {/* Graphique de prédiction */}
      <div className="h-96">
        <Line data={chartData} options={chartOptions} />
      </div>

      {/* Détails de la prédiction */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-3">Détails de la Prédiction</h3>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Équation de la Tendance</h4>
              <p className="text-sm text-gray-600">
                Stock = {prediction.slope.toFixed(2)} × Jours + {prediction.intercept.toFixed(2)}
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Interprétation</h4>
              <p className="text-sm text-gray-600">
                {prediction.slope > 0 
                  ? `Le stock augmente de ${Math.abs(prediction.slope).toFixed(2)} unités par jour en moyenne`
                  : `Le stock diminue de ${Math.abs(prediction.slope).toFixed(2)} unités par jour en moyenne`
                }
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Qualité de la Prédiction</h4>
              <p className="text-sm text-gray-600">
                Précision = {(prediction.rSquared * 100).toFixed(1)}% - 
                {prediction.rSquared > 0.8 ? ' Excellente prédiction' : 
                 prediction.rSquared > 0.6 ? ' Bonne prédiction' : 
                 prediction.rSquared > 0.4 ? ' Prédiction acceptable' : ' Prédiction faible'}
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Stock Prédit</h4>
              <p className="text-sm text-gray-600">
                Dans {predictionDays} jours : {Math.max(0, prediction.futurePrediction).toFixed(0)} unités
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
