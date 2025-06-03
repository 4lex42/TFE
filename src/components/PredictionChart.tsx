import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Prediction, PredictionResult } from '../hooks/usePredictions';

interface PredictionChartProps {
  historicalData: Prediction[];
  prediction: PredictionResult;
}

export const PredictionChart: React.FC<PredictionChartProps> = ({
  historicalData,
  prediction
}) => {
  // Préparer les données pour le graphique
  const chartData = [
    ...historicalData.map(item => ({
      date: new Date(item.date).toLocaleDateString(),
      ventes: item.ventes,
      prix: item.prod_prix
    })),
    // Ajouter la prédiction
    {
      date: 'Prédiction',
      ventes: prediction.predictedSales,
      prediction: prediction.predictedSales,
      confidence: prediction.confidence
    }
  ];

  return (
    <div className="w-full h-[400px] p-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis yAxisId="left" />
          <YAxis yAxisId="right" orientation="right" />
          <Tooltip />
          <Legend />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="ventes"
            stroke="#8884d8"
            activeDot={{ r: 8 }}
            name="Ventes historiques"
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="prediction"
            stroke="#82ca9d"
            strokeDasharray="5 5"
            name="Prédiction"
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="prix"
            stroke="#ffc658"
            name="Prix"
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="mt-4 text-center">
        <p className="text-lg font-semibold">
          Prédiction des ventes: {prediction.predictedSales} unités
        </p>
        <p className="text-sm text-gray-600">
          Niveau de confiance: {prediction.confidence}%
        </p>
      </div>
    </div>
  );
}; 