"use client"

import React from 'react';
import { ProductManagement } from '../../components/ProductManagement';

export default function StockPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Gestion des Stocks
          </h1>
          <p className="text-gray-600 text-lg">
            Gérez votre inventaire en temps réel
          </p>
        </div>

        {/* Gestion des produits */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <ProductManagement />
        </div>
      </div>
    </div>
  );
}


