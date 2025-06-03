"use client"

import React from 'react';
import { ProductManagement } from '../../components/ProductManagement';

export default function StockPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold text-center mb-8">
        Gestion des Stocks
      </h1>
      
      <div className="bg-white rounded-lg shadow-lg p-6">
        <ProductManagement />
      </div>
    </div>
  );
}
