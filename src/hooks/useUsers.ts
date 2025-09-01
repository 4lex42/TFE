import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface User {
  id: string;
  name: string | null;
  email: string;
  role: string | null;
  status: 'pending' | 'approved' | 'rejected';
}

export interface CreateUserData {
  email: string;
  name: string;
  role: string;
  password: string;
}

export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, role, status')
        .order('name');

      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const createUser = async (userData: CreateUserData) => {
    try {
      // Utiliser l'endpoint API côté serveur pour créer l'utilisateur
      const response = await fetch('/api/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de la création de l\'utilisateur');
      }

      if (result.success) {
        await fetchUsers(); // Rafraîchir la liste des utilisateurs
        return { success: true, data: result.data };
      } else {
        throw new Error(result.error || 'Erreur lors de la création de l\'utilisateur');
      }
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Une erreur est survenue lors de la création de l\'utilisateur' 
      };
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ));

      return { success: true };
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Une erreur est survenue lors de la mise à jour du rôle' 
      };
    }
  };

  const updateUserStatus = async (userId: string, newStatus: 'pending' | 'approved' | 'rejected') => {
    try {
      // Utiliser l'endpoint API côté serveur pour mettre à jour le statut
      const response = await fetch('/api/update-user-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, newStatus }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de la mise à jour du statut');
      }

      if (result.success) {
        // Mettre à jour l'état local
        setUsers(users.map(u => 
          u.id === userId ? { ...u, status: newStatus } : u
        ));
        return { success: true };
      } else {
        throw new Error(result.error || 'Erreur lors de la mise à jour du statut');
      }
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Une erreur est survenue lors de la mise à jour du statut' 
      };
    }
  };



  const deleteUser = async (userId: string) => {
    try {
      // Supprimer l'utilisateur de la table users uniquement
      // Note: On ne supprime pas de l'auth Supabase car cela nécessite des permissions spéciales
      const { error: profileError } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (profileError) throw profileError;

      // Mettre à jour l'état local
      setUsers(users.filter(user => user.id !== userId));
      
      return { success: true };
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Une erreur est survenue lors de la suppression de l\'utilisateur' 
      };
    }
  };

  const getUserById = async (userId: string): Promise<User | null> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, role, status')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      return null;
    }
  };

  const getUsersByRole = async (role: string): Promise<User[]> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, role, status')
        .eq('role', role)
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      return [];
    }
  };

  const searchUsers = async (searchTerm: string): Promise<User[]> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, role, status')
        .or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      return [];
    }
  };

  const updateUserProfile = async (userId: string, updates: Partial<Omit<User, 'id'>>) => {
    try {
      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId);

      if (error) throw error;

      setUsers(users.map(user => 
        user.id === userId ? { ...user, ...updates } : user
      ));

      return { success: true };
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Une erreur est survenue lors de la mise à jour du profil' 
      };
    }
  };

  const resetUserPassword = async (userId: string) => {
    try {
      const user = await getUserById(userId);
      if (!user) throw new Error('Utilisateur non trouvé');

      const { error } = await supabase.auth.admin.generateLink({
        type: 'recovery',
        email: user.email,
      });

      if (error) throw error;

      return { success: true };
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Une erreur est survenue lors de la réinitialisation du mot de passe' 
      };
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return {
    users,
    loading,
    error,
    createUser,
    updateUserRole,
    updateUserStatus,
    deleteUser,
    getUserById,
    getUsersByRole,
    searchUsers,
    updateUserProfile,
    resetUserPassword,
    refreshUsers: fetchUsers
  };
};
