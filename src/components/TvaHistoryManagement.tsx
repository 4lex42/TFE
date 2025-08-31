import React, { useState, useEffect } from 'react';
import { useHistoriqueTva } from '../hooks/useHistoriqueTva';

export const TvaHistoryManagement: React.FC = () => {
  const { historique, loading, error } = useHistoriqueTva();
  const [filterDate, setFilterDate] = useState<string>('');
  const [filterProduit, setFilterProduit] = useState<string>('');
  
  // État pour la pagination de l'historique TVA
  const [currentPage, setCurrentPage] = useState(1);
  const [historiquePerPage, setHistoriquePerPage] = useState(20);

  // Debug: Afficher les données brutes
  useEffect(() => {
    console.log('=== DEBUG HISTORIQUE TVA ===');
    console.log('Loading:', loading);
    console.log('Error:', error);
    console.log('Historique brut:', historique);
    console.log('Nombre d\'éléments:', historique.length);
    
    if (historique.length > 0) {
      console.log('Premier élément:', historique[0]);
      console.log('Structure du premier élément:', Object.keys(historique[0]));
      
      // Vérifier les jointures
      console.log('Produit du premier élément:', historique[0].produit);
      console.log('User du premier élément:', historique[0].user);
      
      // Vérifier les IDs
      console.log('Produit ID:', historique[0].produit_id);
      console.log('User ID:', historique[0].user_id);
    }
  }, [historique, loading, error]);

  const filteredHistorique = historique.filter(item => {
    const matchesDate = !filterDate || item.date_modification.startsWith(filterDate);
    const matchesProduit = !filterProduit || 
      (item.produit && (
        item.produit.nom.toLowerCase().includes(filterProduit.toLowerCase()) ||
        item.produit.code.toLowerCase().includes(filterProduit.toLowerCase())
      ));
    return matchesDate && matchesProduit;
  });

  // Fonctions de pagination
  const totalPages = Math.ceil(filteredHistorique.length / historiquePerPage);
  const indexOfLast = currentPage * historiquePerPage;
  const indexOfFirst = indexOfLast - historiquePerPage;
  const currentHistorique = filteredHistorique.slice(indexOfFirst, indexOfLast);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    // Scroll vers le haut de la liste
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleHistoriquePerPageChange = (newHistoriquePerPage: number) => {
    setHistoriquePerPage(newHistoriquePerPage);
    setCurrentPage(1); // Retour à la première page
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Réinitialiser la pagination quand les filtres changent
  useEffect(() => {
    setCurrentPage(1);
  }, [filterDate, filterProduit]);

  // Réinitialiser la pagination quand le nombre de mouvements change
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [filteredHistorique.length, currentPage, totalPages]);

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

             {/* Contrôles de pagination */}
       <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
         <div className="flex justify-center items-center">
           <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-600">Afficher par page:</label>
              <select
                value={historiquePerPage}
                onChange={(e) => handleHistoriquePerPageChange(Number(e.target.value))}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <div className="text-sm text-gray-600">
              Affichage {indexOfFirst + 1}-{Math.min(indexOfLast, filteredHistorique.length)} sur {filteredHistorique.length} modifications
            </div>
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
              {currentHistorique.map((item) => {
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

        {/* Contrôles de pagination du tableau */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Page {currentPage} sur {totalPages}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    currentPage === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Précédent
                </button>
                
                {/* Numéros de page */}
                <div className="flex items-center space-x-1">
                  {Array.from({ length: totalPages }, (_, index) => {
                    const pageNumber = index + 1;
                    // Afficher seulement quelques pages autour de la page actuelle
                    if (
                      pageNumber === 1 ||
                      pageNumber === totalPages ||
                      (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={pageNumber}
                          onClick={() => handlePageChange(pageNumber)}
                          className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                            pageNumber === currentPage
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {pageNumber}
                        </button>
                      );
                    } else if (
                      pageNumber === currentPage - 2 ||
                      pageNumber === currentPage + 2
                    ) {
                      return (
                        <span key={pageNumber} className="px-2 text-gray-400">
                          ...
                        </span>
                      );
                    }
                    return null;
                  })}
                </div>

                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    currentPage === totalPages
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Suivant
                </button>
              </div>
            </div>
          </div>
        )}
        
        {filteredHistorique.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {filterDate || filterProduit ? 'Aucune modification trouvée pour vos filtres' : 'Aucune modification TVA enregistrée'}
          </div>
        )}
      </div>
    </div>
  );
};
