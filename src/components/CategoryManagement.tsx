import React, { useState } from 'react';
import { useCategories, Categorie } from '../hooks/useCategories';

export const CategoryManagement: React.FC = () => {
  const { categories, loading, error, addCategorie, updateCategorie, deleteCategorie } = useCategories();
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<Categorie | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) {
      setMessage({ type: 'error', text: 'Le nom de la catégorie ne peut pas être vide' });
      return;
    }

    const result = await addCategorie(newCategoryName.trim());
    if (result.success) {
      setMessage({ type: 'success', text: 'Catégorie ajoutée avec succès' });
      setNewCategoryName('');
    } else {
      setMessage({ type: 'error', text: result.error || 'Une erreur est survenue' });
    }
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;

    const result = await updateCategorie(editingCategory.id, editingCategory.nom_categorie);
    if (result.success) {
      setMessage({ type: 'success', text: 'Catégorie mise à jour avec succès' });
      setEditingCategory(null);
    } else {
      setMessage({ type: 'error', text: result.error || 'Une erreur est survenue' });
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ?')) return;

    const result = await deleteCategorie(id);
    if (result.success) {
      setMessage({ type: 'success', text: 'Catégorie supprimée avec succès' });
    } else {
      setMessage({ type: 'error', text: result.error || 'Une erreur est survenue' });
    }
  };

  if (loading) return <div>Chargement...</div>;
  if (error) return <div>Erreur: {error}</div>;

  return (
    <div className="space-y-6">
      {message && (
        <div className={`p-4 rounded ${
          message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Ajouter une nouvelle catégorie</h2>
        <form onSubmit={handleAddCategory} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom de la catégorie
            </label>
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Ajouter
          </button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Catégories existantes</h2>
        <div className="space-y-4">
          {categories.map((category) => (
            <div key={category.id} className="flex items-center justify-between p-4 border rounded-lg">
              {editingCategory?.id === category.id ? (
                <form onSubmit={handleUpdateCategory} className="flex-1 flex gap-4">
                  <input
                    type="text"
                    value={editingCategory.nom_categorie}
                    onChange={(e) => setEditingCategory({ ...editingCategory, nom_categorie: e.target.value })}
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <button
                    type="submit"
                    className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
                  >
                    Sauvegarder
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingCategory(null)}
                    className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
                  >
                    Annuler
                  </button>
                </form>
              ) : (
                <>
                  <span className="text-lg">{category.nom_categorie}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingCategory(category)}
                      className="bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-600"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category.id)}
                      className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600"
                    >
                      Supprimer
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}; 