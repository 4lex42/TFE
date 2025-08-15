import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface User {
  id: string;
  name: string | null;
  email: string;
  role: string | null;
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
        .select('id, name, email, role')
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
      // Créer l'utilisateur dans auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: {
          name: userData.name,
          role: userData.role,
        }
      });

      if (authError) throw authError;

      // Ajouter les informations dans la table users
      if (authData.user) {
        const { error: profileError } = await supabase
          .from('users')
          .insert([{
            id: authData.user.id,
            email: userData.email,
            name: userData.name,
            role: userData.role,
          }]);

        if (profileError) throw profileError;
      }

      await fetchUsers();
      return { success: true, data: authData };
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

  const deleteUser = async (userId: string) => {
    try {
      // Supprimer l'utilisateur de auth
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);
      if (authError) throw authError;

      // Supprimer de la table users
      const { error: profileError } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (profileError) throw profileError;

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
        .select('id, name, email, role')
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
        .select('id, name, email, role')
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
        .select('id, name, email, role')
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
    deleteUser,
    getUserById,
    getUsersByRole,
    searchUsers,
    updateUserProfile,
    resetUserPassword,
    refreshUsers: fetchUsers
  };
};
