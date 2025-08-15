import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface Magasin {
  id: string;
  location: number;
  users?: User[];
  produits?: MagasinProduit[];
}

export interface User {
  id: string;
  name: string | null;
  role: string | null;
  email: string;
}

export interface MagasinProduit {
  id: string;
  id_magasin: string;
  id_produit: string;
  prod_quant: number;
  produit?: {
    id: string;
    nom: string;
    prix: number;
    photo?: string | null;
  };
}

export const useMagasins = () => {
  const [magasins, setMagasins] = useState<Magasin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMagasins = async () => {
    try {
      const { data, error } = await supabase
        .from('magasin')
        .select(`
          *,
          users:lien_user_magasin(
            user_id,
            user:users(id, name, role, email)
          ),
          produits:lien_magasin_produit(
            id,
            prod_quant,
            produit:produit(id, nom, prix, photo)
          )
        `);

      if (error) throw error;
      
      // Transformer les données pour simplifier la structure
      const transformedData = (data || []).map(magasin => ({
        ...magasin,
        users: magasin.users?.map((user: any) => user.user).filter(Boolean) || [],
        produits: magasin.produits?.map((prod: any) => ({
          ...prod,
          produit: prod.produit?.[0] || null,
        })) || [],
      }));
      
      setMagasins(transformedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const addMagasin = async (location: number) => {
    try {
      const { data, error } = await supabase
        .from('magasin')
        .insert([{ location }])
        .select();

      if (error) throw error;
      setMagasins([...magasins, ...(data || [])]);
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Une erreur est survenue' };
    }
  };

  const updateMagasin = async (id: string, location: number) => {
    try {
      const { data, error } = await supabase
        .from('magasin')
        .update({ location })
        .eq('id', id)
        .select();

      if (error) throw error;
      setMagasins(magasins.map(m => m.id === id ? { ...m, location } : m));
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Une erreur est survenue' };
    }
  };

  const deleteMagasin = async (id: string) => {
    try {
      const { error } = await supabase
        .from('magasin')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setMagasins(magasins.filter(m => m.id !== id));
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Une erreur est survenue' };
    }
  };

  const assignUserToMagasin = async (userId: string, magasinId: string) => {
    try {
      const { error } = await supabase
        .from('lien_user_magasin')
        .insert([{ user_id: userId, magasin_id: magasinId }]);

      if (error) throw error;
      await fetchMagasins(); // Rafraîchir les données
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Une erreur est survenue' };
    }
  };

  const removeUserFromMagasin = async (userId: string, magasinId: string) => {
    try {
      const { error } = await supabase
        .from('lien_user_magasin')
        .delete()
        .eq('user_id', userId)
        .eq('magasin_id', magasinId);

      if (error) throw error;
      await fetchMagasins(); // Rafraîchir les données
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Une erreur est survenue' };
    }
  };

  const addProduitToMagasin = async (magasinId: string, produitId: string, quantite: number) => {
    try {
      const { error } = await supabase
        .from('lien_magasin_produit')
        .insert([{ 
          id_magasin: magasinId, 
          id_produit: produitId, 
          prod_quant: quantite 
        }]);

      if (error) throw error;
      await fetchMagasins(); // Rafraîchir les données
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Une erreur est survenue' };
    }
  };

  const updateProduitInMagasin = async (magasinId: string, produitId: string, quantite: number) => {
    try {
      const { error } = await supabase
        .from('lien_magasin_produit')
        .update({ prod_quant: quantite })
        .eq('id_magasin', magasinId)
        .eq('id_produit', produitId);

      if (error) throw error;
      await fetchMagasins(); // Rafraîchir les données
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Une erreur est survenue' };
    }
  };

  const removeProduitFromMagasin = async (magasinId: string, produitId: string) => {
    try {
      const { error } = await supabase
        .from('lien_magasin_produit')
        .delete()
        .eq('id_magasin', magasinId)
        .eq('id_produit', produitId);

      if (error) throw error;
      await fetchMagasins(); // Rafraîchir les données
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Une erreur est survenue' };
    }
  };

  const getMagasinByUser = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('lien_user_magasin')
        .select(`
          magasin_id,
          magasin:magasin(id, location)
        `)
        .eq('user_id', userId);

      if (error) throw error;
      return data?.map((item: any) => item.magasin).filter(Boolean) || [];
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Une erreur est survenue');
    }
  };

  useEffect(() => {
    fetchMagasins();
  }, []);

  return {
    magasins,
    loading,
    error,
    addMagasin,
    updateMagasin,
    deleteMagasin,
    assignUserToMagasin,
    removeUserFromMagasin,
    addProduitToMagasin,
    updateProduitInMagasin,
    removeProduitFromMagasin,
    getMagasinByUser,
    refreshMagasins: fetchMagasins
  };
};
