import React, { useState, useEffect } from 'react';
import { useProduits, Produit } from '../hooks/useProduits';
import { usePredictions } from '../hooks/usePredictions';
import { PredictionChart } from './PredictionChart';
import { supabase } from '../lib/supabase';

interface Categorie {
  id: string;
  nom_categorie: string;
}

export const ProductManagement: React.FC = () => {
  const { produits, loading, error, addProduit, updateProduit, deleteProduit } = useProduits();
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [productCategories, setProductCategories] = useState<{ [key: string]: Categorie[] }>({});
  const [formData, setFormData] = useState({
    nom: '',
    quantity: 0,
    quantity_critique: 0,
    prix: 0,
    code: '',
    description: ''
  });

  // Utiliser le hook de prédictions si un produit est sélectionné
  const {
    predictions,
    getPredictionForNextPeriod,
    loading: predictionsLoading
  } = usePredictions(selectedProduct || '');

  useEffect(() => {
    fetchCategories();
    if (produits.length > 0) {
      fetchProductCategories();
    }
  }, [produits]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categorie')
        .select('*')
        .order('nom_categorie');

      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error('Erreur lors du chargement des catégories:', err);
    }
  };

  const fetchProductCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('produit_categorie')
        .select(`
          produit_id,
          categorie:categorie(id, nom_categorie)
        `);

      if (error) throw error;

      const categoriesByProduct: { [key: string]: Categorie[] } = {};
      data.forEach(item => {
        if (!categoriesByProduct[item.produit_id]) {
          categoriesByProduct[item.produit_id] = [];
        }
        categoriesByProduct[item.produit_id].push(item.categorie);
      });

      setProductCategories(categoriesByProduct);
    } catch (err) {
      console.error('Erreur lors du chargement des catégories des produits:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await addProduit(formData);
    if (result.success) {
      setShowAddForm(false);
      setFormData({
        nom: '',
        quantity: 0,
        quantity_critique: 0,
        prix: 0,
        code: '',
        description: ''
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'nom' || name === 'code' || name === 'description' ? value : Number(value)
    }));
  };

  const handleCategoryChange = async (productId: string, categoryId: string) => {
    const existingCategories = productCategories[productId] || [];
    const isAlreadyAssigned = existingCategories.some(cat => cat.id === categoryId);

    try {
      if (isAlreadyAssigned) {
        // Remove category
        const { error } = await supabase
          .from('produit_categorie')
          .delete()
          .eq('produit_id', productId)
          .eq('categorie_id', categoryId);

        if (error) throw error;
      } else {
        // Add category
        const { error } = await supabase
          .from('produit_categorie')
          .insert([{ produit_id: productId, categorie_id: categoryId }]);

        if (error) throw error;
      }

      // Refresh product categories
      fetchProductCategories();
    } catch (err) {
      console.error('Erreur lors de la mise à jour des catégories:', err);
    }
  };

  if (loading) return <div>Chargement...</div>;
  if (error) return <div>Erreur: {error}</div>;

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestion des Produits</h1>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Ajouter un Produit
        </button>
      </div>

      {showAddForm && (
        <div className="mb-6 p-4 border rounded">
          <h2 className="text-xl mb-4">Ajouter un nouveau produit</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-1">Nom</label>
              <input
                type="text"
                name="nom"
                value={formData.nom}
                onChange={handleInputChange}
                className="w-full border p-2 rounded"
                required
              />
            </div>
            <div>
              <label className="block mb-1">Quantité</label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleInputChange}
                className="w-full border p-2 rounded"
                required
              />
            </div>
            <div>
              <label className="block mb-1">Seuil Critique</label>
              <input
                type="number"
                name="quantity_critique"
                value={formData.quantity_critique}
                onChange={handleInputChange}
                className="w-full border p-2 rounded"
                required
              />
            </div>
            <div>
              <label className="block mb-1">Prix</label>
              <input
                type="number"
                name="prix"
                value={formData.prix}
                onChange={handleInputChange}
                className="w-full border p-2 rounded"
                required
              />
            </div>
            <div>
              <label className="block mb-1">Code</label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleInputChange}
                className="w-full border p-2 rounded"
                required
              />
            </div>
            <div>
              <label className="block mb-1">Description</label>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="w-full border p-2 rounded"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                Enregistrer
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {produits.map((produit) => (
          <div
            key={produit.id}
            className={`p-4 border rounded ${
              produit.quantity <= produit.quantity_critique ? 'border-red-500' : ''
            }`}
          >
            <h3 className="text-lg font-semibold">{produit.nom}</h3>
            <p>Code: {produit.code}</p>
            <p>Quantité: {produit.quantity}</p>
            <p>Prix: {produit.prix}€</p>
            {produit.quantity <= produit.quantity_critique && (
              <p className="text-red-500">Stock critique !</p>
            )}
            
            {/* Catégories */}
            <div className="mt-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Catégories
              </label>
              <div className="flex flex-wrap gap-2">
                {categories.map(categorie => (
                  <label
                    key={categorie.id}
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm cursor-pointer ${
                      productCategories[produit.id]?.some(cat => cat.id === categorie.id)
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={productCategories[produit.id]?.some(cat => cat.id === categorie.id)}
                      onChange={() => handleCategoryChange(produit.id, categorie.id)}
                    />
                    {categorie.nom_categorie}
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <button
                onClick={() => setSelectedProduct(produit.id)}
                className="bg-blue-500 text-white px-3 py-1 rounded mr-2 hover:bg-blue-600"
              >
                Voir les prédictions
              </button>
              <button
                onClick={() => deleteProduit(produit.id)}
                className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
              >
                Supprimer
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedProduct && !predictionsLoading && (
        <div className="mt-6">
          <h2 className="text-xl mb-4">Prédictions pour {produits.find(p => p.id === selectedProduct)?.nom}</h2>
          <PredictionChart
            historicalData={predictions}
            prediction={getPredictionForNextPeriod()}
          />
        </div>
      )}
    </div>
  );
}; 