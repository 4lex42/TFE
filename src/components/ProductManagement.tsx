import React, { useState } from 'react';
import { useProduits, Produit } from '../hooks/useProduits';
import { usePredictions } from '../hooks/usePredictions';
import { PredictionChart } from './PredictionChart';

export const ProductManagement: React.FC = () => {
  const { produits, loading, error, addProduit, updateProduit, deleteProduit } = useProduits();
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Produit | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
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
      setMessage({ type: 'success', text: 'Produit ajouté avec succès' });
    } else {
      setMessage({ type: 'error', text: result.error || 'Une erreur est survenue' });
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    const result = await updateProduit(editingProduct.id, {
      nom: editingProduct.nom,
      quantity: editingProduct.quantity,
      quantity_critique: editingProduct.quantity_critique,
      prix: editingProduct.prix,
      code: editingProduct.code,
      description: editingProduct.description
    });

    if (result.success) {
      setEditingProduct(null);
      setMessage({ type: 'success', text: 'Produit mis à jour avec succès' });
    } else {
      setMessage({ type: 'error', text: result.error || 'Une erreur est survenue' });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'nom' || name === 'code' || name === 'description' ? value : Number(value)
    }));
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editingProduct) return;
    const { name, value } = e.target;
    setEditingProduct(prev => ({
      ...prev!,
      [name]: name === 'nom' || name === 'code' || name === 'description' ? value : Number(value)
    }));
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) return;

    const result = await deleteProduit(id);
    if (result.success) {
      setMessage({ type: 'success', text: 'Produit supprimé avec succès' });
    } else {
      setMessage({ type: 'error', text: result.error || 'Une erreur est survenue' });
    }
  };

  if (loading) return <div>Chargement...</div>;
  if (error) return <div>Erreur: {error}</div>;

  return (
    <div className="container mx-auto p-4">
      {message && (
        <div className={`mb-4 p-4 rounded ${
          message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

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
            {editingProduct?.id === produit.id ? (
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="block mb-1">Nom</label>
                  <input
                    type="text"
                    name="nom"
                    value={editingProduct.nom}
                    onChange={handleEditInputChange}
                    className="w-full border p-2 rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1">Quantité</label>
                  <input
                    type="number"
                    name="quantity"
                    value={editingProduct.quantity}
                    onChange={handleEditInputChange}
                    className="w-full border p-2 rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1">Seuil Critique</label>
                  <input
                    type="number"
                    name="quantity_critique"
                    value={editingProduct.quantity_critique}
                    onChange={handleEditInputChange}
                    className="w-full border p-2 rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1">Prix</label>
                  <input
                    type="number"
                    name="prix"
                    value={editingProduct.prix}
                    onChange={handleEditInputChange}
                    className="w-full border p-2 rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1">Code</label>
                  <input
                    type="text"
                    name="code"
                    value={editingProduct.code}
                    onChange={handleEditInputChange}
                    className="w-full border p-2 rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1">Description</label>
                  <input
                    type="text"
                    name="description"
                    value={editingProduct.description || ''}
                    onChange={handleEditInputChange}
                    className="w-full border p-2 rounded"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                  >
                    Sauvegarder
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingProduct(null)}
                    className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            ) : (
              <>
                <h3 className="text-lg font-semibold">{produit.nom}</h3>
                <p>Code: {produit.code}</p>
                <p>Quantité: {produit.quantity}</p>
                <p>Seuil critique: {produit.quantity_critique}</p>
                <p>Prix: {produit.prix}€</p>
                {produit.description && <p>Description: {produit.description}</p>}
                {produit.quantity <= produit.quantity_critique && (
                  <p className="text-red-500">Stock critique !</p>
                )}
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => setEditingProduct(produit)}
                    className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => handleDelete(produit.id)}
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                  >
                    Supprimer
                  </button>
                </div>
              </>
            )}
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