import React, { useState, useEffect } from 'react';
import { useHistoriqueStock } from '../hooks/useHistoriqueStock';
import { HistoriqueStock, Produit } from '../types';

interface HistoriqueProduitModalProps {
  produit: Produit | null;
  isOpen: boolean;
  onClose: () => void;
}

export const HistoriqueProduitModal: React.FC<HistoriqueProduitModalProps> = ({
  produit,
  isOpen,
  onClose
}) => {
  const { getHistoriqueByProduit } = useHistoriqueStock();
  const [historique, setHistorique] = useState<HistoriqueStock[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && produit) {
      fetchHistorique();
    }
  }, [isOpen, produit]);

  const fetchHistorique = async () => {
    if (!produit) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await getHistoriqueByProduit(produit.id);
      if (result.success && result.data) {
        setHistorique(result.data);
      } else {
        setError(result.error || 'Erreur lors du chargement de l\'historique');
      }
    } catch (err) {
      setError('Une erreur est survenue');
    } finally {
      setLoading(false);
    }
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
      case 'SUPPRESSION':
        return 'bg-red-200 text-red-900';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isOpen || !produit) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Historique du produit
            </h2>
            <p className="text-gray-600 mt-1">
              {produit.nom} ({produit.code})
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="text-gray-500">Chargement...</div>
            </div>
          ) : error ? (
            <div className="text-red-600 text-center py-8">{error}</div>
          ) : (
            <>
              {/* Statistiques du produit */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-blue-600">Stock actuel</h3>
                  <p className="text-2xl font-bold text-blue-900">{produit.quantity}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-green-600">Ajouts</h3>
                  <p className="text-2xl font-bold text-green-900">
                    {historique.filter(h => h.type_mouvement === 'AJOUT').length}
                  </p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-blue-600">Ventes</h3>
                  <p className="text-2xl font-bold text-blue-900">
                    {historique.filter(h => h.type_mouvement === 'VENTE').length}
                  </p>
                </div>
                                 <div className="bg-red-50 rounded-lg p-4">
                   <h3 className="text-sm font-medium text-red-600">Retraits</h3>
                   <p className="text-2xl font-bold text-red-900">
                     {historique.filter(h => h.type_mouvement === 'RETRAIT_MANUEL').length}
                   </p>
                 </div>
              </div>

              {/* Tableau de l'historique */}
              {historique.length > 0 ? (
                <div className="bg-white rounded-lg border overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quantité
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Utilisateur
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Note
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {historique.map((mouvement) => (
                        <tr key={mouvement.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {formatDate(mouvement.created_at)}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(mouvement.type_mouvement)}`}>
                              {mouvement.type_mouvement}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {mouvement.quantite}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {mouvement.user ? (
                              <div>
                                <div className="font-medium">{mouvement.user.name || 'Nom non défini'}</div>
                                <div className="text-gray-500">{mouvement.user.email || 'Email non défini'}</div>
                              </div>
                            ) : (
                              <span className="text-gray-400 italic">Utilisateur inconnu</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 max-w-xs">
                            <div>
                              {mouvement.note || '-'}
                              {mouvement.ajout_produit && (
                                <div className="text-xs text-blue-600 mt-1">
                                  Fournisseur: {mouvement.ajout_produit.fournisseur}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Aucun mouvement de stock enregistré pour ce produit
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
