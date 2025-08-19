import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { HistoriqueStock } from '../types';

export const useHistoriqueStock = () => {
  const [historique, setHistorique] = useState<HistoriqueStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistorique = async () => {
    try {
      const { data, error } = await supabase
        .from('historique_stock')
        .select(`
          *,
          produit(id, nom, code),
          users(id, name, email)
        `)
        .order('created_at', { ascending: false });



      if (error) throw error;
      
      // Transformer les données pour simplifier la structure
      const transformedData = (data || []).map(item => {
        // Vérifier si c'est le format SQL direct ou jointure Supabase
        if (item.produit_nom) {
          // Format SQL direct
          return {
            ...item,
            produit: {
              id: item.produit_id,
              nom: item.produit_nom,
              code: item.produit_code
            },
            user: {
              id: item.user_id,
              name: item.user_name,
              email: item.user_email
            },
            produit_supprime: item.produit_id === null
          };
        } else {
          // Format jointure Supabase
          return {
            ...item,
            produit: item.produit || { id: null, nom: 'Produit supprimé', code: 'N/A' },
            user: item.users || null,
            produit_supprime: item.produit_id === null
          };
        }
      });
      
      setHistorique(transformedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const addMouvement = async (mouvementData: Omit<HistoriqueStock, 'id' | 'created_at' | 'produit' | 'user'>) => {
    try {
      const { data, error } = await supabase
        .from('historique_stock')
        .insert([mouvementData])
        .select()
        .single();

      if (error) throw error;
      
      // Ajouter le nouveau mouvement à l'état local
      setHistorique(prev => [data, ...prev]);
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Une erreur est survenue' };
    }
  };

  const getHistoriqueByProduit = async (produitId: string) => {
    try {
      const { data, error } = await supabase
        .from('historique_stock')
        .select(`
          *,
          produit(id, nom, code),
          users(id, name, email),
          ajout_produit:ajout_produits(id, date, fournisseur, quantity, type, note)
        `)
        .eq('produit_id', produitId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const transformedData = (data || []).map(item => ({
        ...item,
        produit: item.produit?.[0] || { id: null, nom: 'Produit supprimé', code: 'N/A' },
        user: item.users || null,
        ajout_produit: item.ajout_produit?.[0] || null,
        produit_supprime: item.produit_id === null
      }));
      
      return { success: true, data: transformedData };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Une erreur est survenue' };
    }
  };

  const getHistoriqueByUser = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('historique_stock')
        .select(`
          *,
          produit(id, nom, code),
          users(id, name, email)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const transformedData = (data || []).map(item => ({
        ...item,
        produit: item.produit?.[0] || { id: null, nom: 'Produit supprimé', code: 'N/A' },
        user: item.users?.[0] || null,
        produit_supprime: item.produit_id === null
      }));
      
      return { success: true, data: transformedData };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Une erreur est survenue' };
    }
  };

  const getHistoriqueByType = async (typeMouvement: 'AJOUT' | 'VENTE' | 'RETRAIT_MANUEL' | 'SUPPRESSION'): Promise<{ success: true; data: HistoriqueStock[] } | { success: false; error: string }> => {
    try {
      const { data, error } = await supabase
        .from('historique_stock')
        .select(`
          *,
          produit(id, nom, code),
          users(id, name, email)
        `)
        .eq('type_mouvement', typeMouvement)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const transformedData = (data || []).map(item => ({
        ...item,
        produit: item.produit?.[0] || { id: null, nom: 'Produit supprimé', code: 'N/A' },
        user: item.users?.[0] || null,
        produit_supprime: item.produit_id === null
      }));
      
      return { success: true, data: transformedData };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Une erreur est survenue' };
    }
  };

  const getHistoriqueByDateRange = async (startDate: string, endDate: string): Promise<{ success: true; data: HistoriqueStock[] } | { success: false; error: string }> => {
    try {
      const { data, error } = await supabase
        .from('historique_stock')
        .select(`
          *,
          produit(id, nom, code),
          users(id, name, email)
        `)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const transformedData = (data || []).map(item => ({
        ...item,
        produit: item.produit?.[0] || { id: null, nom: 'Produit supprimé', code: 'N/A' },
        user: item.users?.[0] || null,
        produit_supprime: item.produit_id === null
      }));
      
      return { success: true, data: transformedData };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Une erreur est survenue' };
    }
  };

  useEffect(() => {
    fetchHistorique();
  }, []);

  return {
    historique,
    loading,
    error,
    addMouvement,
    getHistoriqueByProduit,
    getHistoriqueByUser,
    getHistoriqueByType,
    getHistoriqueByDateRange,
    refreshHistorique: fetchHistorique
  };
};
