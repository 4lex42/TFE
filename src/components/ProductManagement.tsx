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
    photo: ''
    // TVA supprimée - gérée uniquement via le bouton TVA dédié
  });
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [categoryFilterIds, setCategoryFilterIds] = useState<string[]>([]);
  const [categoryFilterSearch, setCategoryFilterSearch] = useState('');
  const [showCategoryFilters, setShowCategoryFilters] = useState(true);
  
  // État pour la pagination
  const [displayedCount, setDisplayedCount] = useState(10);

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

  // Produits à afficher (pagination)
  const displayedProduits = useMemo(() => {
    return filteredProduits.slice(0, displayedCount);
  }, [filteredProduits, displayedCount]);

  // Vérifier s'il y a plus de produits à afficher
  const hasMoreProducts = displayedCount < filteredProduits.length;

  // Fonction pour afficher plus de produits
  const handleShowMore = () => {
    setDisplayedCount(prev => Math.min(prev + 20, filteredProduits.length));
  };

  // Réinitialiser la pagination quand les filtres changent
  React.useEffect(() => {
    setDisplayedCount(10);
  }, [searchTerm, categoryFilterIds]);

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
      // TVA supprimée - doit être modifiée via le bouton TVA dédié
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
    setDisplayedCount(10); // Réinitialiser la pagination
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
    setDisplayedCount(10); // Réinitialiser la pagination
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
    <div className="p-6">
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
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Gestion des Produits</h1>
          <p className="text-gray-600 mt-1">Ajoutez, modifiez et surveillez vos produits</p>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
            <span>
              Affichage de {displayedProduits.length} sur {filteredProduits.length} produit{filteredProduits.length !== 1 ? 's' : ''}
            </span>
            {hasMoreProducts && (
              <span className="text-blue-600 font-medium">
                +{filteredProduits.length - displayedProduits.length} autres disponibles
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors shadow-sm flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
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
            className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
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
        <div className="flex items-center justify-between mb-3">
          <span className="font-medium text-gray-700">Filtrer par catégories</span>
          <button
            onClick={() => setShowCategoryFilters(s => !s)}
            className="text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors"
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
                 className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm px-3 py-2 rounded-lg border transition-colors"
                 disabled={displayedCategories.length === 0}
               >
                 Tout sélectionner (affichées)
               </button>
               <button
                 onClick={clearCategoryFilters}
                 className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm px-3 py-2 rounded-lg border transition-colors"
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
               <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 max-h-48 overflow-auto p-3 border border-gray-200 rounded-lg bg-gray-50">
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
       <div className="bg-gray-50 p-4 rounded-t-lg border-b border-gray-200">
         <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-700">
          <div className="col-span-1 text-center">Image</div>
          <div className="col-span-3 text-center">Nom</div>
          <div className="col-span-1 text-center">Code</div>
          <div className="col-span-1 text-center">Stock</div>
          <div className="col-span-1 text-center">Seuil</div>
          <div className="col-span-1 text-center">Prix</div>
          <div className="col-span-1 text-center">TVA</div>
          <div className="col-span-2 text-center">Description</div>
          <div className="col-span-1 text-center">Actions</div>
        </div>
      </div>

             {/* Liste des produits */}
       <div className="space-y-2">
                 {displayedProduits.map((produit) => (
          <div key={produit.id} className="border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow">
            {editingProduct?.id === produit.id ? (
              <div className="space-y-3">
                {/* En-tête des colonnes pour l'édition */}
                <div className="grid grid-cols-12 gap-3 text-xs font-medium text-gray-600 bg-blue-50 p-2 rounded border border-blue-200">
                  <div className="col-span-1 text-center">Image</div>
                  <div className="col-span-3 text-center">Nom</div>
                  <div className="col-span-1 text-center">Code</div>
                  <div className="col-span-1 text-center">Stock</div>
                  <div className="col-span-1 text-center">Seuil</div>
                  <div className="col-span-1 text-center">Prix</div>
                  <div className="col-span-2 text-center">Description</div>
                  <div className="col-span-2 text-center">Actions</div>
                </div>
                
                <form onSubmit={handleEditSubmit} className="space-y-3">
                  <div className="grid grid-cols-12 gap-3">
                  {/* Image */}
                  <div className="col-span-1 flex justify-center">
                    <ImageUpload
                      currentImageUrl={editingProduct.photo || ''}
                      onImageUpload={handleEditImageUpload}
                      onImageRemove={handleEditImageRemove}
                      productName={editingProduct.nom}
                      compact={true}
                    />
                  </div>
                  
                  {/* Nom */}
                  <div className="col-span-3">
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
                  
                  {/* Actions */}
                  <div className="col-span-2 flex gap-1 justify-center">
                    <button
                      type="submit"
                      className="bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600"
                      title="Sauvegarder"
                    >
                      💾
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="bg-gray-500 text-white px-2 py-1 rounded text-xs hover:bg-gray-600"
                      title="Annuler"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Catégories en mode édition */}
                <div className="mt-3">
                  <label className="block mb-1 text-xs font-medium text-gray-700">Catégories</label>
                  {categoriesLoading ? (
                    <div className="text-xs text-gray-500">Chargement...</div>
                  ) : (
                    <div className="grid grid-cols-6 gap-1">
                      {categories.map((categorie) => (
                        <label key={categorie.id} className="flex items-center space-x-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editingProduct.categories?.some(cat => cat.id === categorie.id) || false}
                            onChange={() => handleEditCategoryToggle(categorie.id)}
                            className="rounded w-3 h-3"
                          />
                          <span className="text-xs text-gray-600">{categorie.nom_categorie}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                </form>
              </div>
            ) : (
              <div className="grid grid-cols-12 gap-4 h-full items-center">
                {/* Image */}
                <div className="col-span-1 flex items-center justify-center">
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
                <div className="col-span-3 text-sm font-medium text-gray-900 truncate text-center">
                  {produit.nom}
                </div>
                
                {/* Code */}
                <div className="col-span-1 text-sm text-gray-600 truncate text-center">
                  {produit.code}
                </div>
                
                {/* Stock */}
                <div className={`col-span-1 text-sm font-medium text-center ${
                  produit.quantity <= produit.quantity_critique ? 'text-red-600' : 'text-green-600'
                }`}>
                  {produit.quantity}
                </div>
                
                {/* Seuil critique */}
                <div className="col-span-1 text-sm text-gray-600 text-center">
                  {produit.quantity_critique}
                </div>
                
                {/* Prix */}
                <div className="col-span-1 text-sm font-medium text-gray-900 text-center">
                  {produit.prix}€
                </div>
                
                {/* TVA */}
                <div className="col-span-1 text-sm font-medium text-gray-900 text-center">
                  {produit.tva_direct || 20.00}%
                </div>
                
                {/* Description */}
                <div className="col-span-2 text-sm text-gray-600 truncate text-center">
                  {produit.description || 'Aucune description'}
                </div>
                
                {/* Actions - Ultra compact */}
                <div className="col-span-1 relative flex justify-center">
                  <div className="flex flex-col gap-1">
                    {/* Bouton principal - Modifier (le plus utilisé) */}
                    <button
                      onClick={() => handleEdit(produit)}
                      className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600 transition-colors w-full"
                      title="Modifier"
                    >
                      Modifier
                    </button>
                    
                    {/* Menu déroulant pour les autres actions */}
                    <div className="relative group">
                      <button
                        className="bg-gray-500 text-white px-2 py-1 rounded text-xs hover:bg-gray-600 transition-colors w-full"
                        title="Plus d'actions"
                      >
                        <svg className="w-3 h-3 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      
                      {/* Menu déroulant */}
                      <div className="absolute right-0 top-full mt-1 w-32 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                        <div className="py-1">
                          <button
                            onClick={() => handleShowHistorique(produit)}
                            className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-100 flex items-center"
                            title="Voir l'historique"
                          >
                            <svg className="w-3 h-3 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            Historique
                          </button>
                          
                          <button
                            onClick={() => handleShowTvaModal(produit)}
                            className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-100 flex items-center"
                            title="Modifier TVA"
                          >
                            <svg className="w-3 h-3 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                            </svg>
                            TVA
                          </button>
                          
                          <button
                            onClick={() => handleDelete(produit.id)}
                            className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center"
                            title="Supprimer"
                          >
                            <svg className="w-3 h-3 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Supprimer
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Affichage des catégories en mode lecture */}
            {editingProduct?.id !== produit.id && produit.categories && produit.categories.length > 0 && (
              <div className="mt-1 pt-1 border-t border-gray-100">
                <div className="flex flex-wrap gap-1">
                  {produit.categories.map((categorie) => (
                    <span
                      key={categorie.id}
                      className="bg-blue-50 text-blue-700 text-xs px-1.5 py-0.5 rounded-full border border-blue-200"
                    >
                      {categorie.nom_categorie}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
        
        {/* Bouton "Afficher plus" et informations de pagination */}
        {hasMoreProducts && (
          <div className="mt-6 text-center">
            <button
              onClick={handleShowMore}
              className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              Afficher 20 produits de plus
            </button>
            <p className="text-sm text-gray-600 mt-2">
              Affichage de {displayedProduits.length} sur {filteredProduits.length} produits
            </p>
            <p className="text-xs text-blue-600 mt-1">
              {Math.min(20, filteredProduits.length - displayedProduits.length)} produits restants
            </p>
          </div>
        )}
        
        {/* Message quand tous les produits sont affichés */}
        {!hasMoreProducts && filteredProduits.length > 0 && (
          <div className="mt-6 text-center">
            <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-lg">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Tous les produits sont affichés ({filteredProduits.length} produits)
            </div>
          </div>
        )}
      </div>

      {filteredProduits.length === 0 && !loading && (
         <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
           <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
           </svg>
           <p className="text-lg font-medium mb-2">
             {searchTerm || categoryFilterIds.length > 0 ? 'Aucun produit trouvé' : 'Aucun produit'}
           </p>
           <p className="text-sm">
             {searchTerm || categoryFilterIds.length > 0 ? 'Essayez de modifier vos filtres de recherche' : 'Commencez par ajouter votre premier produit'}
           </p>
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