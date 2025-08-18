import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { enregistrerVenteStock } from '../lib/stockUtils';
import { useAuth } from './useAuth';

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
  tva_appliquee?: number;
  produit?: {
    id: string;
    nom: string;
    prix: number;
    photo?: string | null;
    tva_direct?: number;
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
  const { user } = useAuth();

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
            tva_appliquee,
            produit:produit(id, nom, prix, photo, tva_direct)
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

      // Récupérer les informations TVA des produits et ajouter à l'achat
      const produitsWithTva = await Promise.all(
        produits.map(async (prod) => {
          const { data: produitData } = await supabase
            .from('produit')
            .select('tva_direct')
            .eq('id', prod.produit_id)
            .single();
          
          return {
            ...prod,
            achat_id: achat.id,
            tva_appliquee: produitData?.tva_direct || 20.00,
          };
        })
      );

      const { error: produitsError } = await supabase
        .from('achat_produit')
        .insert(produitsWithTva);

      if (produitsError) throw produitsError;

      // Mettre à jour les quantités des produits et enregistrer dans l'historique
      for (const produit of produits) {
        // Mettre à jour le stock
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

        // Enregistrer la vente dans l'historique
        await enregistrerVenteStock(
          produit.produit_id,
          produit.quantite,
          `Vente - Achat #${achat.id}`,
          user?.id
        );
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
