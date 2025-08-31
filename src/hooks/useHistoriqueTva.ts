import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { HistoriqueTva } from '../types';

export const useHistoriqueTva = () => {
  const [historique, setHistorique] = useState<HistoriqueTva[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistorique = async () => {
    try {
      // Récupérer d'abord l'historique TVA
      const { data: historiqueData, error: historiqueError } = await supabase
        .from('historique_tva')
        .select('*')
        .order('date_modification', { ascending: false });

      if (historiqueError) throw historiqueError;

      // Récupérer les informations des produits
      const produitIds = [...new Set(historiqueData?.map(item => item.produit_id).filter(Boolean) || [])];
      const { data: produitsData, error: produitsError } = await supabase
        .from('produit')
        .select('id, nom, code')
        .in('id', produitIds);

      if (produitsError) throw produitsError;

      // Récupérer les informations des utilisateurs
      const userIds = [...new Set(historiqueData?.map(item => item.user_id).filter(Boolean) || [])];
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, name, email')
        .in('id', userIds);

      if (usersError) throw usersError;

      // Créer des maps pour un accès rapide
      const produitsMap = new Map(produitsData?.map(p => [p.id, p]) || []);
      const usersMap = new Map(usersData?.map(u => [u.id, u]) || []);

      // Transformer les données en combinant toutes les informations
      const transformedData = (historiqueData || []).map(item => ({
        ...item,
        produit: item.produit_id ? produitsMap.get(item.produit_id) || null : null,
        user: item.user_id ? usersMap.get(item.user_id) || null : null,
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
