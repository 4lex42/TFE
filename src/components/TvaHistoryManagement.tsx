import React, { useState } from 'react';
import { useHistoriqueTva } from '../hooks/useHistoriqueTva';

export const TvaHistoryManagement: React.FC = () => {
  const { historique, loading, error } = useHistoriqueTva();
  const [filterDate, setFilterDate] = useState<string>('');
  const [filterProduit, setFilterProduit] = useState<string>('');

  const filteredHistorique = historique.filter(item => {
    const matchesDate = !filterDate || item.date_modification.startsWith(filterDate);
    const matchesProduit = !filterProduit || 
      (item.produit && (
        item.produit.nom.toLowerCase().includes(filterProduit.toLowerCase()) ||
        item.produit.code.toLowerCase().includes(filterProduit.toLowerCase())
      ));
    return matchesDate && matchesProduit;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR');
  };

  if (loading) {
    return <div className="text-center py-8">Chargement de l'historique TVA...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-600">Erreur: {error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Historique des Modifications TVA</h2>
        <div className="flex gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filtrer par date
            </label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="border border-gray-300 rounded px-3 py-1 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filtrer par produit
            </label>
            <input
              type="text"
              placeholder="Nom ou code du produit..."
              value={filterProduit}
              onChange={(e) => setFilterProduit(e.target.value)}
              className="border border-gray-300 rounded px-3 py-1 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-800">Total Modifications</h3>
          <p className="text-2xl font-bold text-blue-600">{historique.length}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-green-800">Ce Mois</h3>
          <p className="text-2xl font-bold text-green-600">
            {historique.filter(item => {
              const itemDate = new Date(item.date_modification);
              const now = new Date();
              return itemDate.getMonth() === now.getMonth() && 
                     itemDate.getFullYear() === now.getFullYear();
            }).length}
          </p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-purple-800">Produits Uniques</h3>
          <p className="text-2xl font-bold text-purple-600">
            {new Set(historique.map(item => item.produit_id).filter(Boolean)).size}
          </p>
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Produit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ancienne TVA
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nouvelle TVA
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Variation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Modifié par
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Note
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredHistorique.map((item) => {
                const variation = item.nouvelle_tva - item.ancienne_tva;
                const variationColor = variation > 0 ? 'text-red-600' : variation < 0 ? 'text-green-600' : 'text-gray-600';
                const variationSign = variation > 0 ? '+' : '';
                
                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(item.date_modification)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.produit ? (
                        <div>
                          <div className="font-medium">{item.produit.nom}</div>
                          <div className="text-gray-500">{item.produit.code}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">Produit supprimé</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.ancienne_tva}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.nouvelle_tva}%
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${variationColor}`}>
                      {variationSign}{variation}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.user ? (
                        <div>
                          <div className="font-medium">{item.user.name}</div>
                          <div className="text-gray-500">{item.user.email}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">Utilisateur supprimé</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {item.note || '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {filteredHistorique.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {filterDate || filterProduit ? 'Aucune modification trouvée pour vos filtres' : 'Aucune modification TVA enregistrée'}
          </div>
        )}
      </div>
    </div>
  );
};
