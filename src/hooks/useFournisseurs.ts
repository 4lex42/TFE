import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface Fournisseur {
  id: string;
  nom: string;
  email: string | null;
  telephone: string | null;
  note: string | null;
  created_at: string | null;
}

export const useFournisseurs = () => {
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFournisseurs = async () => {
    try {
      const { data, error } = await supabase
        .from('fournisseurs')
        .select('*')
        .order('nom');

      if (error) throw error;
      setFournisseurs(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const addFournisseur = async (payload: Omit<Fournisseur, 'id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('fournisseurs')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;
      if (data) setFournisseurs(prev => [...prev, data]);
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Une erreur est survenue' };
    }
  };

  const deleteFournisseur = async (id: string) => {
    try {
      const { error } = await supabase
        .from('fournisseurs')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setFournisseurs(prev => prev.filter(f => f.id !== id));
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Une erreur est survenue' };
    }
  };

  const updateFournisseur = async (id: string, updates: Partial<Omit<Fournisseur, 'id' | 'created_at'>>) => {
    try {
      const { data, error } = await supabase
        .from('fournisseurs')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setFournisseurs(prev => prev.map(f => f.id === id ? data : f));
      }
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Une erreur est survenue' };
    }
  };

  const searchFournisseurs = (term: string) => {
    const t = term.toLowerCase().trim();
    if (!t) return fournisseurs;
    return fournisseurs.filter(f =>
      f.nom.toLowerCase().includes(t) ||
      (f.email || '').toLowerCase().includes(t) ||
      (f.telephone || '').toLowerCase().includes(t)
    );
  };

  useEffect(() => {
    fetchFournisseurs();
  }, []);

  return {
    fournisseurs,
    loading,
    error,
    addFournisseur,
    deleteFournisseur,
    updateFournisseur,
    searchFournisseurs,
    refreshFournisseurs: fetchFournisseurs,
  };
};
