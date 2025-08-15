import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface Produit {
  id: string;
  nom: string;
  quantity: number;
  quantity_critique: number;
  prix: number;
  code: string;
  photo?: string | null;
  description: string | null;
  tva_id?: string | null;
  predict_id?: string | null;
  ajout_produit_id?: string | null;
  categories?: Categorie[];
  tva?: Tva;
  prediction?: Prediction;
  ajout_produit?: AjoutProduit;
}

export interface Categorie {
  id: string;
  nom_categorie: string;
}

export interface Tva {
  id: string;
  date: string;
  tva: number;
}

export interface Prediction {
  id: string;
  date: string;
  prod_prix: number;
  ventes: number;
}

export interface AjoutProduit {
  id: string;
  date: string;
  fournisseur: string | null;
  quantity: number;
  type: 'VENTE' | 'RETRAIT_MANUEL' | 'AJOUT';
  note: string | null;
}

export const useProduits = () => {
  const [produits, setProduits] = useState<Produit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProduits = async () => {
    try {
      const { data, error } = await supabase
        .from('produit')
        .select(`
          *,
          categories:lien_categorie_produit(
            id_categorie,
            categorie:categorie(id, nom_categorie)
          ),
          tva:tva(id, date, tva),
          prediction:predictions(id, date, prod_prix, ventes),
          ajout_produit:ajout_produits(id, date, fournisseur, quantity, type, note)
        `)
        .order('nom', { ascending: true }); // Tri stable par nom

      if (error) throw error;
      
      // Transformer les données pour simplifier la structure
      const transformedData = (data || []).map(produit => ({
        ...produit,
        categories: produit.categories?.map((cat: any) => cat.categorie).filter(Boolean) || [],
        tva: produit.tva?.[0] || null,
        prediction: produit.prediction?.[0] || null,
        ajout_produit: produit.ajout_produit?.[0] || null,
      }));
      
      setProduits(transformedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const addProduit = async (newProduit: Omit<Produit, 'id' | 'categories' | 'tva' | 'prediction' | 'ajout_produit'>) => {
    try {
      const { data, error } = await supabase
        .from('produit')
        .insert([newProduit])
        .select();

      if (error) throw error;
      
      // Ajouter le nouveau produit à l'état local avec des catégories vides
      const newProduitWithId = data?.[0];
      if (newProduitWithId) {
        setProduits(prevProduits => [
          ...prevProduits, 
          {
            ...newProduitWithId,
            categories: [],
            tva: null,
            prediction: null,
            ajout_produit: null
          }
        ]);
      }
      
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Une erreur est survenue' };
    }
  };

  const updateProduit = async (id: string, updates: Partial<Produit>) => {
    try {
      const { data, error } = await supabase
        .from('produit')
        .update(updates)
        .eq('id', id)
        .select();

      if (error) throw error;
      
      // Mettre à jour l'état local en préservant les catégories existantes
      setProduits(prevProduits => 
        prevProduits.map(produit => 
          produit.id === id 
            ? { 
                ...produit, 
                ...updates,
                // Préserver les catégories existantes si elles ne sont pas dans les updates
                categories: updates.categories !== undefined ? updates.categories : produit.categories
              }
            : produit
        )
      );
      
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Une erreur est survenue' };
    }
  };

  const deleteProduit = async (id: string) => {
    try {
      const { error } = await supabase
        .from('produit')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setProduits(produits.filter(p => p.id !== id));
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Une erreur est survenue' };
    }
  };

  const addCategorieToProduit = async (produitId: string, categorieId: string) => {
    try {
      const { error } = await supabase
        .from('lien_categorie_produit')
        .insert([{ id_produit: produitId, id_categorie: categorieId }]);

      if (error) throw error;
      
      // Mettre à jour l'état local sans recharger tous les produits
      const categorie = await getCategorieById(categorieId);
      if (categorie) {
        setProduits(prevProduits => 
          prevProduits.map(produit => 
            produit.id === produitId 
              ? { 
                  ...produit, 
                  categories: [...(produit.categories || []), categorie]
                }
              : produit
          )
        );
      }
      
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Une erreur est survenue' };
    }
  };

  const removeCategorieFromProduit = async (produitId: string, categorieId: string) => {
    try {
      const { error } = await supabase
        .from('lien_categorie_produit')
        .delete()
        .eq('id_produit', produitId)
        .eq('id_categorie', categorieId);

      if (error) throw error;
      
      // Mettre à jour l'état local sans recharger tous les produits
      setProduits(prevProduits => 
        prevProduits.map(produit => 
          produit.id === produitId 
            ? { 
                ...produit, 
                categories: (produit.categories || []).filter(cat => cat.id !== categorieId)
              }
            : produit
        )
      );
      
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Une erreur est survenue' };
    }
  };

  // Fonction utilitaire pour récupérer une catégorie par ID
  const getCategorieById = async (categorieId: string): Promise<Categorie | null> => {
    try {
      const { data, error } = await supabase
        .from('categorie')
        .select('id, nom_categorie')
        .eq('id', categorieId)
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Erreur lors de la récupération de la catégorie:', err);
      return null;
    }
  };

  useEffect(() => {
    fetchProduits();
  }, []);

  return {
    produits,
    loading,
    error,
    addProduit,
    updateProduit,
    deleteProduit,
    addCategorieToProduit,
    removeCategorieFromProduit,
    refreshProduits: fetchProduits
  };
}; 