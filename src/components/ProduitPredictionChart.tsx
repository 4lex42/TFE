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
import * as math from 'mathjs';

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
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [showTrendLine, setShowTrendLine] = useState(true);

  // Nouvelle fonction pour calculer une régression polynomiale (degré 2)
  const calculatePolynomialRegression = (points: Point[], degree: number = 2): PredictionResult => {
    if (points.length < degree + 1) {
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
    const X: number[][] = [];
    const Y: number[] = [];

    points.forEach(p => {
      const row: number[] = [];
      for (let d = 0; d <= degree; d++) {
        row.push(Math.pow(p.x, d)); // [1, x, x^2, ...]
      }
      X.push(row);
      Y.push(p.y);
    });

    // Résolution du système (X^T X) β = X^T Y
    const XT = math.transpose(X);
    const XTX = math.multiply(XT, X) as number[][];
    const XTY = math.multiply(XT, Y) as number[];
    const coeffs = math.lusolve(XTX, XTY).map((v: any) => v[0]); // coefficients du polynôme

    // Générer les valeurs prédites
    const maxX = Math.max(...points.map(p => p.x));
    const predictedValues: Point[] = [];
    for (let x = 0; x <= maxX + predictionDays; x++) {
      let yPred = 0;
      for (let d = 0; d <= degree; d++) {
        yPred += coeffs[d] * Math.pow(x, d);
      }
      // Empêcher les valeurs négatives (stock minimum = 0)
      yPred = Math.max(0, yPred);
      predictedValues.push({ x, y: yPred });
    }

    // Calcul du R²
    const meanY = Number(math.mean(Y));
    const ssRes = points.reduce((sum, p) => {
      let yPred = 0;
      for (let d = 0; d <= degree; d++) {
        yPred += coeffs[d] * Math.pow(p.x, d);
      }
      return sum + Math.pow(p.y - yPred, 2);
    }, 0);
    const ssTot = points.reduce((sum, p) => sum + Math.pow(p.y - meanY, 2), 0);
    const rSquared = ssTot > 0 ? 1 - ssRes / ssTot : 0;

    // Estimation future
    let futurePrediction = 0;
    for (let d = 0; d <= degree; d++) {
      futurePrediction += coeffs[d] * Math.pow(maxX + predictionDays, d);
    }
    // Empêcher les valeurs négatives
    futurePrediction = Math.max(0, futurePrediction);

    // Détection rupture de stock (premier point où y = 0)
    let daysUntilStockout: number | null = null;
    for (const p of predictedValues) {
      if (p.y === 0) {
        daysUntilStockout = p.x;
        break;
      }
    }

    // Calculer la pente moyenne sur la période de prédiction (plus intuitive)
    const stockActuel = points.length > 0 ? points[points.length - 1].y : 0;
    const penteMoyenne = predictionDays > 0 ? (futurePrediction - stockActuel) / predictionDays : 0;

    return {
      slope: penteMoyenne,         // pente moyenne sur la période de prédiction
      intercept: coeffs[0] || 0,   // constante
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
    
    // Trouver la création du produit (premier mouvement AJOUT avec note de création)
    const creationMouvement = historiqueProduit.find(m => 
      m.type_mouvement === 'AJOUT' && 
      m.note && 
      m.note.includes('Création du nouveau produit')
    );
    
    // Quantité initiale à la création
    const quantiteInitiale = creationMouvement ? creationMouvement.quantite : 0;
    
    // Calculer le stock à chaque date en partant de la quantité initiale
    let stockCumulatif = quantiteInitiale;
    
    // Trier les mouvements chronologiquement
    const mouvementsTries = historiqueProduit
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    // Grouper les mouvements par date
    const mouvementsParDate = new Map<string, any[]>();
    
    mouvementsTries.forEach(mouvement => {
      const dateStr = new Date(mouvement.created_at).toISOString().split('T')[0];
      if (!mouvementsParDate.has(dateStr)) {
        mouvementsParDate.set(dateStr, []);
      }
      mouvementsParDate.get(dateStr)!.push(mouvement);
    });

    // Appliquer les mouvements chronologiquement
    const datesTriees = Array.from(mouvementsParDate.keys()).sort();
    
    datesTriees.forEach(dateStr => {
      const mouvements = mouvementsParDate.get(dateStr) || [];
      
      mouvements.forEach(mouvement => {
        // Analyser la note pour comprendre le type de mouvement
        const note = mouvement.note || '';
        
        if (note.includes('Création du nouveau produit')) {
          // Création : définir le stock initial
          stockCumulatif = mouvement.quantite;
        } else if (note.includes('Modification du stock via gestion des produits')) {
          // Modification : extraire la nouvelle quantité de la note
          const match = note.match(/→\s*(\d+)/);
          if (match) {
            stockCumulatif = parseInt(match[1]);
          } else {
            // Fallback : appliquer la différence
            stockCumulatif += mouvement.quantite;
          }
        } else {
          // Mouvements normaux (ventes, ajouts via fournisseurs, etc.)
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
        }
      });
      
      stockParDate.set(dateStr, Math.max(0, stockCumulatif));
    });
    
    // Ajouter le stock actuel pour aujourd'hui si pas déjà présent
    const aujourdhui = new Date().toISOString().split('T')[0];
    if (!stockParDate.has(aujourdhui)) {
      stockParDate.set(aujourdhui, produit.quantity);
    }

    // Vérifier que le calcul arrive au stock actuel
    const dernierStockCalcule = stockCumulatif;
    if (Math.abs(dernierStockCalcule - produit.quantity) > 0.1) {
      console.warn(`Stock calculé (${dernierStockCalcule}) ne correspond pas au stock actuel (${produit.quantity}) pour le produit ${produit.nom}. Quantité initiale: ${quantiteInitiale}`);
      
      // Forcer la correction du stock final pour correspondre à la réalité
      stockParDate.set(aujourdhui, produit.quantity);
      
      // Ajuster aussi le dernier point calculé
      const dernierPoint = Array.from(stockParDate.entries()).pop();
      if (dernierPoint && dernierPoint[0] !== aujourdhui) {
        stockParDate.set(dernierPoint[0], produit.quantity);
      }
    }

    // Calcul terminé

    // Convertir en points pour la régression
    const sortedDates = Array.from(stockParDate.keys()).sort(); // Tri chronologique pour l'affichage
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
    return calculatePolynomialRegression(produitData.points);
  }, [produitData, predictionDays]);

  // Préparer les données du graphique
  const chartData = useMemo(() => {
    if (!produitData || !prediction) return null;

    // Créer un tableau de toutes les dates (historique + prédiction)
    const allDates: string[] = [];
    
    // Ajouter les dates historiques
    produitData.points.forEach(point => {
      const date = new Date(produitData.startDate);
      date.setDate(date.getDate() + point.x);
      allDates.push(date.toISOString().split('T')[0]);
    });
    
    // Ajouter les dates de prédiction (sans doublons)
    prediction.predictedValues.forEach(point => {
      const date = new Date(produitData.startDate);
      date.setDate(date.getDate() + point.x);
      const dateStr = date.toISOString().split('T')[0];
      if (!allDates.includes(dateStr)) {
        allDates.push(dateStr);
      }
    });
    
    // Trier toutes les dates chronologiquement
    allDates.sort();
    
    // Créer les labels pour l'axe X
    const labels = allDates.map(dateStr => {
      return new Date(dateStr).toLocaleDateString('fr-FR');
    });

    // Créer un map pour accéder rapidement aux données historiques
    const historiqueMap = new Map<number, number>();
    produitData.points.forEach(point => {
      historiqueMap.set(point.x, point.y);
    });

    // Créer un map pour accéder rapidement aux données prédites
    const predictionMap = new Map<number, number>();
    prediction.predictedValues.forEach(point => {
      predictionMap.set(point.x, point.y);
    });

    // Préparer les données pour chaque date
    const stockReelData: (number | null)[] = [];
    const predictionData: (number | null)[] = [];

    allDates.forEach((dateStr, index) => {
      const date = new Date(dateStr);
      const daysSinceStart = Math.floor((date.getTime() - produitData.startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // Données historiques (Stock Réel)
      const stockReel = historiqueMap.get(daysSinceStart);
      stockReelData.push(stockReel !== undefined ? stockReel : null);
      
      // Données prédites
      const prediction = predictionMap.get(daysSinceStart);
      predictionData.push(prediction !== undefined ? prediction : null);
    });

    return {
      labels,
      datasets: [
        {
          label: 'Stock Réel',
          data: stockReelData,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 3,
          fill: false,
          tension: 0.1,
          pointRadius: 6,
          pointHoverRadius: 8,
          spanGaps: true, // Permet de sauter les valeurs null
        },
        {
          label: 'Tendance Prédite',
          data: showTrendLine ? predictionData : predictionData.map(() => null),
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          borderWidth: 2,
          fill: false,
          tension: 0.1,
          pointRadius: 0,
          borderDash: [5, 5],
          spanGaps: true,
        },

      ],
    };
  }, [produitData, prediction, predictionDays, showTrendLine]);

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart' as const,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            weight: 'bold' as const,
          },
        },
      },
      title: {
        display: true,
        text: produitData 
          ? `Prédiction de Stock pour ${produitData.produit.nom} (${produitData.produit.code})`
          : 'Sélectionnez un produit pour voir la prédiction',
        font: {
          size: 18,
          weight: 'bold' as const,
        },
        padding: {
          top: 10,
          bottom: 20,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          title: function(context: any) {
            return `📅 ${context[0].label}`;
          },
          afterBody: function(context: any) {
            if (prediction) {
              const tooltipInfo = [];
              
              // Ajouter les informations de tendance
              const trendIcon = prediction.slope > 0 ? '📈' : prediction.slope < 0 ? '📉' : '➡️';
              const trendText = prediction.slope > 0 ? 'Croissante' : prediction.slope < 0 ? 'Décroissante' : 'Stable';
              tooltipInfo.push(`${trendIcon} Direction: ${trendText}`);
              tooltipInfo.push(`📊 Tendance moyenne: ${prediction.slope > 0 ? '+' : ''}${prediction.slope.toFixed(2)} unités/jour sur ${predictionDays} jours`);
              tooltipInfo.push(`🎯 Précision: ${(prediction.rSquared * 100).toFixed(1)}%`);
              
              // Ajouter l'information de rupture de stock
              if (prediction.daysUntilStockout) {
                tooltipInfo.push(`⚠️ Rupture de stock dans ${prediction.daysUntilStockout} jours`);
              } else {
                tooltipInfo.push(`✅ Pas de rupture de stock prévue`);
              }
              
              return tooltipInfo;
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
          text: '📅 Date',
          font: {
            size: 14,
            weight: 'bold' as const,
          },
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45,
          autoSkip: true,
          maxTicksLimit: 10,
          font: {
            size: 11,
          },
        },
        grid: {
          display: showGrid,
          color: 'rgba(0, 0, 0, 0.1)',
          drawBorder: false,
        },
      },
      y: {
        title: {
          display: true,
          text: '📦 Stock',
          font: {
            size: 14,
            weight: 'bold' as const,
          },
        },
        beginAtZero: true,
        min: 0,
        ticks: {
          callback: function(value: any) {
            return Math.max(0, value).toFixed(0);
          },
          font: {
            size: 11,
          },
        },
        grid: {
          display: showGrid,
          color: 'rgba(0, 0, 0, 0.1)',
          drawBorder: false,
        },
      },
    },
  }), [produitData, prediction, showGrid]);

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
        
        <div className="flex flex-col md:flex-row gap-4 items-center mb-4">
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

        {/* Options avancées */}
        <div className="border-t pt-4">
          <button
            onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
            className="flex items-center text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            <svg className={`w-4 h-4 mr-2 transition-transform ${showAdvancedOptions ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            Options avancées
          </button>
          
          {showAdvancedOptions && (
            <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={showGrid}
                  onChange={(e) => setShowGrid(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Grille</span>
              </label>
              
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={showTrendLine}
                  onChange={(e) => setShowTrendLine(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Ligne de tendance</span>
              </label>
              

            </div>
          )}
        </div>
      </div>

             {/* Statistiques de prédiction */}
       <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-blue-800 font-semibold text-sm mb-1">Direction</div>
              <div className="text-xl font-bold text-blue-700">
                {prediction.slope > 0 ? '📈 Croissante' : prediction.slope < 0 ? '📉 Décroissante' : '➡️ Stable'}
              </div>
              <div className="text-xs text-blue-600 mt-1">
                {prediction.slope > 0 ? 'Stock augmente' : prediction.slope < 0 ? 'Stock diminue' : 'Stock stable'}
              </div>
            </div>
            <div className="w-10 h-10 bg-blue-200 rounded-lg flex items-center justify-center">
              {prediction.slope > 0 ? (
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                </svg>
              ) : prediction.slope < 0 ? (
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
                </svg>
              )}
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-green-800 font-semibold text-sm mb-1">Tendance Moyenne</div>
              <div className="text-xl font-bold text-green-700">
                {prediction.slope > 0 ? '+' : ''}{prediction.slope.toFixed(2)} unités/jour
              </div>
              <div className="text-xs text-green-600 mt-1">
                Sur {predictionDays} jours
              </div>
            </div>
            <div className="w-10 h-10 bg-green-200 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-purple-800 font-semibold text-sm mb-1">Précision</div>
              <div className="text-xl font-bold text-purple-700">
                {(prediction.rSquared * 100).toFixed(1)}%
              </div>
            </div>
            <div className="w-10 h-10 bg-purple-200 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
        
        
        
      </div>



      {/* Graphique de prédiction */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                 <div className="p-4 bg-gray-50 border-b border-gray-200">
           <div className="flex items-center justify-between">
             <h3 className="text-lg font-semibold text-gray-800">Graphique de Prédiction</h3>
           </div>
         </div>
        
        <div className="p-4">
          <div className="h-96">
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>
        
        {/* Légende interactive */}
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>Stock Réel (données historiques)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span>Tendance Prédite (régression polynomiale)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
