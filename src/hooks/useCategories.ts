import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface Categorie {
  id: string;
  nom_categorie: string;
}

export const useCategories = () => {
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categorie')
        .select('*')
        .order('nom_categorie');

      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const addCategorie = async (nom_categorie: string) => {
    try {
      const { data, error } = await supabase
        .from('categorie')
        .insert([{ nom_categorie }])
        .select();

      if (error) throw error;
      setCategories([...categories, ...(data || [])]);
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Une erreur est survenue' };
    }
  };

  const updateCategorie = async (id: string, nom_categorie: string) => {
    try {
      const { data, error } = await supabase
        .from('categorie')
        .update({ nom_categorie })
        .eq('id', id)
        .select();

      if (error) throw error;
      setCategories(categories.map(c => c.id === id ? { ...c, nom_categorie } : c));
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Une erreur est survenue' };
    }
  };

  const deleteCategorie = async (id: string) => {
    try {
      const { error } = await supabase
        .from('categorie')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setCategories(categories.filter(c => c.id !== id));
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Une erreur est survenue' };
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return {
    categories,
    loading,
    error,
    addCategorie,
    updateCategorie,
    deleteCategorie,
    refreshCategories: fetchCategories
  };
}; 