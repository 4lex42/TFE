import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface Achat {
  id: string;
  client_id: string | null;
  date: string;
  mode_paiement: string;
  produits?: AchatProduit[];
}

export interface AchatProduit {
  id: string;
  achat_id: string;
  produit_id: string;
  quantite: number;
  prix_unitaire: number;
  produit?: {
    id: string;
    nom: string;
    prix: number;
    photo?: string | null;
  };
}

export interface VenteStats {
  total_ventes: number;
  total_revenus: number;
  produits_vendus: number;
  date_range: {
    start: string;
    end: string;
  };
}

export const useVentes = () => {
  const [achats, setAchats] = useState<Achat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAchats = async () => {
    try {
      const { data, error } = await supabase
        .from('achat')
        .select(`
          *,
          produits:achat_produit(
            id,
            quantite,
            prix_unitaire,
            produit:produit(id, nom, prix, photo)
          )
        `)
        .order('date', { ascending: false });

      if (error) throw error;
      
      // Transformer les données pour simplifier la structure
      const transformedData = (data || []).map(achat => ({
        ...achat,
        produits: achat.produits?.map((prod: any) => ({
          ...prod,
          produit: prod.produit?.[0] || null,
        })) || [],
      }));
      
      setAchats(transformedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const createAchat = async (achatData: Omit<Achat, 'id' | 'produits'>, produits: Array<{ produit_id: string; quantite: number; prix_unitaire: number }>) => {
    try {
      // Créer l'achat
      const { data: achat, error: achatError } = await supabase
        .from('achat')
        .insert([achatData])
        .select()
        .single();

      if (achatError) throw achatError;

      // Ajouter les produits à l'achat
      const produitsWithAchatId = produits.map(prod => ({
        ...prod,
        achat_id: achat.id,
      }));

      const { error: produitsError } = await supabase
        .from('achat_produit')
        .insert(produitsWithAchatId);

      if (produitsError) throw produitsError;

      // Mettre à jour les quantités des produits
      for (const produit of produits) {
        const { error: updateError } = await supabase
          .from('produit')
          .update({ 
            quantity: supabase.rpc('decrement_quantity', { 
              produit_id: produit.produit_id, 
              amount: produit.quantite 
            })
          })
          .eq('id', produit.produit_id);

        if (updateError) throw updateError;
      }

      await fetchAchats(); // Rafraîchir les données
      return { success: true, data: achat };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Une erreur est survenue' };
    }
  };

  const getVenteStats = async (startDate?: string, endDate?: string): Promise<VenteStats> => {
    try {
      let query = supabase
        .from('achat_produit')
        .select(`
          quantite,
          prix_unitaire,
          achat!inner(date)
        `);

      if (startDate) {
        query = query.gte('achat.date', startDate);
      }
      if (endDate) {
        query = query.lte('achat.date', endDate);
      }

      const { data, error } = await query;

      if (error) throw error;

      const stats: VenteStats = {
        total_ventes: data?.length || 0,
        total_revenus: data?.reduce((sum, item) => sum + (item.quantite * item.prix_unitaire), 0) || 0,
        produits_vendus: data?.reduce((sum, item) => sum + item.quantite, 0) || 0,
        date_range: {
          start: startDate || '',
          end: endDate || '',
        },
      };

      return stats;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Une erreur est survenue');
    }
  };

  const deleteAchat = async (id: string) => {
    try {
      // Récupérer les produits de l'achat avant suppression
      const { data: produits, error: fetchError } = await supabase
        .from('achat_produit')
        .select('produit_id, quantite')
        .eq('achat_id', id);

      if (fetchError) throw fetchError;

      // Supprimer l'achat (cascade supprimera automatiquement les achat_produit)
      const { error: deleteError } = await supabase
        .from('achat')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      // Restaurer les quantités des produits
      for (const produit of produits || []) {
        const { error: updateError } = await supabase
          .from('produit')
          .update({ 
            quantity: supabase.rpc('increment_quantity', { 
              produit_id: produit.produit_id, 
              amount: produit.quantite 
            })
          })
          .eq('id', produit.produit_id);

        if (updateError) throw updateError;
      }

      setAchats(achats.filter(a => a.id !== id));
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Une erreur est survenue' };
    }
  };

  useEffect(() => {
    fetchAchats();
  }, []);

  return {
    achats,
    loading,
    error,
    createAchat,
    deleteAchat,
    getVenteStats,
    refreshAchats: fetchAchats
  };
};
