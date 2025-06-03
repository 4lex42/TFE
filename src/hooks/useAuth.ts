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