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

export const usePredictions = (productId: string) => {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPredictions = async () => {
    try {
      const { data, error } = await supabase
        .from('predictions')
        .select('*')
        .eq('id', productId)
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

  const addPrediction = async (newPrediction: Omit<Prediction, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('predictions')
        .insert([newPrediction])
        .select();

      if (error) throw error;
      setPredictions([...predictions, ...(data || [])]);
      return { success: true, data };
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

  useEffect(() => {
    fetchPredictions();
  }, [productId]);

  return {
    predictions,
    loading,
    error,
    addPrediction,
    getPredictionForNextPeriod,
    refreshPredictions: fetchPredictions
  };
}; 