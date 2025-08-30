'use client';

import React, { useState } from 'react';
import { useProduits } from '../../hooks/useProduits';
import { PredictionChart } from '../../components/PredictionChart';
import { usePredictions } from '../../hooks/usePredictions';
import DashboardChart from '../../components/DashboardChart';
import ProduitPredictionChart from '../../components/ProduitPredictionChart';
import './dashboard.css';

export default function DashboardPage() {
  const { produits, loading, error } = useProduits();
  const [selectedProduitForPrediction, setSelectedProduitForPrediction] = useState<string>('');
  
  // Trouver les produits en stock critique
  const produitsEnAlerte = produits.filter(
    p => p.quantity <= p.quantity_critique
  );

  // Calculer la valeur totale du stock
  const valeurTotaleStock = produits.reduce(
    (total, p) => total + (p.prix * p.quantity),
    0
  );

  if (loading) return <div>Chargement...</div>;
  if (error) return <div>Erreur: {error}</div>;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Tableau de Bord</h1>

      {/* Statistiques générales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold mb-2">Total des Produits</h3>
          <p className="text-3xl font-bold text-blue-600">{produits.length}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold mb-2">Produits en Alerte</h3>
          <p className="text-3xl font-bold text-red-600">{produitsEnAlerte.length}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold mb-2">Valeur du Stock</h3>
          <p className="text-3xl font-bold text-green-600">{valeurTotaleStock.toFixed(2)}€</p>
        </div>
      </div>

      {/* Liste des produits en alerte */}
      {produitsEnAlerte.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Produits en Stock Critique</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {produitsEnAlerte.map(produit => (
              <div
                key={produit.id}
                className="p-4 border border-red-500 rounded"
              >
                <h3 className="font-semibold">{produit.nom}</h3>
                <p>Stock actuel: {produit.quantity}</p>
                <p>Seuil critique: {produit.quantity_critique}</p>
                <p>Prix: {produit.prix}€</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Graphique des prédictions pour le premier produit en alerte
      {produitsEnAlerte.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">
            Prédictions pour {produitsEnAlerte[0].nom}
          </h2>
          <PredictionChartWrapper productId={produitsEnAlerte[0].id} />
        </div>
      )} */}



      {/* Graphique des mouvements de stock par produit */}
      <DashboardChart onProduitSelect={setSelectedProduitForPrediction} />

      {/* Graphique de prédiction pour le produit sélectionné */}
      <ProduitPredictionChart selectedProduitId={selectedProduitForPrediction} />
    </div>
  );
}

// Composant wrapper pour le graphique de prédiction
const PredictionChartWrapper: React.FC<{ productId: string }> = ({ productId }) => {
  const { predictions, getPredictionForNextPeriod, loading } = usePredictions(productId);

  if (loading) return <div>Chargement des prédictions...</div>;

  return (
    <PredictionChart
      historicalData={predictions}
      prediction={getPredictionForNextPeriod()}
    />
  );
}; 