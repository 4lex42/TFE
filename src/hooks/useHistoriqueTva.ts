import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { HistoriqueTva } from '../types';

export const useHistoriqueTva = () => {
  const [historique, setHistorique] = useState<HistoriqueTva[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistorique = async () => {
    try {
      const { data, error } = await supabase
        .from('historique_tva')
        .select(`
          *,
          produit(id, nom, code),
          user(id, name, email)
        `)
        .order('date_modification', { ascending: false });

      if (error) throw error;
      
      // Transformer les données pour simplifier la structure
      const transformedData = (data || []).map(item => ({
        ...item,
        produit: item.produit?.[0] || null,
        user: item.user?.[0] || null,
      }));
      
      setHistorique(transformedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const addHistoriqueTva = async (historiqueData: Omit<HistoriqueTva, 'id' | 'date_modification'>) => {
    try {
      const { data, error } = await supabase
        .from('historique_tva')
        .insert([historiqueData])
        .select();

      if (error) throw error;
      await fetchHistorique(); // Rafraîchir les données
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Une erreur est survenue' };
    }
  };

  const getHistoriqueByProduit = (produitId: string): HistoriqueTva[] => {
    return historique.filter(item => item.produit_id === produitId);
  };

  const getHistoriqueByDateRange = (startDate: string, endDate: string): HistoriqueTva[] => {
    return historique.filter(item => {
      const itemDate = new Date(item.date_modification);
      const start = new Date(startDate);
      const end = new Date(endDate);
      return itemDate >= start && itemDate <= end;
    });
  };

  useEffect(() => {
    fetchHistorique();
  }, []);

  return {
    historique,
    loading,
    error,
    addHistoriqueTva,
    getHistoriqueByProduit,
    getHistoriqueByDateRange,
    refreshHistorique: fetchHistorique
  };
};
