import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Vérifier l'état de l'authentification actuelle
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Vérifier le statut d'approbation de l'utilisateur
      if (data.user) {
        const { data: userProfile, error: profileError } = await supabase
          .from('users')
          .select('status')
          .eq('id', data.user.id)
          .single();

        if (profileError) throw profileError;

        if (userProfile.status === 'pending') {
          await supabase.auth.signOut();
          return { 
            success: false, 
            error: 'Votre compte est en attente d\'approbation par un administrateur. Vous recevrez un email de confirmation une fois approuvé.' 
          };
        }

        if (userProfile.status === 'rejected') {
          await supabase.auth.signOut();
          return { 
            success: false, 
            error: 'Votre compte a été rejeté. Veuillez contacter l\'administrateur pour plus d\'informations.' 
          };
        }


      }

      return { success: true, data };
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Une erreur est survenue lors de la connexion' 
      };
    }
  };

  const signUp = async (email: string, password: string, name: string, role: string = 'user') => {
    try {
      // Créer l'utilisateur dans auth avec vérification d'email
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (authError) throw authError;

      // Ajouter les informations supplémentaires dans la table users
      if (authData.user) {
        const { error: profileError } = await supabase
          .from('users')
          .insert([
            {
              id: authData.user.id,
              email,
              name,
              role,
              status: 'pending', // Nouveaux utilisateurs sont en attente d'approbation
            }
          ]);

        if (profileError) throw profileError;
      }

      return { 
        success: true, 
        data: authData,
        message: "Un email de confirmation vous a été envoyé. Veuillez vérifier votre boîte de réception."
      };
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Une erreur est survenue lors de l\'inscription' 
      };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { success: true };
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Une erreur est survenue lors de la déconnexion' 
      };
    }
  };

  const getUserProfile = async () => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      return null;
    }
  };

  return {
    user,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    getUserProfile,
  };
}; 