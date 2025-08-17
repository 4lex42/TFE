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
            status: 'pending', // Nouveaux utilisateurs sont en attente d'approbation
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

  const updateUserStatus = async (userId: string, newStatus: 'pending' | 'approved' | 'rejected') => {
    try {
      // Récupérer les informations de l'utilisateur avant la mise à jour
      const user = users.find(u => u.id === userId);
      if (!user) {
        throw new Error('Utilisateur non trouvé');
      }

      // Mettre à jour le statut
      const { error } = await supabase
        .from('users')
        .update({ status: newStatus })
        .eq('id', userId);

      if (error) throw error;

      // Mettre à jour l'état local
      setUsers(users.map(u => 
        u.id === userId ? { ...u, status: newStatus } : u
      ));

      // Envoyer un email selon le statut
      if (newStatus === 'rejected') {
        // Envoyer un email de rejet
        await sendRejectionEmail(user.email, user.name);
      } else if (newStatus === 'approved') {
        // Envoyer un email d'approbation
        await sendApprovalEmail(user.email, user.name);
      }

      return { success: true };
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Une erreur est survenue lors de la mise à jour du statut' 
      };
    }
  };

  const sendRejectionEmail = async (email: string, name: string | null) => {
    try {
      // Utiliser l'API Supabase pour envoyer un email de rejet
      const { error } = await supabase.auth.admin.generateLink({
        type: 'recovery',
        email: email,
      });

      if (error) {
        console.error('Erreur lors de l\'envoi de l\'email de rejet:', error);
        // Fallback: utiliser l'API d'envoi d'email personnalisée
        await sendCustomRejectionEmail(email, name);
      }
    } catch (err) {
      console.error('Erreur lors de l\'envoi de l\'email de rejet:', err);
      // Fallback: utiliser l'API d'envoi d'email personnalisée
      await sendCustomRejectionEmail(email, name);
    }
  };

  const sendApprovalEmail = async (email: string, name: string | null) => {
    try {
      // Envoyer un email d'approbation
      await sendCustomApprovalEmail(email, name);
    } catch (err) {
      console.error('Erreur lors de l\'envoi de l\'email d\'approbation:', err);
    }
  };

  const sendCustomRejectionEmail = async (email: string, name: string | null) => {
    try {
      // Appeler votre API d'envoi d'email personnalisée
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: email,
          subject: 'Demande d\'inscription rejetée',
          template: 'rejection',
          data: {
            name: name || 'Utilisateur',
            reason: 'Votre demande d\'inscription a été rejetée par l\'administrateur.',
            contact: 'Veuillez contacter l\'administrateur pour plus d\'informations.'
          }
        })
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'envoi de l\'email');
      }
    } catch (err) {
      console.error('Erreur lors de l\'envoi de l\'email personnalisé:', err);
    }
  };

  const sendCustomApprovalEmail = async (email: string, name: string | null) => {
    try {
      // Appeler votre API d'envoi d'email personnalisée
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: email,
          subject: 'Compte approuvé - Connexion autorisée',
          template: 'approval',
          data: {
            name: name || 'Utilisateur',
            message: 'Votre compte a été approuvé par l\'administrateur. Vous pouvez maintenant vous connecter.',
            loginUrl: `${window.location.origin}/login`
          }
        })
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'envoi de l\'email');
      }
    } catch (err) {
      console.error('Erreur lors de l\'envoi de l\'email personnalisé:', err);
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
