"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface Categorie {
  id: string;
  nom_categorie: string;
}

interface Produit {
  id: string;
  nom: string;
  quantity: number;
  code: string;
  categories: Categorie[];
}

export default function EntreesStockPage() {
  const [produits, setProduits] = useState<Produit[]>([]);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategorie, setSelectedCategorie] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Produit | null>(null);
  const [quantityToAdd, setQuantityToAdd] = useState<number>(0);

  useEffect(() => {
    fetchCategories();
    fetchProduits();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categorie')
        .select('*')
        .order('nom_categorie');

      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      setError('Erreur lors du chargement des catégories');
    }
  };

  const fetchProduits = async () => {
    try {
      // Fetch products
      const { data: produitsData, error: produitsError } = await supabase
        .from('produit')
        .select('id, nom, quantity, code')
        .order('nom');

      if (produitsError) throw produitsError;

      // Fetch product categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('produit_categorie')
        .select(`
          produit_id,
          categorie:categorie(id, nom_categorie)
        `);

      if (categoriesError) throw categoriesError;

      // Map categories to products
      const produitsWithCategories = produitsData.map(produit => ({
        ...produit,
        categories: categoriesData
          .filter(cat => cat.produit_id === produit.id)
          .map(cat => cat.categorie)
      }));

      setProduits(produitsWithCategories);
    } catch (err) {
      setError('Erreur lors du chargement des produits');
    } finally {
      setLoading(false);
    }
  };

  const handleAddStock = async () => {
    if (!selectedProduct || quantityToAdd <= 0) {
      setError('Veuillez sélectionner un produit et entrer une quantité valide');
      return;
    }

    try {
      const newQuantity = selectedProduct.quantity + quantityToAdd;
      
      const { error } = await supabase
        .from('produit')
        .update({ quantity: newQuantity })
        .eq('id', selectedProduct.id);

      if (error) throw error;

      setSuccess(`Stock mis à jour avec succès pour ${selectedProduct.nom}`);
      setQuantityToAdd(0);
      setSelectedProduct(null);
      fetchProduits();
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Erreur lors de la mise à jour du stock');
    }
  };

  const filteredProduits = produits.filter(produit => {
    const matchesSearch = 
      produit.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      produit.code.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = 
      !selectedCategorie ||
      produit.categories.some(cat => cat.id === selectedCategorie);

    return matchesSearch && matchesCategory;
  });

  if (loading) return <div>Chargement...</div>;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Entrées en Stock</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Liste des produits */}
        <div>
          <div className="mb-4 space-y-2">
            <input
              type="text"
              placeholder="Rechercher un produit..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full p-2 border rounded"
            />
            <select
              value={selectedCategorie}
              onChange={e => setSelectedCategorie(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="">Toutes les catégories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.nom_categorie}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-4 max-h-[600px] overflow-y-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left">Produit</th>
                  <th className="text-right">Stock actuel</th>
                  <th className="text-right">Catégories</th>
                </tr>
              </thead>
              <tbody>
                {filteredProduits.map(produit => (
                  <tr 
                    key={produit.id} 
                    className={`border-b cursor-pointer hover:bg-gray-50 ${
                      selectedProduct?.id === produit.id ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => setSelectedProduct(produit)}
                  >
                    <td className="py-2">
                      <div>
                        <div className="font-semibold">{produit.nom}</div>
                        <div className="text-sm text-gray-600">{produit.code}</div>
                      </div>
                    </td>
                    <td className="text-right">{produit.quantity}</td>
                    <td className="text-right">
                      <div className="flex flex-wrap justify-end gap-1">
                        {produit.categories.map(cat => (
                          <span
                            key={cat.id}
                            className="px-2 py-1 text-xs bg-gray-100 rounded-full"
                          >
                            {cat.nom_categorie}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Formulaire d'ajout de stock */}
        <div>
          <div className="bg-white rounded-lg shadow-lg p-4">
            <h2 className="text-xl font-bold mb-4">Ajouter du stock</h2>
            
            {selectedProduct ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Produit sélectionné
                  </label>
                  <div className="mt-1 p-2 border rounded bg-gray-50">
                    <div className="font-semibold">{selectedProduct.nom}</div>
                    <div className="text-sm text-gray-600">
                      Stock actuel: {selectedProduct.quantity}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {selectedProduct.categories.map(cat => (
                        <span
                          key={cat.id}
                          className="px-2 py-1 text-xs bg-gray-100 rounded-full"
                        >
                          {cat.nom_categorie}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Quantité à ajouter
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={quantityToAdd}
                    onChange={e => setQuantityToAdd(parseInt(e.target.value) || 0)}
                    className="mt-1 block w-full p-2 border rounded"
                  />
                </div>

                <button
                  onClick={handleAddStock}
                  disabled={quantityToAdd <= 0}
                  className="w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 disabled:bg-gray-300"
                >
                  Valider l'entrée en stock
                </button>
              </div>
            ) : (
              <p className="text-gray-600">
                Sélectionnez un produit dans la liste pour ajouter du stock
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 