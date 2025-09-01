"use client";

import React, { useState } from 'react';
import AdminRoute from '../../components/AdminRoute';
import ConfirmationModal from '../../components/ConfirmationModal';
import { CategoryManagement } from '../../components/CategoryManagement';
import { FournisseursManagement } from '../../components/FournisseursManagement';
import { useUsers } from '../../hooks/useUsers';

import { TvaHistoryManagement } from '../../components/TvaHistoryManagement';

export default function AdminPage() {
  const { users, createUser, deleteUser, updateUserStatus } = useUsers();
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'categories' | 'fournisseurs' | 'tva'>('users');
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
  
  // État pour l'édition des utilisateurs
  const [editingUser, setEditingUser] = useState<{
    id: string;
    email: string;
    name: string;
    role: string;
  } | null>(null);





  // État pour la pagination des utilisateurs
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage, setUsersPerPage] = useState(10);



  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await createUser(newUser);
      if (result.success) {
        setNewUser({ email: '', name: '', role: 'user', password: '' });
        setError(null);
        setSuccessMessage('Utilisateur créé avec succès !');
        setTimeout(() => setSuccessMessage(null), 3000);
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
      if (result.success) {
        setSuccessMessage('Utilisateur supprimé avec succès !');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
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

  // Fonctions de pagination
  const totalPages = Math.ceil(users.length / usersPerPage);
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = users.slice(indexOfFirstUser, indexOfLastUser);

  // Réinitialiser la pagination quand le nombre d'utilisateurs change
  React.useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [users.length, currentPage, totalPages]);

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

  const handleUsersPerPageChange = (newUsersPerPage: number) => {
    setUsersPerPage(newUsersPerPage);
    setCurrentPage(1); // Retour à la première page
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEditUser = (user: any) => {
    setEditingUser({
      id: user.id,
      email: user.email,
      name: user.name || '',
      role: user.role || 'user'
    });
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      const result = await updateUserStatus(editingUser.id, 'approved'); // Approuver automatiquement lors de la modification
      if (result.success) {
        setEditingUser(null);
        setSuccessMessage('Utilisateur mis à jour avec succès !');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(result.error || 'Erreur lors de la mise à jour');
      }
    } catch (err) {
      setError('Erreur lors de la mise à jour de l\'utilisateur');
      console.error('Erreur détaillée:', err);
    }
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
  };





  const getTabIcon = (tab: string) => {
    switch (tab) {
      case 'users':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
        );
      case 'roles':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        );
      case 'categories':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
        );
      case 'fournisseurs':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        );

      case 'tva':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getTabLabel = (tab: string) => {
    switch (tab) {
      case 'users': return 'Utilisateurs';
      case 'roles': return 'Rôles';
      case 'categories': return 'Catégories';
      case 'fournisseurs': return 'Fournisseurs';

      case 'tva': return 'TVA';
      default: return tab;
    }
  };

  return (
    <AdminRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="container mx-auto py-8 px-4">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              Administration
            </h1>
            <p className="text-gray-600 text-lg">
              Gérez votre système de gestion des stocks
            </p>
          </div>

          {/* Messages de feedback */}
          {error && (
            <div className="max-w-6xl mx-auto mb-6">
              <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <span className="text-red-700 font-medium">{error}</span>
                </div>
              </div>
            </div>
          )}

          {successMessage && (
            <div className="max-w-6xl mx-auto mb-6">
              <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-lg">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-green-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-green-700 font-medium">{successMessage}</span>
                </div>
              </div>
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
          <div className="max-w-6xl mx-auto mb-8">
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
              <nav className="flex flex-wrap">
                {(['users', 'categories', 'fournisseurs', 'tva'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 min-w-0 flex items-center justify-center px-6 py-4 text-sm font-medium transition-all duration-200 ${
                      activeTab === tab
                        ? 'bg-blue-500 text-white border-b-2 border-blue-600'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50 border-b-2 border-transparent hover:border-gray-300'
                    }`}
                  >
                    <span className="mr-2">{getTabIcon(tab)}</span>
                    {getTabLabel(tab)}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Contenu des onglets */}
          <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
              {activeTab === 'users' && (
                <div className="p-8">
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Gestion des Utilisateurs</h2>
                    <p className="text-gray-600">Créez et gérez les comptes utilisateurs de votre système</p>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Formulaire de création */}
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Créer un nouvel utilisateur</h3>
                      
                      <form onSubmit={handleAddUser} className="space-y-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                          <input
                            type="email"
                            value={newUser.email}
                            onChange={e => setNewUser({...newUser, email: e.target.value})}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                            placeholder="exemple@email.com"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Nom complet</label>
                          <input
                            type="text"
                            value={newUser.name}
                            onChange={e => setNewUser({...newUser, name: e.target.value})}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                            placeholder="Nom et prénom"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Mot de passe</label>
                          <input
                            type="password"
                            value={newUser.password}
                            onChange={e => setNewUser({...newUser, password: e.target.value})}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                            placeholder="Mot de passe sécurisé"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Rôle</label>
                          <select
                            value={newUser.role}
                            onChange={e => setNewUser({...newUser, role: e.target.value})}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                          >
                            <option value="user">Utilisateur</option>
                            <option value="admin">Administrateur</option>
                          </select>
                        </div>
                        <button
                          type="submit"
                          className="w-full bg-blue-500 text-white py-3 px-6 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-105"
                        >
                          Créer l'utilisateur
                        </button>
                      </form>
                    </div>

                    {/* Liste des utilisateurs */}
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">Utilisateurs existants</h3>
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <label className="text-sm text-gray-600">Afficher par page:</label>
                            <select
                              value={usersPerPage}
                              onChange={(e) => handleUsersPerPageChange(Number(e.target.value))}
                              className="px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value={5}>5</option>
                              <option value={10}>10</option>
                              <option value={20}>20</option>
                              <option value={50}>50</option>
                            </select>
                          </div>
                          <div className="text-sm text-gray-600">
                            Affichage {indexOfFirstUser + 1}-{Math.min(indexOfLastUser, users.length)} sur {users.length} utilisateurs
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        {currentUsers.map(user => (
                          <div key={user.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                            {editingUser?.id === user.id ? (
                              // Mode édition
                              <form onSubmit={handleUpdateUser} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                                    <input
                                      type="email"
                                      value={editingUser.email}
                                      onChange={e => setEditingUser({...editingUser, email: e.target.value})}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                                      required
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Nom</label>
                                    <input
                                      type="text"
                                      value={editingUser.name}
                                      onChange={e => setEditingUser({...editingUser, name: e.target.value})}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                                      required
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Rôle</label>
                                    <select
                                      value={editingUser.role}
                                      onChange={e => setEditingUser({...editingUser, role: e.target.value})}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                                    >
                                      <option value="user">Utilisateur</option>
                                      <option value="admin">Administrateur</option>
                                    </select>
                                  </div>
                                  <div className="flex items-end space-x-2">
                                    <button
                                      type="submit"
                                      className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 text-sm transition-colors"
                                    >
                                      Sauvegarder
                                    </button>
                                    <button
                                      type="button"
                                      onClick={handleCancelEdit}
                                      className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 text-sm transition-colors"
                                    >
                                      Annuler
                                    </button>
                                  </div>
                                </div>
                              </form>
                            ) : (
                              // Mode affichage
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-3 mb-2">
                                    <h4 className="font-semibold text-gray-900">{user.name}</h4>
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
                                  <p className="text-sm text-gray-600 mb-1">{user.email}</p>
                                  <p className="text-xs text-gray-500">Rôle: {user.role === 'admin' ? 'Administrateur' : 'Utilisateur'}</p>
                                </div>
                                
                                <div className="flex flex-col space-y-2">
                                  {user.status === 'pending' && (
                                    <>
                                      <button
                                        onClick={async () => {
                                          const result = await updateUserStatus(user.id, 'approved');
                                          if (result.success) {
                                            setSuccessMessage('Utilisateur approuvé avec succès !');
                                            setTimeout(() => setSuccessMessage(null), 3000);
                                          } else {
                                            setError(result.error || 'Erreur lors de l\'approbation');
                                          }
                                        }}
                                        className="bg-green-500 text-white px-3 py-1 rounded-lg hover:bg-green-600 text-sm transition-colors"
                                      >
                                        Approuver
                                      </button>
                                      <button
                                        onClick={async () => {
                                          const result = await updateUserStatus(user.id, 'rejected');
                                          if (result.success) {
                                            setSuccessMessage('Utilisateur rejeté avec succès !');
                                            setTimeout(() => setSuccessMessage(null), 3000);
                                          } else {
                                            setError(result.error || 'Erreur lors du rejet');
                                          }
                                        }}
                                        className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 text-sm transition-colors"
                                      >
                                        Rejeter
                                      </button>
                                    </>
                                  )}
                                  <button
                                    onClick={() => handleEditUser(user)}
                                    className="bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600 text-sm transition-colors"
                                  >
                                    Modifier
                                  </button>
                                  <button
                                    onClick={() => setDeleteConfirmation({
                                      isOpen: true,
                                      type: 'user',
                                      id: user.id,
                                      name: user.name || 'cet utilisateur'
                                    })}
                                    className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 text-sm transition-colors"
                                  >
                                    Supprimer
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Contrôles de pagination */}
                      {totalPages > 1 && (
                        <div className="mt-6 flex items-center justify-between">
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
                      )}
                    </div>
                  </div>
                </div>
              )}



              {activeTab === 'categories' && (
                <div className="p-8">
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Gestion des Catégories</h2>
                    <p className="text-gray-600">Organisez vos produits en catégories pour une meilleure gestion</p>
                  </div>
                  <CategoryManagement />
                </div>
              )}

              {activeTab === 'fournisseurs' && (
                <div className="p-8">
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Gestion des Fournisseurs</h2>
                    <p className="text-gray-600">Gérez vos partenaires fournisseurs et leurs informations</p>
                  </div>
                  <FournisseursManagement />
                </div>
              )}


                <div className="p-8 animate-fadeIn">
                  <div className="mb-8">
                    <h2 className="text-3xl font-bold text-gray-800 mb-3 flex items-center">
                      <svg className="w-8 h-8 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      Historique des Mouvements de Stock
                    </h2>
                    <p className="text-gray-600 text-lg">Surveillez et analysez tous les mouvements de stock de votre système en temps réel</p>
                  </div>
                  
                  {/* Filtres améliorés */}
                  <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                        <svg className="w-6 h-6 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                        </svg>
                        Filtres et Recherche Avancée
                      </h3>
                      <div className="flex items-center space-x-3">
                        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                          {filteredHistorique.length} résultat{filteredHistorique.length > 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                      <div className="lg:col-span-1">
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          <svg className="w-4 h-4 inline mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                          Type de mouvement
                        </label>
                        <select
                          value={selectedType}
                          onChange={(e) => handleTypeFilter(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm"
                        >
                          <option value="all">🔄 Tous les types</option>
                          <option value="AJOUT">📦 Ajouts</option>
                          <option value="VENTE">💰 Ventes</option>
                          <option value="RETRAIT_MANUEL">❌ Retraits manuels</option>
                          <option value="SUPPRESSION">🗑️ Suppressions</option>
                        </select>
                      </div>

                      <div className="lg:col-span-1">
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          <svg className="w-4 h-4 inline mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Date de début
                        </label>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white shadow-sm"
                        />
                      </div>

                      <div className="lg:col-span-1">
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          <svg className="w-4 h-4 inline mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Date de fin
                        </label>
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 bg-white shadow-sm"
                        />
                      </div>

                      <div className="lg:col-span-2 flex items-end space-x-3">
                        <button
                          onClick={handleDateFilter}
                          className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center"
                        >
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                          Appliquer les filtres
                        </button>
                        <button
                          onClick={clearHistoriqueFilters}
                          className="flex-1 bg-gradient-to-r from-gray-600 to-gray-700 text-white px-6 py-3 rounded-xl hover:from-gray-700 hover:to-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center"
                        >
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Effacer
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Statistiques améliorées */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 transition-all duration-300">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold mb-2 flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            Total des mouvements
                          </h3>
                          <p className="text-4xl font-bold">{filteredHistorique.length}</p>
                        </div>
                        <div className="text-blue-200">
                          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 transition-all duration-300">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold mb-2 flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Ajouts
                          </h3>
                          <p className="text-4xl font-bold">
                            {filteredHistorique.filter(h => h.type_mouvement === 'AJOUT').length}
                          </p>
                        </div>
                        <div className="text-green-200">
                          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 transition-all duration-300">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold mb-2 flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                            </svg>
                            Ventes
                          </h3>
                          <p className="text-4xl font-bold">
                            {filteredHistorique.filter(h => h.type_mouvement === 'VENTE').length}
                          </p>
                        </div>
                        <div className="text-purple-200">
                          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 transition-all duration-300">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold mb-2 flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Suppressions
                          </h3>
                          <p className="text-4xl font-bold">
                            {filteredHistorique.filter(h => h.type_mouvement === 'SUPPRESSION').length}
                          </p>
                        </div>
                        <div className="text-red-200">
                          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Contrôles de pagination */}
                  <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-200">
                    <div className="flex justify-between items-center">
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
                          Affichage {historiqueIndexOfFirst + 1}-{Math.min(historiqueIndexOfLast, filteredHistorique.length)} sur {filteredHistorique.length} mouvements
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tableau de l'historique amélioré */}
                  <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                    <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        Détail des Mouvements ({filteredHistorique.length} entrées)
                      </h3>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                              <div className="flex items-center">
                                <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                Date & Heure
                              </div>
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                              <div className="flex items-center">
                                <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                                Produit
                              </div>
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                              <div className="flex items-center">
                                <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                </svg>
                                Type
                              </div>
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                              <div className="flex items-center">
                                <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                                Quantité
                              </div>
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                              <div className="flex items-center">
                                <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                Utilisateur
                              </div>
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                              <div className="flex items-center">
                                <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Note
                              </div>
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                          {historiqueLoading ? (
                            <tr>
                              <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                <div className="flex flex-col items-center">
                                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
                                  <p className="text-lg font-medium text-gray-600">Chargement en cours...</p>
                                  <p className="text-gray-500">Récupération des données d'historique</p>
                                </div>
                              </td>
                            </tr>
                          ) : historiqueError ? (
                            <tr>
                              <td colSpan={6} className="px-6 py-12 text-center text-red-500">
                                <div className="flex flex-col items-center">
                                  <svg className="w-16 h-16 text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                  </svg>
                                  <p className="text-xl font-semibold text-red-600 mb-2">Erreur de chargement</p>
                                  <p className="text-red-500">{historiqueError}</p>
                                </div>
                              </td>
                            </tr>
                          ) : filteredHistorique.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="px-6 py-16 text-center text-gray-500">
                                <div className="flex flex-col items-center">
                                  <svg className="w-20 h-20 text-gray-300 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                  </svg>
                                  <p className="text-2xl font-bold text-gray-600 mb-3">Aucun mouvement trouvé</p>
                                  <p className="text-gray-500 text-lg mb-4">Ajustez vos filtres pour voir les résultats</p>
                                  <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
                                    <p className="text-blue-800 text-sm">
                                      💡 <strong>Conseil :</strong> Essayez de modifier les dates ou le type de mouvement
                                    </p>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          ) : (
                            currentHistorique.map((mouvement, index) => (
                              <tr key={mouvement.id} className="hover:bg-blue-50 transition-all duration-200 group">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex flex-col">
                                    <span className="text-sm font-medium text-gray-900">
                                      {new Date(mouvement.created_at).toLocaleDateString('fr-FR')}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {new Date(mouvement.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center space-x-3">
                                    <div className={`w-3 h-3 rounded-full ${mouvement.produit_supprime ? 'bg-red-400' : 'bg-green-400'}`}></div>
                                    <div>
                                      <div className={`font-semibold text-gray-900 ${mouvement.produit_supprime ? 'text-red-600 italic' : ''}`}>
                                        {mouvement.produit?.nom || 'Produit supprimé'}
                                      </div>
                                      <div className={`text-sm text-gray-500 ${mouvement.produit_supprime ? 'text-red-600 italic' : ''}`}>
                                        Code: {mouvement.produit?.code || 'N/A'}
                                      </div>
                                      {mouvement.produit_supprime && (
                                        <div className="mt-1">
                                          <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full font-medium">
                                            🗑️ Produit supprimé
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-full ${getTypeColor(mouvement.type_mouvement)} shadow-sm`}>
                                    {mouvement.type_mouvement === 'AJOUT' && '📦'}
                                    {mouvement.type_mouvement === 'VENTE' && '💰'}
                                    {mouvement.type_mouvement === 'RETRAIT_MANUEL' && '❌'}
                                    {mouvement.type_mouvement === 'SUPPRESSION' && '🗑️'}
                                    <span className="ml-1">{mouvement.type_mouvement}</span>
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <span className={`text-lg font-bold ${
                                      mouvement.type_mouvement === 'AJOUT' ? 'text-green-600' :
                                      mouvement.type_mouvement === 'VENTE' ? 'text-blue-600' :
                                      mouvement.type_mouvement === 'RETRAIT_MANUEL' ? 'text-red-600' :
                                      'text-gray-600'
                                    }`}>
                                      {mouvement.type_mouvement === 'AJOUT' ? '+' : ''}
                                      {mouvement.type_mouvement === 'VENTE' || mouvement.type_mouvement === 'RETRAIT_MANUEL' || mouvement.type_mouvement === 'SUPPRESSION' ? '-' : ''}
                                      {mouvement.quantite}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                      </svg>
                                    </div>
                                    <div>
                                      <div className="text-sm font-medium text-gray-900">
                                        {mouvement.user?.name || 'Utilisateur inconnu'}
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        {mouvement.user?.email || 'Email inconnu'}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="max-w-xs">
                                    {mouvement.note ? (
                                      <div className="bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-700 border border-gray-200">
                                        <p className="truncate">{mouvement.note}</p>
                                      </div>
                                    ) : (
                                      <span className="text-gray-400 text-sm italic">-</span>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Contrôles de pagination du tableau */}
                    {historiqueTotalPages > 1 && (
                      <div className="px-6 py-4 border-t bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-700">
                            Page {historiqueCurrentPage} sur {historiqueTotalPages}
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={handleHistoriquePreviousPage}
                              disabled={historiqueCurrentPage === 1}
                              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                                historiqueCurrentPage === 1
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                              }`}
                            >
                              Précédent
                            </button>
                            
                            {/* Numéros de page */}
                            <div className="flex items-center space-x-1">
                              {Array.from({ length: historiqueTotalPages }, (_, index) => {
                                const pageNumber = index + 1;
                                // Afficher seulement quelques pages autour de la page actuelle
                                if (
                                  pageNumber === 1 ||
                                  pageNumber === historiqueTotalPages ||
                                  (pageNumber >= historiqueCurrentPage - 1 && pageNumber <= historiqueCurrentPage + 1)
                                ) {
                                  return (
                                    <button
                                      key={pageNumber}
                                      onClick={() => handleHistoriquePageChange(pageNumber)}
                                      className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                                        pageNumber === historiqueCurrentPage
                                          ? 'bg-blue-500 text-white'
                                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                      }`}
                                    >
                                      {pageNumber}
                                    </button>
                                  );
                                } else if (
                                  pageNumber === historiqueCurrentPage - 2 ||
                                  pageNumber === historiqueCurrentPage + 2
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
                              onClick={handleHistoriqueNextPage}
                              disabled={historiqueCurrentPage === historiqueTotalPages}
                              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                                historiqueCurrentPage === historiqueTotalPages
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
                  </div>
                </div>
              )}

              {activeTab === 'tva' && (
                <div className="p-8">
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Historique des Modifications TVA</h2>
                    <p className="text-gray-600">Suivez l'historique des changements de TVA sur vos produits</p>
                  </div>
                  <TvaHistoryManagement />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminRoute>
  );
}