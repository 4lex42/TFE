"use client";

import React, { useState } from 'react';
import AdminRoute from '../../components/AdminRoute';
import ConfirmationModal from '../../components/ConfirmationModal';
import { CategoryManagement } from '../../components/CategoryManagement';
import { UserRoleManagement } from '../../components/UserRoleManagement';
import { FournisseursManagement } from '../../components/FournisseursManagement';
import { useUsers } from '../../hooks/useUsers';
import { useHistoriqueStock } from '../../hooks/useHistoriqueStock';
import { HistoriqueStock } from '../../types';
import { TvaHistoryManagement } from '../../components/TvaHistoryManagement';

export default function AdminPage() {
  const { users, createUser, deleteUser, updateUserStatus } = useUsers();
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'categories' | 'fournisseurs' | 'historique' | 'tva'>('users');
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    type: 'user';
    id: string;
    name: string;
  }>({
    isOpen: false,
    type: 'user',
    id: '',
    name: ''
  });
  const [newUser, setNewUser] = useState({
    email: '',
    name: '',
    role: 'user',
    password: ''
  });

  // État pour l'historique des stocks
  const { historique, loading: historiqueLoading, error: historiqueError, getHistoriqueByType, getHistoriqueByDateRange } = useHistoriqueStock();
  const [filteredHistorique, setFilteredHistorique] = useState<HistoriqueStock[]>([]);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Initialiser l'historique filtré
  React.useEffect(() => {
    setFilteredHistorique(historique);
  }, [historique]);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await createUser(newUser);
      if (result.success) {
        setNewUser({ email: '', name: '', role: 'user', password: '' });
        setError(null);
      } else {
        setError(result.error || 'Erreur lors de la création de l\'utilisateur');
      }
    } catch (err) {
      setError('Erreur lors de la création de l\'utilisateur');
      console.error('Erreur détaillée:', err);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const result = await deleteUser(userId);
      if (!result.success) {
        setError(result.error || 'Erreur lors de la suppression de l\'utilisateur');
      }
    } catch (err) {
      setError('Erreur lors de la suppression de l\'utilisateur');
      console.error('Erreur détaillée:', err);
    }
  };

  const handleConfirmDelete = () => {
    if (deleteConfirmation.type === 'user') {
      handleDeleteUser(deleteConfirmation.id);
    }
    setDeleteConfirmation(prev => ({ ...prev, isOpen: false }));
  };

  const handleUserUpdate = () => {
    // Cette fonction est appelée quand les utilisateurs sont mis à jour
    // Le hook useUsers gère automatiquement le rafraîchissement
  };

  // Fonctions pour l'historique des stocks
  const handleTypeFilter = async (type: string) => {
    setSelectedType(type);
    if (type === 'all') {
      setFilteredHistorique(historique);
    } else {
             const result = await getHistoriqueByType(type as 'AJOUT' | 'VENTE' | 'RETRAIT_MANUEL' | 'SUPPRESSION');
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

  const clearHistoriqueFilters = () => {
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
      case 'SUPPRESSION':
        return 'bg-red-200 text-red-900';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <AdminRoute>
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold text-center mb-8">Administration</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <ConfirmationModal
          isOpen={deleteConfirmation.isOpen}
          onClose={() => setDeleteConfirmation(prev => ({ ...prev, isOpen: false }))}
          onConfirm={handleConfirmDelete}
          title={`Confirmer la suppression`}
          message={`Êtes-vous sûr de vouloir supprimer l'utilisateur ${deleteConfirmation.name} ?`}
        />

        {/* Navigation par onglets */}
        <div className="mb-8">
          <nav className="flex space-x-8 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('users')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Créer des Utilisateurs
            </button>
            <button
              onClick={() => setActiveTab('roles')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'roles'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Gérer les Rôles
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'categories'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Gestion des Catégories
            </button>
            <button
              onClick={() => setActiveTab('fournisseurs')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'fournisseurs'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Gestion des Fournisseurs
            </button>
            <button
              onClick={() => setActiveTab('historique')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'historique'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Historique des Stocks
            </button>
            <button
              onClick={() => setActiveTab('tva')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'tva'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Historique TVA
            </button>
          </nav>
        </div>

        {/* Contenu des onglets */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          {activeTab === 'users' && (
            <div>
              <h2 className="text-xl font-bold mb-4">Créer de Nouveaux Utilisateurs</h2>
              
              <form onSubmit={handleAddUser} className="mb-6 space-y-4 max-w-md">
                <div>
                  <label className="block mb-1">Email</label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={e => setNewUser({...newUser, email: e.target.value})}
                    className="w-full border p-2 rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1">Nom</label>
                  <input
                    type="text"
                    value={newUser.name}
                    onChange={e => setNewUser({...newUser, name: e.target.value})}
                    className="w-full border p-2 rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1">Mot de passe</label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={e => setNewUser({...newUser, password: e.target.value})}
                    className="w-full border p-2 rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1">Rôle</label>
                  <select
                    value={newUser.role}
                    onChange={e => setNewUser({...newUser, role: e.target.value})}
                    className="w-full border p-2 rounded"
                  >
                    <option value="user">Utilisateur</option>
                    <option value="manager">Gestionnaire</option>
                    <option value="admin">Administrateur</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  Ajouter un utilisateur
                </button>
              </form>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Utilisateurs existants</h3>
                                 {users.map(user => (
                   <div key={user.id} className="p-4 border rounded">
                     <div className="flex justify-between items-start mb-3">
                       <div>
                         <p className="font-semibold">{user.name}</p>
                         <p className="text-sm text-gray-600">{user.email}</p>
                         <p className="text-sm text-gray-600">Rôle: {user.role}</p>
                         <div className="mt-2">
                           <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                             user.status === 'approved' ? 'bg-green-100 text-green-800' :
                             user.status === 'rejected' ? 'bg-red-100 text-red-800' :
                             'bg-yellow-100 text-yellow-800'
                           }`}>
                             {user.status === 'approved' ? 'Approuvé' :
                              user.status === 'rejected' ? 'Rejeté' :
                              'En attente'}
                           </span>
                         </div>
                       </div>
                       <div className="flex gap-2">
                         {user.status === 'pending' && (
                           <>
                             <button
                               onClick={async () => {
                                 const result = await updateUserStatus(user.id, 'approved');
                                 if (!result.success) {
                                   setError(result.error || 'Erreur lors de l\'approbation');
                                 }
                               }}
                               className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 text-sm"
                             >
                               Approuver
                             </button>
                             <button
                               onClick={async () => {
                                 const result = await updateUserStatus(user.id, 'rejected');
                                 if (!result.success) {
                                   setError(result.error || 'Erreur lors du rejet');
                                 }
                               }}
                               className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm"
                             >
                               Rejeter
                             </button>
                           </>
                         )}
                         <button
                           onClick={() => setDeleteConfirmation({
                             isOpen: true,
                             type: 'user',
                             id: user.id,
                             name: user.name || 'cet utilisateur'
                           })}
                           className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                         >
                           Supprimer
                         </button>
                       </div>
                     </div>
                   </div>
                 ))}
              </div>
            </div>
          )}

          {activeTab === 'roles' && (
            <div>
              <h2 className="text-xl font-bold mb-4">Gestion des Rôles Utilisateurs</h2>
              <p className="text-gray-600 mb-6">
                Modifiez les rôles des utilisateurs existants. Cliquez sur "Modifier" pour changer le rôle d'un utilisateur.
              </p>
              <UserRoleManagement onUserUpdate={handleUserUpdate} />
            </div>
          )}

          {activeTab === 'categories' && (
            <div>
              <h2 className="text-xl font-bold mb-4">Gestion des Catégories</h2>
              <CategoryManagement />
            </div>
          )}

          {activeTab === 'fournisseurs' && (
            <div>
              <h2 className="text-xl font-bold mb-4">Gestion des Fournisseurs</h2>
              <FournisseursManagement />
            </div>
          )}

          {activeTab === 'historique' && (
            <div>
              <h2 className="text-xl font-bold mb-4">Historique des Mouvements de Stock</h2>
              
              {/* Filtres */}
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">Filtres</h3>
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
                      <option value="SUPPRESSION">Suppressions</option>
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
                      onClick={clearHistoriqueFilters}
                      className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    >
                      Effacer
                    </button>
                  </div>
                </div>
              </div>

                             {/* Statistiques */}
               <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
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
                 <div className="bg-white rounded-lg shadow-lg p-6">
                   <h3 className="text-lg font-semibold text-gray-700 mb-2">Suppressions</h3>
                   <p className="text-3xl font-bold text-red-600">
                     {filteredHistorique.filter(h => h.type_mouvement === 'SUPPRESSION').length}
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
                           Email Utilisateur
                         </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Note
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {historiqueLoading ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                            Chargement...
                          </td>
                        </tr>
                      ) : historiqueError ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-4 text-center text-red-500">
                            Erreur: {historiqueError}
                          </td>
                        </tr>
                      ) : filteredHistorique.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                            Aucun mouvement de stock trouvé
                          </td>
                        </tr>
                      ) : (
                        filteredHistorique.map((mouvement) => (
                          <tr key={mouvement.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatDate(mouvement.created_at)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div>
                                <div className={`font-medium ${mouvement.produit_supprime ? 'text-red-600 italic' : ''}`}>
                                  {mouvement.produit?.nom || 'Produit supprimé'}
                                </div>
                                <div className={`text-gray-500 ${mouvement.produit_supprime ? 'text-red-600 italic' : ''}`}>
                                  {mouvement.produit?.code || 'N/A'}
                                </div>
                                {mouvement.produit_supprime && (
                                  <div className="mt-1">
                                    <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                                      Produit supprimé
                                    </span>
                                  </div>
                                )}
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
                               {mouvement.user?.email || 'Utilisateur inconnu'}
                             </td>
                            <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                              {mouvement.note || '-'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tva' && (
            <div>
              <TvaHistoryManagement />
            </div>
          )}
        </div>
      </div>
    </AdminRoute>
  );
}