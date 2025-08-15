import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface Tva {
  id: string;
  date: string;
  tva: number;
}

export const useTva = () => {
  const [tvas, setTvas] = useState<Tva[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTvas = async () => {
    try {
      const { data, error } = await supabase
        .from('tva')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      setTvas(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const addTva = async (newTva: Omit<Tva, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('tva')
        .insert([newTva])
        .select();

      if (error) throw error;
      setTvas([...tvas, ...(data || [])]);
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Une erreur est survenue' };
    }
  };

  const updateTva = async (id: string, updates: Partial<Tva>) => {
    try {
      const { data, error } = await supabase
        .from('tva')
        .update(updates)
        .eq('id', id)
        .select();

      if (error) throw error;
      setTvas(tvas.map(t => t.id === id ? { ...t, ...updates } : t));
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Une erreur est survenue' };
    }
  };

  const deleteTva = async (id: string) => {
    try {
      const { error } = await supabase
        .from('tva')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setTvas(tvas.filter(t => t.id !== id));
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Une erreur est survenue' };
    }
  };

  const getCurrentTva = (): Tva | null => {
    if (tvas.length === 0) return null;
    
    // Retourner la TVA la plus récente
    return tvas[0];
  };

  const getTvaByDate = (date: string): Tva | null => {
    // Trouver la TVA applicable à une date donnée
    const applicableTva = tvas.find(tva => tva.date <= date);
    return applicableTva || null;
  };

  const calculatePriceWithTva = (price: number, tvaRate?: number): number => {
    const tva = tvaRate || getCurrentTva()?.tva || 0;
    return price * (1 + tva / 100);
  };

  const calculateTvaAmount = (price: number, tvaRate?: number): number => {
    const tva = tvaRate || getCurrentTva()?.tva || 0;
    return price * (tva / 100);
  };

  useEffect(() => {
    fetchTvas();
  }, []);

  return {
    tvas,
    loading,
    error,
    addTva,
    updateTva,
    deleteTva,
    getCurrentTva,
    getTvaByDate,
    calculatePriceWithTva,
    calculateTvaAmount,
    refreshTvas: fetchTvas
  };
};
