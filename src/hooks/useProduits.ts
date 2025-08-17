import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { enregistrerMouvementStock } from '../lib/stockUtils';

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
        // IMPORTANT : Enregistrer la création du produit dans l'historique
        const resultatHistorique = await enregistrerMouvementStock(
          newProduitWithId.id,
          'AJOUT',
          newProduit.quantity,
          `Création du nouveau produit "${newProduit.nom}" (${newProduit.code}) - stock initial: ${newProduit.quantity}`
        );
        
        if (!resultatHistorique.success) {
          console.error('ÉCHEC CRITIQUE de l\'enregistrement de l\'historique de création:', resultatHistorique.error);
          // Continuer mais logger l'erreur critique
        } else {
          console.log(`Historique de création enregistré pour le produit ${newProduit.nom}`);
        }

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
      // Si la quantité est mise à jour, enregistrer le mouvement dans l'historique
      if (updates.quantity !== undefined) {
        const produit = produits.find(p => p.id === id);
        if (produit) {
          const difference = updates.quantity - produit.quantity;
          if (difference !== 0) {
            const typeMouvement = difference > 0 ? 'AJOUT' : 'RETRAIT_MANUEL';
            const note = difference > 0 
              ? `Modification du stock via gestion des produits: ${produit.quantity} → ${updates.quantity} (+${difference})`
              : `Modification du stock via gestion des produits: ${produit.quantity} → ${updates.quantity} (${difference})`;
            
            const resultatHistorique = await enregistrerMouvementStock(
              id,
              typeMouvement,
              Math.abs(difference),
              note
            );
            
            if (!resultatHistorique.success) {
              console.error('ÉCHEC CRITIQUE de l\'enregistrement de l\'historique de modification:', resultatHistorique.error);
            } else {
              console.log(`Historique de modification enregistré pour le produit ${produit.nom}`);
            }
          }
        }
      }

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
      // Récupérer les informations du produit avant suppression
      const produit = produits.find(p => p.id === id);
      if (produit) {
        // IMPORTANT : Enregistrer la suppression dans l'historique AVANT toute suppression
        // Cela garantit que l'historique est toujours conservé
        const resultatHistorique = await enregistrerMouvementStock(
          id,
          'SUPPRESSION',
          produit.quantity,
          `Suppression du produit "${produit.nom}" (${produit.code}) - tout le stock retiré`
        );
        
        if (!resultatHistorique.success) {
          console.error('ÉCHEC CRITIQUE de l\'enregistrement de l\'historique:', resultatHistorique.error);
          // Ne pas continuer si l'historique échoue - c'est critique pour la traçabilité
          throw new Error(`Impossible d'enregistrer l'historique de suppression: ${resultatHistorique.error}`);
        }
        
        console.log(`Historique de suppression enregistré pour le produit ${produit.nom}`);
      }

      // Supprimer d'abord les liens avec les catégories
      const { error: lienError } = await supabase
        .from('lien_categorie_produit')
        .delete()
        .eq('id_produit', id);

      if (lienError) {
        console.warn('Erreur lors de la suppression des liens catégories:', lienError);
      }

      // Supprimer les liens avec les achats
      const { error: achatError } = await supabase
        .from('lien_achat_produit')
        .delete()
        .eq('id_produit', id);

      if (achatError) {
        console.warn('Erreur lors de la suppression des liens achats:', achatError);
      }

      // Maintenant supprimer le produit
      const { error } = await supabase
        .from('produit')
        .delete()
        .eq('id', id);

      if (error) {
        // Gérer spécifiquement les erreurs de contraintes
        if (error.code === '23503') {
          throw new Error('Impossible de supprimer ce produit car il est encore référencé dans d\'autres tables. Veuillez d\'abord supprimer les références.');
        }
        throw error;
      }

      setProduits(produits.filter(p => p.id !== id));
      return { success: true };
    } catch (err) {
      console.error('Erreur lors de la suppression du produit:', err);
      
      // Message d'erreur plus spécifique
      let errorMessage = 'Une erreur est survenue';
      if (err instanceof Error) {
        if (err.message.includes('référencé')) {
          errorMessage = err.message;
        } else if (err.message.includes('historique')) {
          errorMessage = `Erreur critique: ${err.message}`;
        } else {
          errorMessage = `Erreur lors de la suppression: ${err.message}`;
        }
      }
      
      return { success: false, error: errorMessage };
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