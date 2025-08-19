"use client";

import React, { useState, useEffect } from 'react';
import { useHistoriqueStock } from '../../../hooks/useHistoriqueStock';
import { HistoriqueStock } from '../../../types';

export default function HistoriqueStockPage() {
  const { historique, loading, error, getHistoriqueByType, getHistoriqueByDateRange } = useHistoriqueStock();
  const [filteredHistorique, setFilteredHistorique] = useState<HistoriqueStock[]>([]);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  useEffect(() => {
    setFilteredHistorique(historique);
  }, [historique]);

  const handleTypeFilter = async (type: string) => {
    setSelectedType(type);
    if (type === 'all') {
      setFilteredHistorique(historique);
    } else {
      const result = await getHistoriqueByType(type as 'AJOUT' | 'VENTE' | 'RETRAIT_MANUEL');
      if (result.success && result.data) {
        setFilteredHistorique(result.data);
      }
    }
  };

  const handleDateFilter = async () => {
    if (startDate && endDate) {
      const result = await getHistoriqueByDateRange(startDate, endDate);
      if (result.success && result.data) {
        setFilteredHistorique(result.data);
      }
    } else {
      setFilteredHistorique(historique);
    }
  };

  const clearFilters = () => {
    setSelectedType('all');
    setStartDate('');
    setEndDate('');
    setFilteredHistorique(historique);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR');
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'AJOUT':
        return 'bg-green-100 text-green-800';
      case 'VENTE':
        return 'bg-blue-100 text-blue-800';
      case 'RETRAIT_MANUEL':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64">Chargement...</div>;
  if (error) return <div className="text-red-600 text-center">Erreur: {error}</div>;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Historique des Mouvements de Stock</h1>

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Filtres</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type de mouvement
            </label>
            <select
              value={selectedType}
              onChange={(e) => handleTypeFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tous les types</option>
              <option value="AJOUT">Ajouts</option>
              <option value="VENTE">Ventes</option>
              <option value="RETRAIT_MANUEL">Retraits manuels</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date de début
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date de fin
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-end space-x-2">
            <button
              onClick={handleDateFilter}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Filtrer
            </button>
            <button
              onClick={clearFilters}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Effacer
            </button>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Total des mouvements</h3>
          <p className="text-3xl font-bold text-blue-600">{filteredHistorique.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Ajouts</h3>
          <p className="text-3xl font-bold text-green-600">
            {filteredHistorique.filter(h => h.type_mouvement === 'AJOUT').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Ventes</h3>
          <p className="text-3xl font-bold text-blue-600">
            {filteredHistorique.filter(h => h.type_mouvement === 'VENTE').length}
          </p>
        </div>
      </div>

      {/* Tableau de l'historique */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Produit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantité
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Utilisateur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Note
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredHistorique.map((mouvement) => (
                <tr key={mouvement.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(mouvement.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>
                      <div className="font-medium">{mouvement.produit?.nom || 'Produit supprimé'}</div>
                      <div className="text-gray-500">{mouvement.produit?.code || 'N/A'}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(mouvement.type_mouvement)}`}>
                      {mouvement.type_mouvement}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {mouvement.quantite}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {mouvement.user?.name || mouvement.user?.email || 'Utilisateur inconnu'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                    {mouvement.note || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredHistorique.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Aucun mouvement de stock trouvé
          </div>
        )}
      </div>
    </div>
  );
}
