import React, { useState, useMemo } from 'react';
import { useProduits, Produit } from '../hooks/useProduits';
import { useCategories, Categorie } from '../hooks/useCategories';
import { usePredictions } from '../hooks/usePredictions';
import { useAuth } from '../hooks/useAuth';
import { PredictionChart } from './PredictionChart';
import { ImageUpload } from './ImageUpload';
import { HistoriqueProduitModal } from './HistoriqueProduitModal';

export const ProductManagement: React.FC = () => {
  const { produits, loading, error, addProduit, updateProduit, deleteProduit, addCategorieToProduit, removeCategorieFromProduit, updateTvaProduit } = useProduits();
  const { categories, loading: categoriesLoading } = useCategories();
  const { user } = useAuth();
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Produit | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info', text: string, isCritical?: boolean } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showHistoriqueModal, setShowHistoriqueModal] = useState(false);
  const [produitHistorique, setProduitHistorique] = useState<Produit | null>(null);
  const [showTvaModal, setShowTvaModal] = useState(false);
  const [produitTva, setProduitTva] = useState<Produit | null>(null);
  const [nouvelleTva, setNouvelleTva] = useState<number>(20.00);
  const [tvaNote, setTvaNote] = useState<string>('');
  const [formData, setFormData] = useState({
    nom: '',
    quantity: 0,
    quantity_critique: 0,
    prix: 0,
    code: '',
    description: '',
    photo: '',
    tva_direct: 20.00
  });
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [categoryFilterIds, setCategoryFilterIds] = useState<string[]>([]);
  const [categoryFilterSearch, setCategoryFilterSearch] = useState('');
  const [showCategoryFilters, setShowCategoryFilters] = useState(true);

  // Utiliser le hook de prédictions si un produit est sélectionné
  const {
    predictions,
    getPredictionForNextPeriod,
    loading: predictionsLoading
  } = usePredictions(selectedProduct || '');

  // Filtrer les produits en fonction du terme de recherche et des catégories sélectionnées
  const filteredProduits = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();

    return produits.filter(produit => {
      const matchesSearch = !term
        ? true
        : (
            produit.nom.toLowerCase().includes(term) ||
            produit.code.toLowerCase().includes(term) ||
            (produit.description && produit.description.toLowerCase().includes(term))
          );

      const matchesCategory = categoryFilterIds.length === 0
        ? true
        : ((produit.categories || []).some(cat => categoryFilterIds.includes(cat.id)));

      return matchesSearch && matchesCategory;
    });
  }, [produits, searchTerm, categoryFilterIds]);

  // Catégories affichées dans le filtre (recherche + tri: sélectionnées d'abord)
  const displayedCategories = useMemo(() => {
    const term = categoryFilterSearch.toLowerCase().trim();
    const filtered = term
      ? categories.filter(c => c.nom_categorie.toLowerCase().includes(term))
      : categories;

    return [...filtered].sort((a, b) => {
      const aSel = categoryFilterIds.includes(a.id) ? 0 : 1;
      const bSel = categoryFilterIds.includes(b.id) ? 0 : 1;
      if (aSel !== bSel) return aSel - bSel;
      return a.nom_categorie.localeCompare(b.nom_categorie);
    });
  }, [categories, categoryFilterIds, categoryFilterSearch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await addProduit(formData);
    if (result.success && result.data) {
      // Ajouter les catégories sélectionnées au produit
      const produitId = result.data[0]?.id;
      if (produitId && selectedCategories.length > 0) {
        for (const categorieId of selectedCategories) {
          await addCategorieToProduit(produitId, categorieId);
        }
      }
      
      setShowAddForm(false);
      setFormData({
        nom: '',
        quantity: 0,
        quantity_critique: 0,
        prix: 0,
        code: '',
        description: '',
        photo: '',
        tva_direct: 20.00
      });
      setSelectedCategories([]);
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
      description: editingProduct.description,
      photo: editingProduct.photo
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

  const handleImageUpload = (imageUrl: string) => {
    setFormData(prev => ({
      ...prev,
      photo: imageUrl
    }));
  };

  const handleImageRemove = () => {
    setFormData(prev => ({
      ...prev,
      photo: ''
    }));
  };

  const handleEditImageUpload = (imageUrl: string) => {
    if (!editingProduct) return;
    setEditingProduct(prev => ({
      ...prev!,
      photo: imageUrl
    }));
  };

  const handleEditImageRemove = () => {
    if (!editingProduct) return;
    setEditingProduct(prev => ({
      ...prev!,
      photo: ''
    }));
  };

  const handleCategoryToggle = (categorieId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categorieId) 
        ? prev.filter(id => id !== categorieId)
        : [...prev, categorieId]
    );
  };

  const handleEditCategoryToggle = async (categorieId: string) => {
    if (!editingProduct) return;

    const isCurrentlySelected = editingProduct.categories?.some(cat => cat.id === categorieId);
    
    if (isCurrentlySelected) {
      // Retirer la catégorie
      const result = await removeCategorieFromProduit(editingProduct.id, categorieId);
      if (result.success) {
        setEditingProduct(prev => ({
          ...prev!,
          categories: prev!.categories?.filter(cat => cat.id !== categorieId) || []
        }));
      }
    } else {
      // Ajouter la catégorie
      const result = await addCategorieToProduit(editingProduct.id, categorieId);
      if (result.success) {
        const categorieToAdd = categories.find(cat => cat.id === categorieId);
        if (categorieToAdd) {
          setEditingProduct(prev => ({
            ...prev!,
            categories: [...(prev!.categories || []), categorieToAdd]
          }));
        }
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      try {
        setMessage({ type: 'info', text: 'Suppression en cours...' });
        const result = await deleteProduit(id);
        
        if (result.success) {
          setMessage({ type: 'success', text: 'Produit supprimé avec succès' });
        } else {
          // Détecter si c'est une erreur critique d'historique
          const isCriticalError = result.error?.includes('critique') || result.error?.includes('historique');
          setMessage({ 
            type: 'error', 
            text: `Erreur lors de la suppression: ${result.error || 'Erreur inconnue'}`,
            isCritical: isCriticalError
          });
        }
      } catch (err) {
        console.error('Erreur lors de la suppression:', err);
        setMessage({ 
          type: 'error', 
          text: `Erreur inattendue: ${err instanceof Error ? err.message : 'Erreur inconnue'}` 
        });
      }
    }
  };

  const handleEdit = (produit: Produit) => {
    setEditingProduct(produit);
    setSelectedCategories(produit.categories?.map(cat => cat.id) || []);
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
    setSelectedCategories([]);
  };

  const handleShowHistorique = (produit: Produit) => {
    setProduitHistorique(produit);
    setShowHistoriqueModal(true);
  };

  const handleShowTvaModal = (produit: Produit) => {
    setProduitTva(produit);
    setNouvelleTva(produit.tva_direct || 20.00);
    setTvaNote('');
    setShowTvaModal(true);
  };

  const handleUpdateTva = async () => {
    if (!produitTva || !user) return;

    const result = await updateTvaProduit(
      produitTva.id,
      nouvelleTva,
      user.id,
      tvaNote
    );

    if (result.success) {
      setShowTvaModal(false);
      setProduitTva(null);
      setMessage({ type: 'success', text: 'TVA mise à jour avec succès' });
    } else {
      setMessage({ type: 'error', text: result.error || 'Une erreur est survenue' });
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  const toggleCategoryFilter = (categorieId: string) => {
    setCategoryFilterIds(prev => 
      prev.includes(categorieId)
        ? prev.filter(id => id !== categorieId)
        : [...prev, categorieId]
    );
  };

  const clearCategoryFilters = () => {
    setCategoryFilterIds([]);
    setCategoryFilterSearch('');
  };

  const selectAllDisplayedCategories = () => {
    setCategoryFilterIds(prev => {
      const displayedIds = displayedCategories.map(c => c.id);
      const merged = new Set([...prev, ...displayedIds]);
      return Array.from(merged);
    });
  };

  if (loading) {
    return <div className="text-center py-8">Chargement des produits...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-600">Erreur: {error}</div>;
  }

  return (
    <div className="container mx-auto p-6">
      {message && (
        <div className={`mb-4 p-4 rounded ${
          message.type === 'success' ? 'bg-green-100 text-green-700' : 
          message.type === 'error' ? (message.isCritical ? 'bg-red-200 text-red-900 border-2 border-red-500' : 'bg-red-100 text-red-700') :
          'bg-blue-100 text-blue-700'
        }`}>
          {message.isCritical && (
            <div className="flex items-center mb-2">
              <span className="text-red-600 mr-2">🚨</span>
              <span className="font-bold">ERREUR CRITIQUE - Traçabilité compromise</span>
            </div>
          )}
          {message.text}
          <button
            onClick={() => setMessage(null)}
            className="float-right font-bold"
          >
            ×
          </button>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestion des Produits</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Ajouter un Produit
          </button>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Rechercher par nom, code ou description..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
          {searchTerm && (
            <button
              onClick={clearSearch}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        
        {/* Résultats de recherche */}
        {searchTerm && (
          <div className="mt-2 text-sm text-gray-600">
            {filteredProduits.length === 0 ? (
              <span>Aucun produit trouvé pour "{searchTerm}"</span>
            ) : (
              <span>{filteredProduits.length} produit{filteredProduits.length > 1 ? 's' : ''} trouvé{filteredProduits.length > 1 ? 's' : ''} pour "{searchTerm}"</span>
            )}
          </div>
        )}
      </div>

      {/* Filtres par catégories */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium">Filtrer par catégories</span>
          <button
            onClick={() => setShowCategoryFilters(s => !s)}
            className="text-sm text-blue-600 hover:underline"
          >
            {showCategoryFilters ? 'Masquer' : 'Afficher'}
          </button>
        </div>

        {showCategoryFilters && (
          <div className="flex flex-col gap-3">
            {/* Chips des catégories sélectionnées */}
            {categoryFilterIds.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {categoryFilterIds
                  .map(id => categories.find(c => c.id === id))
                  .filter(Boolean)
                  .map(cat => (
                    <span key={(cat as Categorie).id} className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                      {(cat as Categorie).nom_categorie}
                      <button
                        onClick={() => toggleCategoryFilter((cat as Categorie).id)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Retirer"
                      >
                        ×
                      </button>
                    </span>
                  ))}
              </div>
            )}

            {/* Barre de recherche des catégories */}
            <div className="relative max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Rechercher une catégorie..."
                value={categoryFilterSearch}
                onChange={(e) => setCategoryFilterSearch(e.target.value)}
                className="block w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-md text-sm bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={selectAllDisplayedCategories}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm px-3 py-1 rounded border"
                disabled={displayedCategories.length === 0}
              >
                Tout sélectionner (affichées)
              </button>
              <button
                onClick={clearCategoryFilters}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm px-3 py-1 rounded border"
                disabled={categoryFilterIds.length === 0 && categoryFilterSearch.trim() === ''}
              >
                Effacer les filtres
              </button>
              <span className="text-xs text-gray-600">
                {categoryFilterIds.length > 0 ? `${categoryFilterIds.length} sélectionnée${categoryFilterIds.length > 1 ? 's' : ''}` : 'Aucune sélection'}
              </span>
            </div>

            {categoriesLoading ? (
              <div className="text-sm text-gray-500">Chargement des catégories...</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 max-h-48 overflow-auto p-2 border rounded">
                {displayedCategories.map((categorie) => (
                  <label key={categorie.id} className="flex items-center space-x-2 cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      checked={categoryFilterIds.includes(categorie.id)}
                      onChange={() => toggleCategoryFilter(categorie.id)}
                      className="rounded"
                    />
                    <span className="truncate" title={categorie.nom_categorie}>{categorie.nom_categorie}</span>
                  </label>
                ))}
                {displayedCategories.length === 0 && (
                  <div className="col-span-full text-xs text-gray-500">Aucune catégorie trouvée</div> 
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {showAddForm && (
        <div className="mb-6 p-4 border rounded">
          <h2 className="text-xl mb-4">Ajouter un nouveau produit</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <label className="block mb-1">Description</label>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full border p-2 rounded"
                />
              </div>
              <div>
                <label className="block mb-1">TVA (%)</label>
                <input
                  type="number"
                  name="tva_direct"
                  value={formData.tva_direct}
                  onChange={handleInputChange}
                  className="w-full border p-2 rounded"
                  step="0.01"
                  min="0"
                  max="100"
                  required
                />
              </div>
            </div>
            
            {/* Upload d'image */}
            <ImageUpload
              currentImageUrl={formData.photo}
              onImageUpload={handleImageUpload}
              onImageRemove={handleImageRemove}
              productName={formData.nom || 'produit'}
            />

            {/* Sélection des catégories */}
            <div>
              <label className="block mb-2 font-medium">Catégories</label>
              {categoriesLoading ? (
                <div className="text-sm text-gray-500">Chargement des catégories...</div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {categories.map((categorie) => (
                    <label key={categorie.id} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(categorie.id)}
                        onChange={() => handleCategoryToggle(categorie.id)}
                        className="rounded"
                      />
                      <span className="text-sm">{categorie.nom_categorie}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                Ajouter le Produit
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setFormData({
                    nom: '',
                    quantity: 0,
                    quantity_critique: 0,
                    prix: 0,
                    code: '',
                    description: '',
                    photo: '',
                    tva_direct: 20.00
                  });
                  setSelectedCategories([]);
                }}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* En-tête du tableau */}
      <div className="bg-gray-100 p-4 rounded-t border-b">
        <div className="grid grid-cols-13 gap-4 text-sm font-medium text-gray-700">
          <div className="col-span-2">Image</div>
          <div className="col-span-2">Nom</div>
          <div className="col-span-1">Code</div>
          <div className="col-span-1">Stock</div>
          <div className="col-span-1">Seuil</div>
          <div className="col-span-1">Prix</div>
          <div className="col-span-1">TVA</div>
          <div className="col-span-2">Description</div>
          <div className="col-span-2">Actions</div>
        </div>
      </div>

      {/* Liste des produits */}
      <div className="space-y-1">
        {filteredProduits.map((produit) => (
          <div key={produit.id} className="border rounded p-4">
            {editingProduct?.id === produit.id ? (
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div className="grid grid-cols-13 gap-4">
                  {/* Image */}
                  <div className="col-span-2">
                    <ImageUpload
                      currentImageUrl={editingProduct.photo || ''}
                      onImageUpload={handleEditImageUpload}
                      onImageRemove={handleEditImageRemove}
                      productName={editingProduct.nom}
                      compact={true}
                    />
                  </div>
                  
                  {/* Nom */}
                  <div className="col-span-2">
                    <input
                      type="text"
                      name="nom"
                      value={editingProduct.nom}
                      onChange={handleEditInputChange}
                      className="w-full border p-1 rounded text-sm"
                      required
                    />
                  </div>
                  
                  {/* Code */}
                  <div className="col-span-1">
                    <input
                      type="text"
                      name="code"
                      value={editingProduct.code}
                      onChange={handleEditInputChange}
                      className="w-full border p-1 rounded text-sm"
                      required
                    />
                  </div>
                  
                  {/* Stock */}
                  <div className="col-span-1">
                    <input
                      type="number"
                      name="quantity"
                      value={editingProduct.quantity}
                      onChange={handleEditInputChange}
                      className="w-full border p-1 rounded text-sm"
                      required
                    />
                  </div>
                  
                  {/* Seuil critique */}
                  <div className="col-span-1">
                    <input
                      type="number"
                      name="quantity_critique"
                      value={editingProduct.quantity_critique}
                      onChange={handleEditInputChange}
                      className="w-full border p-1 rounded text-sm"
                      required
                    />
                  </div>
                  
                  {/* Prix */}
                  <div className="col-span-1">
                    <input
                      type="number"
                      name="prix"
                      value={editingProduct.prix}
                      onChange={handleEditInputChange}
                      className="w-full border p-1 rounded text-sm"
                      required
                    />
                  </div>
                  
                  {/* Description */}
                  <div className="col-span-2">
                    <input
                      type="text"
                      name="description"
                      value={editingProduct.description || ''}
                      onChange={handleEditInputChange}
                      className="w-full border p-1 rounded text-sm"
                    />
                  </div>
                  
                  {/* TVA */}
                  <div className="col-span-1">
                    <input
                      type="number"
                      name="tva_direct"
                      value={editingProduct.tva_direct || 20.00}
                      onChange={handleEditInputChange}
                      className="w-full border p-1 rounded text-sm"
                      step="0.01"
                      min="0"
                      max="100"
                      required
                    />
                  </div>
                  
                  {/* Actions */}
                  <div className="col-span-2 flex gap-2">
                    <button
                      type="submit"
                      className="bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600"
                    >
                      💾
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="bg-gray-500 text-white px-2 py-1 rounded text-xs hover:bg-gray-600"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Catégories en mode édition */}
                <div className="mt-4">
                  <label className="block mb-2 text-sm font-medium">Catégories</label>
                  {categoriesLoading ? (
                    <div className="text-xs text-gray-500">Chargement des catégories...</div>
                  ) : (
                    <div className="grid grid-cols-4 gap-2">
                      {categories.map((categorie) => (
                        <label key={categorie.id} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editingProduct.categories?.some(cat => cat.id === categorie.id) || false}
                            onChange={() => handleEditCategoryToggle(categorie.id)}
                            className="rounded"
                          />
                          <span className="text-xs">{categorie.nom_categorie}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-13 gap-4 h-full items-center">
                {/* Image */}
                <div className="col-span-2 flex items-center">
                  {produit.photo ? (
                    <img
                      src={produit.photo}
                      alt={produit.nom}
                      className="w-8 h-8 object-cover rounded"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>
                
                {/* Nom */}
                <div className="col-span-2 text-sm font-medium text-gray-900 truncate">
                  {produit.nom}
                </div>
                
                {/* Code */}
                <div className="col-span-1 text-sm text-gray-600 truncate">
                  {produit.code}
                </div>
                
                {/* Stock */}
                <div className={`col-span-1 text-sm font-medium ${
                  produit.quantity <= produit.quantity_critique ? 'text-red-600' : 'text-green-600'
                }`}>
                  {produit.quantity}
                </div>
                
                {/* Seuil critique */}
                <div className="col-span-1 text-sm text-gray-600">
                  {produit.quantity_critique}
                </div>
                
                {/* Prix */}
                <div className="col-span-1 text-sm font-medium text-gray-900">
                  {produit.prix}€
                </div>
                
                {/* TVA */}
                <div className="col-span-1 text-sm font-medium text-gray-900">
                  {produit.tva_direct || 20.00}%
                </div>
                
                {/* Description */}
                <div className="col-span-2 text-sm text-gray-600 truncate">
                  {produit.description || 'Aucune description'}
                </div>
                
                {/* Actions */}
                <div className="col-span-2 flex gap-2">
                  <button
                    onClick={() => handleShowHistorique(produit)}
                    className="bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600"
                    title="Voir l'historique"
                  >
                    📊
                  </button>
                  <button
                    onClick={() => handleShowTvaModal(produit)}
                    className="bg-purple-500 text-white px-2 py-1 rounded text-xs hover:bg-purple-600"
                    title="Modifier TVA"
                  >
                    💰
                  </button>
                  <button
                    onClick={() => handleEdit(produit)}
                    className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600"
                    title="Modifier"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(produit.id)}
                    className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
                    title="Supprimer"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            )}

            {/* Affichage des catégories en mode lecture */}
            {editingProduct?.id !== produit.id && produit.categories && produit.categories.length > 0 && (
              <div className="mt-2 pt-2 border-t">
                <div className="flex flex-wrap gap-1">
                  {produit.categories.map((categorie) => (
                    <span
                      key={categorie.id}
                      className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                    >
                      {categorie.nom_categorie}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredProduits.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500">
          {searchTerm || categoryFilterIds.length > 0 ? 'Aucun produit trouvé pour vos filtres' : 'Aucun produit trouvé'}
        </div>
      )}

      {/* Section des prédictions */}
      {selectedProduct && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Prédictions de Ventes</h2>
          {predictionsLoading ? (
            <div>Chargement des prédictions...</div>
          ) : (
            <PredictionChart 
              historicalData={predictions} 
              prediction={getPredictionForNextPeriod()}
            />
          )}
        </div>
      )}

      {/* Modal d'historique */}
      <HistoriqueProduitModal
        produit={produitHistorique}
        isOpen={showHistoriqueModal}
        onClose={() => {
          setShowHistoriqueModal(false);
          setProduitHistorique(null);
        }}
      />

      {/* Modal de modification TVA */}
      {showTvaModal && produitTva && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">
              Modifier la TVA - {produitTva.nom}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  TVA actuelle
                </label>
                <div className="text-lg font-semibold text-gray-900">
                  {produitTva.tva_direct || 20.00}%
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nouvelle TVA (%)
                </label>
                <input
                  type="number"
                  value={nouvelleTva}
                  onChange={(e) => setNouvelleTva(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  step="0.01"
                  min="0"
                  max="100"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Note (optionnel)
                </label>
                <textarea
                  value={tvaNote}
                  onChange={(e) => setTvaNote(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  rows={3}
                  placeholder="Raison de la modification..."
                />
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <button
                onClick={handleUpdateTva}
                className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
              >
                Mettre à jour
              </button>
              <button
                onClick={() => {
                  setShowTvaModal(false);
                  setProduitTva(null);
                }}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 