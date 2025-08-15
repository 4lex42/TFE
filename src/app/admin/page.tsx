"use client";

import React, { useState } from 'react';
import AdminRoute from '../../components/AdminRoute';
import ConfirmationModal from '../../components/ConfirmationModal';
import { CategoryManagement } from '../../components/CategoryManagement';
import { UserRoleManagement } from '../../components/UserRoleManagement';
import { FournisseursManagement } from '../../components/FournisseursManagement';
import { useUsers } from '../../hooks/useUsers';

export default function AdminPage() {
  const { users, createUser, deleteUser } = useUsers();
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'categories' | 'fournisseurs'>('users');
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
                  <div key={user.id} className="p-4 border rounded flex justify-between items-center">
                    <div>
                      <p className="font-semibold">{user.name}</p>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      <p className="text-sm text-gray-600">Rôle: {user.role}</p>
                    </div>
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
        </div>
      </div>
    </AdminRoute>
  );
}