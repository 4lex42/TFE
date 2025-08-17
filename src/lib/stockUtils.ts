import { supabase } from './supabase';
import { HistoriqueStock } from '../types';

/**
 * Enregistre automatiquement un mouvement de stock dans l'historique
 * @param produitId - ID du produit concerné
 * @param typeMouvement - Type de mouvement (AJOUT, VENTE, RETRAIT_MANUEL)
 * @param quantite - Quantité ajoutée ou retirée (positive pour AJOUT, négative pour VENTE/RETRAIT)
 * @param note - Note optionnelle
 * @param userId - ID de l'utilisateur qui effectue l'opération (optionnel)
 */
export const enregistrerMouvementStock = async (
  produitId: string,
  typeMouvement: 'AJOUT' | 'VENTE' | 'RETRAIT_MANUEL' | 'SUPPRESSION',
  quantite: number,
  note?: string,
  userId?: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Récupérer l'utilisateur connecté si userId n'est pas fourni
    let currentUserId = userId;
    if (!currentUserId) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        currentUserId = user?.id || null;
      } catch (authError) {
        console.warn('Impossible de récupérer l\'utilisateur connecté:', authError);
        currentUserId = null;
      }
    }

    // IMPORTANT : Pour les suppressions, on ne vérifie PAS l'existence du produit
    // car on veut enregistrer l'historique même si le produit est supprimé
    if (typeMouvement !== 'SUPPRESSION') {
      const { data: produit, error: produitError } = await supabase
        .from('produit')
        .select('id')
        .eq('id', produitId)
        .single();

      if (produitError || !produit) {
        console.warn(`Produit ${produitId} non trouvé, impossible d'enregistrer l'historique`);
        return { success: false, error: 'Produit non trouvé' };
      }
    }

    // Créer l'enregistrement dans l'historique
    const { error } = await supabase
      .from('historique_stock')
      .insert([{
        produit_id: produitId,
        user_id: currentUserId,
        type_mouvement: typeMouvement,
        quantite: Math.abs(quantite), // Toujours positif dans l'historique
        note: note || null,
      }]);

    if (error) {
      console.error('Erreur Supabase lors de l\'insertion:', error);
      throw error;
    }

    console.log(`✅ Historique enregistré: ${typeMouvement} pour le produit ${produitId} (${quantite})`);
    return { success: true };
  } catch (err) {
    console.error('❌ Erreur lors de l\'enregistrement du mouvement de stock:', err);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement du mouvement' 
    };
  }
};

/**
 * Enregistre un ajout de stock (quantité positive)
 */
export const enregistrerAjoutStock = async (
  produitId: string,
  quantite: number,
  note?: string,
  userId?: string
) => {
  return enregistrerMouvementStock(produitId, 'AJOUT', quantite, note, userId);
};

/**
 * Enregistre une vente (quantité négative)
 */
export const enregistrerVenteStock = async (
  produitId: string,
  quantite: number,
  note?: string,
  userId?: string
) => {
  return enregistrerMouvementStock(produitId, 'VENTE', quantite, note, userId);
};

/**
 * Enregistre un retrait manuel (quantité négative)
 */
export const enregistrerRetraitStock = async (
  produitId: string,
  quantite: number,
  note?: string,
  userId?: string
) => {
  return enregistrerMouvementStock(produitId, 'RETRAIT_MANUEL', quantite, note, userId);
};

/**
 * Enregistre la suppression d'un produit
 */
export const enregistrerSuppressionStock = async (
  produitId: string,
  quantite: number,
  note?: string,
  userId?: string
) => {
  return enregistrerMouvementStock(produitId, 'SUPPRESSION', quantite, note, userId);
};

/**
 * Met à jour le stock d'un produit et enregistre le mouvement
 * @param produitId - ID du produit
 * @param nouvelleQuantite - Nouvelle quantité totale
 * @param typeMouvement - Type de mouvement
 * @param note - Note optionnelle
 * @param userId - ID de l'utilisateur
 */
export const mettreAJourStockAvecHistorique = async (
  produitId: string,
  nouvelleQuantite: number,
  typeMouvement: 'AJOUT' | 'VENTE' | 'RETRAIT_MANUEL' | 'SUPPRESSION',
  note?: string,
  userId?: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Récupérer la quantité actuelle
    const { data: produit, error: fetchError } = await supabase
      .from('produit')
      .select('quantity')
      .eq('id', produitId)
      .single();

    if (fetchError) throw fetchError;

    const quantiteActuelle = produit.quantity || 0;
    const difference = nouvelleQuantite - quantiteActuelle;

    if (difference === 0) {
      return { success: true }; // Aucun changement
    }

    // Mettre à jour le stock
    const { error: updateError } = await supabase
      .from('produit')
      .update({ quantity: nouvelleQuantite })
      .eq('id', produitId);

    if (updateError) throw updateError;

    // Enregistrer le mouvement dans l'historique
    const resultatHistorique = await enregistrerMouvementStock(
      produitId,
      typeMouvement,
      Math.abs(difference),
      note,
      userId
    );

    if (!resultatHistorique.success) {
      console.warn('Stock mis à jour mais échec de l\'enregistrement de l\'historique');
    }

    return { success: true };
  } catch (err) {
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Erreur lors de la mise à jour du stock' 
    };
  }
};
