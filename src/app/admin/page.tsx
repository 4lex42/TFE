"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { supabaseAdmin } from '../../lib/supabaseAdmin';
import AdminRoute from '../../components/AdminRoute';
import ConfirmationModal from '../../components/ConfirmationModal';
import { CategoryManagement } from '../../components/CategoryManagement';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Magasin {
  id: string;
  location: number;
  adresse: string;
}

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [magasins, setMagasins] = useState<Magasin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    type: 'user' | 'magasin';
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
  const [newMagasin, setNewMagasin] = useState({
    location: 0,
    adresse: ''
  });

  useEffect(() => {
    fetchUsers();
    fetchMagasins();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      const data = await response.json();

      if (!response.ok) throw new Error(data.error);
      setUsers(data.users || []);
    } catch (err) {
      setError('Erreur lors du chargement des utilisateurs');
      console.error('Erreur détaillée:', err);
    }
  };

  const fetchMagasins = async () => {
    try {
      const { data, error } = await supabase
        .from('magasin')
        .select('*');

      if (error) throw error;
      setMagasins(data || []);
    } catch (err) {
      setError('Erreur lors du chargement des magasins');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUser),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      fetchUsers();
      setNewUser({ email: '', name: '', role: 'user', password: '' });
    } catch (err) {
      setError('Erreur lors de la création de l\'utilisateur');
      console.error('Erreur détaillée:', err);
    }
  };

  const handleAddMagasin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('magasin')
        .insert([newMagasin]);

      if (error) throw error;
      fetchMagasins();
      setNewMagasin({ location: 0, adresse: '' });
    } catch (err) {
      setError('Erreur lors de la création du magasin');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users?id=${userId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      fetchUsers();
    } catch (err) {
      setError('Erreur lors de la suppression de l\'utilisateur');
      console.error('Erreur détaillée:', err);
    }
  };

  const handleDeleteMagasin = async (magasinId: string) => {
    try {
      const { error } = await supabase
        .from('magasin')
        .delete()
        .eq('id', magasinId);

      if (error) throw error;
      fetchMagasins();
    } catch (err) {
      setError('Erreur lors de la suppression du magasin');
    }
  };

  const handleConfirmDelete = () => {
    if (deleteConfirmation.type === 'user') {
      handleDeleteUser(deleteConfirmation.id);
    } else {
      handleDeleteMagasin(deleteConfirmation.id);
    }
  };

  if (loading) return <div>Chargement...</div>;

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
          message={`Êtes-vous sûr de vouloir supprimer ${
            deleteConfirmation.type === 'user' ? 'l\'utilisateur' : 'le magasin'
          } ${deleteConfirmation.name} ?`}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Gestion des utilisateurs */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">Gestion des Utilisateurs</h2>
            
            <form onSubmit={handleAddUser} className="mb-6 space-y-4">
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
                      name: user.name
                    })}
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                  >
                    Supprimer
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Gestion des magasins */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">Gestion des Magasins</h2>
            
            <form onSubmit={handleAddMagasin} className="mb-6 space-y-4">
              <div>
                <label className="block mb-1">Location</label>
                <input
                  type="number"
                  value={newMagasin.location}
                  onChange={e => setNewMagasin({...newMagasin, location: parseInt(e.target.value)})}
                  className="w-full border p-2 rounded"
                  required
                />
              </div>
              <div>
                <label className="block mb-1">Adresse</label>
                <input
                  type="text"
                  value={newMagasin.adresse}
                  onChange={e => setNewMagasin({...newMagasin, adresse: e.target.value})}
                  className="w-full border p-2 rounded"
                  required
                />
              </div>
              <button
                type="submit"
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Ajouter un magasin
              </button>
            </form>

            <div className="space-y-4">
              {magasins.map(magasin => (
                <div key={magasin.id} className="p-4 border rounded flex justify-between items-center">
                  <div>
                    <p className="font-semibold">Location: {magasin.location}</p>
                    <p className="text-sm text-gray-600">{magasin.adresse}</p>
                  </div>
                  <button
                    onClick={() => setDeleteConfirmation({
                      isOpen: true,
                      type: 'magasin',
                      id: magasin.id,
                      name: `le magasin ${magasin.location}`
                    })}
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                  >
                    Supprimer
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Gestion des catégories */}
        <div className="mt-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">Gestion des Catégories</h2>
            <CategoryManagement />
          </div>
        </div>
      </div>
    </AdminRoute>
  );
}