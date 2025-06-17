import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface Produit {
  id: string;
  nom: string;
  quantity: number;
  quantity_critique: number;
  prix: number;
  code: string;
  photo?: string | null;
  description: string | null;
}

export const useProduits = () => {
  const [produits, setProduits] = useState<Produit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProduits = async () => {
    try {
      const { data, error } = await supabase
        .from('produit')
        .select('*');

      if (error) throw error;
      setProduits(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const addProduit = async (newProduit: Omit<Produit, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('produit')
        .insert([newProduit])
        .select();

      if (error) throw error;
      setProduits([...produits, ...(data || [])]);
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Une erreur est survenue' };
    }
  };

  const updateProduit = async (id: string, updates: Partial<Produit>) => {
    try {
      const { data, error } = await supabase
        .from('produit')
        .update(updates)
        .eq('id', id)
        .select();

      if (error) throw error;
      setProduits(produits.map(p => p.id === id ? { ...p, ...updates } : p));
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Une erreur est survenue' };
    }
  };

  const deleteProduit = async (id: string) => {
    try {
      const { error } = await supabase
        .from('produit')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setProduits(produits.filter(p => p.id !== id));
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Une erreur est survenue' };
    }
  };

  useEffect(() => {
    fetchProduits();
  }, []);

  return {
    produits,
    loading,
    error,
    addProduit,
    updateProduit,
    deleteProduit,
    refreshProduits: fetchProduits
  };
}; 