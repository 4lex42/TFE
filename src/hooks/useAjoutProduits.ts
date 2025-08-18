import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { enregistrerAjoutStockViaAjoutProduits, enregistrerRetraitStock } from '../lib/stockUtils';

export interface AjoutProduit {
  id: string;
  date: string;
  fournisseur: string | null;
  quantity: number;
  type: 'VENTE' | 'RETRAIT_MANUEL' | 'AJOUT';
  note: string | null;
}

export interface AjoutProduitWithProduit extends AjoutProduit {
  produit?: {
    id: string;
    nom: string;
    prix: number;
    photo?: string | null;
  };
}

export const useAjoutProduits = () => {
  const [ajouts, setAjouts] = useState<AjoutProduitWithProduit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAjouts = async () => {
    try {
      const { data, error } = await supabase
        .from('ajout_produits')
        .select(`
          *,
          produit:produit(id, nom, prix, photo)
        `)
        .order('date', { ascending: false });

      if (error) throw error;
      
      // Transformer les données pour simplifier la structure
      const transformedData = (data || []).map(ajout => ({
        ...ajout,
        produit: ajout.produit?.[0] || null,
      }));
      
      setAjouts(transformedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const addAjoutProduit = async (ajoutData: Omit<AjoutProduit, 'id'>, produitId?: string) => {
    try {
      // Créer l'ajout de produit
      const { data: ajout, error: ajoutError } = await supabase
        .from('ajout_produits')
        .insert([ajoutData])
        .select()
        .single();

      if (ajoutError) throw ajoutError;

      // Si un produit est spécifié, mettre à jour sa quantité
      if (produitId) {
        const { error: updateError } = await supabase
          .from('produit')
          .update({ 
            quantity: supabase.rpc('increment_quantity', { 
              produit_id: produitId, 
              amount: ajoutData.quantity 
            }),
            ajout_produit_id: ajout.id
          })
          .eq('id', produitId);

        if (updateError) throw updateError;

        // Enregistrer l'ajout dans l'historique via ajout_produits
        await enregistrerAjoutStockViaAjoutProduits(
          ajout.id,
          ajoutData.quantity,
          ajoutData.note || 'Ajout de stock',
          undefined,
          produitId
        );
      }

      await fetchAjouts(); // Rafraîchir les données
      return { success: true, data: ajout };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Une erreur est survenue' };
    }
  };

  const updateAjoutProduit = async (id: string, updates: Partial<AjoutProduit>) => {
    try {
      const { data, error } = await supabase
        .from('ajout_produits')
        .update(updates)
        .eq('id', id)
        .select();

      if (error) throw error;
      setAjouts(ajouts.map(a => a.id === id ? { ...a, ...updates } : a));
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Une erreur est survenue' };
    }
  };

  const deleteAjoutProduit = async (id: string) => {
    try {
      // Récupérer l'ajout avant suppression pour ajuster la quantité du produit
      const { data: ajout, error: fetchError } = await supabase
        .from('ajout_produits')
        .select('quantity')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      // Trouver le produit associé
      const { data: produit, error: produitError } = await supabase
        .from('produit')
        .select('id, quantity')
        .eq('ajout_produit_id', id)
        .single();

      if (produit && ajout) {
        // Ajuster la quantité du produit
        const { error: updateError } = await supabase
          .from('produit')
          .update({ 
            quantity: produit.quantity - ajout.quantity,
            ajout_produit_id: null
          })
          .eq('id', produit.id);

        if (updateError) throw updateError;

        // Enregistrer le retrait dans l'historique
        await enregistrerRetraitStock(
          produit.id,
          ajout.quantity,
          'Suppression de l\'ajout de stock'
        );
      }

      // Supprimer l'ajout
      const { error: deleteError } = await supabase
        .from('ajout_produits')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setAjouts(ajouts.filter(a => a.id !== id));
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Une erreur est survenue' };
    }
  };

  const getAjoutStats = async (startDate?: string, endDate?: string) => {
    try {
      let query = supabase
        .from('ajout_produits')
        .select('quantity, type, date');

      if (startDate) {
        query = query.gte('date', startDate);
      }
      if (endDate) {
        query = query.lte('date', endDate);
      }

      const { data, error } = await query;

      if (error) throw error;

      const stats = {
        total_ajouts: data?.filter(item => item.type === 'AJOUT').reduce((sum, item) => sum + item.quantity, 0) || 0,
        total_ventes: data?.filter(item => item.type === 'VENTE').reduce((sum, item) => sum + item.quantity, 0) || 0,
        total_retraits: data?.filter(item => item.type === 'RETRAIT_MANUEL').reduce((sum, item) => sum + item.quantity, 0) || 0,
        nombre_operations: data?.length || 0,
      };

      return stats;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Une erreur est survenue');
    }
  };

  useEffect(() => {
    fetchAjouts();
  }, []);

  return {
    ajouts,
    loading,
    error,
    addAjoutProduit,
    updateAjoutProduit,
    deleteAjoutProduit,
    getAjoutStats,
    refreshAjouts: fetchAjouts
  };
};
