import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { linearRegression } from 'simple-statistics';

export interface Prediction {
  id: string;
  date: string;
  prod_prix: number;
  ventes: number;
}

export interface PredictionResult {
  predictedSales: number;
  confidence: number;
}

export const usePredictions = (productId?: string) => {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPredictions = async () => {
    try {
      let query = supabase
        .from('predictions')
        .select('*')
        .order('date', { ascending: true });

      // Si un productId est fourni, récupérer les prédictions liées à ce produit
      if (productId) {
        const { data: produit, error: produitError } = await supabase
          .from('produit')
          .select('predict_id')
          .eq('id', productId)
          .single();

        if (produitError) throw produitError;
        
        if (produit?.predict_id) {
          query = query.eq('id', produit.predict_id);
        } else {
          setPredictions([]);
          setLoading(false);
          return;
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      setPredictions(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllPredictions = async () => {
    try {
      const { data, error } = await supabase
        .from('predictions')
        .select('*')
        .order('date', { ascending: true });

      if (error) throw error;
      setPredictions(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const calculatePrediction = (historicalData: Prediction[]): PredictionResult => {
    if (historicalData.length < 2) {
      return {
        predictedSales: 0,
        confidence: 0
      };
    }

    // Préparer les données pour la régression linéaire
    const data = historicalData.map((item, index) => [index, item.ventes]);
    
    // Calculer la régression linéaire
    const regression = linearRegression(data);
    
    // Prédire les ventes pour la prochaine période
    const nextPeriod = data.length;
    const predictedSales = regression.m * nextPeriod + regression.b;

    // Calculer le coefficient de détermination (R²) comme mesure de confiance
    const mean = data.reduce((sum, [_, y]) => sum + y, 0) / data.length;
    const ssTotal = data.reduce((sum, [_, y]) => sum + Math.pow(y - mean, 2), 0);
    const ssResidual = data.reduce((sum, [x, y]) => {
      const predicted = regression.m * x + regression.b;
      return sum + Math.pow(y - predicted, 2);
    }, 0);
    const rSquared = 1 - (ssResidual / ssTotal);

    return {
      predictedSales: Math.max(0, Math.round(predictedSales)), // Éviter les prédictions négatives
      confidence: Math.round(rSquared * 100) // Convertir en pourcentage
    };
  };

  const addPrediction = async (newPrediction: Omit<Prediction, 'id'>, productId?: string) => {
    try {
      // Créer la prédiction
      const { data: prediction, error: predictionError } = await supabase
        .from('predictions')
        .insert([newPrediction])
        .select()
        .single();

      if (predictionError) throw predictionError;

      // Si un productId est fourni, lier la prédiction au produit
      if (productId && prediction) {
        const { error: updateError } = await supabase
          .from('produit')
          .update({ predict_id: prediction.id })
          .eq('id', productId);

        if (updateError) throw updateError;
      }

      setPredictions([...predictions, prediction]);
      return { success: true, data: prediction };
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Une erreur est survenue' 
      };
    }
  };

  const updatePrediction = async (id: string, updates: Partial<Prediction>) => {
    try {
      const { data, error } = await supabase
        .from('predictions')
        .update(updates)
        .eq('id', id)
        .select();

      if (error) throw error;
      setPredictions(predictions.map(p => p.id === id ? { ...p, ...updates } : p));
      return { success: true, data };
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Une erreur est survenue' 
      };
    }
  };

  const deletePrediction = async (id: string) => {
    try {
      const { error } = await supabase
        .from('predictions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setPredictions(predictions.filter(p => p.id !== id));
      return { success: true };
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Une erreur est survenue' 
      };
    }
  };

  const getPredictionForNextPeriod = (): PredictionResult => {
    return calculatePrediction(predictions);
  };

  const getPredictionsByDateRange = async (startDate: string, endDate: string) => {
    try {
      const { data, error } = await supabase
        .from('predictions')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Une erreur est survenue');
    }
  };

  useEffect(() => {
    if (productId) {
      fetchPredictions();
    } else {
      fetchAllPredictions();
    }
  }, [productId]);

  return {
    predictions,
    loading,
    error,
    addPrediction,
    updatePrediction,
    deletePrediction,
    getPredictionForNextPeriod,
    getPredictionsByDateRange,
    refreshPredictions: productId ? fetchPredictions : fetchAllPredictions
  };
}; 