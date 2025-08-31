import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          name: string | null;
          role: string | null;
          email: string;
          password: string;
        };
        Insert: {
          id?: string;
          name?: string | null;
          role?: string | null;
          email: string;
          password: string;
        };
        Update: {
          id?: string;
          name?: string | null;
          role?: string | null;
          email?: string;
          password?: string;
        };
      };
      magasin: {
        Row: {
          id: string;
          location: number;
        };
        Insert: {
          id?: string;
          location: number;
        };
        Update: {
          id?: string;
          location?: number;
        };
      };
      lien_user_magasin: {
        Row: {
          id: string;
          user_id: string;
          magasin_id: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          magasin_id: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          magasin_id?: string;
        };
      };
      tva: {
        Row: {
          id: string;
          date: string;
          tva: number;
        };
        Insert: {
          id?: string;
          date: string;
          tva: number;
        };
        Update: {
          id?: string;
          date?: string;
          tva?: number;
        };
      };
      ajout_produits: {
        Row: {
          id: string;
          date: string;
          fournisseur: string | null;
          quantity: number;
          type: 'VENTE' | 'RETRAIT_MANUEL' | 'AJOUT';
          note: string | null;
        };
        Insert: {
          id?: string;
          date: string;
          fournisseur?: string | null;
          quantity: number;
          type?: 'VENTE' | 'RETRAIT_MANUEL' | 'AJOUT';
          note?: string | null;
        };
        Update: {
          id?: string;
          date?: string;
          fournisseur?: string | null;
          quantity?: number;
          type?: 'VENTE' | 'RETRAIT_MANUEL' | 'AJOUT';
          note?: string | null;
        };
      };
      predictions: {
        Row: {
          id: string;
          date: string;
          prod_prix: number;
          ventes: number;
        };
        Insert: {
          id?: string;
          date: string;
          prod_prix: number;
          ventes: number;
        };
        Update: {
          id?: string;
          date?: string;
          prod_prix?: number;
          ventes?: number;
        };
      };
      produit: {
        Row: {
          id: string;
          nom: string;
          quantity: number;
          quantity_critique: number;
          prix: number;
          code: string;
          photo: string | null;
          tva_id: string | null;
          tva_direct: number | null;
          predict_id: string | null;
          description: string | null;
          ajout_produit_id: string | null;
        };
        Insert: {
          id?: string;
          nom: string;
          quantity: number;
          quantity_critique: number;
          prix: number;
          code: string;
          photo?: string | null;
          tva_id?: string | null;
          tva_direct?: number | null;
          predict_id?: string | null;
          description?: string | null;
          ajout_produit_id?: string | null;
        };
        Update: {
          id?: string;
          nom?: string;
          quantity?: number;
          quantity_critique?: number;
          prix?: number;
          code?: string;
          photo?: string | null;
          tva_id?: string | null;
          tva_direct?: number | null;
          predict_id?: string | null;
          description?: string | null;
          ajout_produit_id?: string | null;
        };
      };
      categorie: {
        Row: {
          id: string;
          nom_categorie: string;
        };
        Insert: {
          id?: string;
          nom_categorie: string;
        };
        Update: {
          id?: string;
          nom_categorie?: string;
        };
      };
      lien_categorie_produit: {
        Row: {
          id: string;
          id_produit: string;
          id_categorie: string;
        };
        Insert: {
          id?: string;
          id_produit: string;
          id_categorie: string;
        };
        Update: {
          id?: string;
          id_produit?: string;
          id_categorie?: string;
        };
      };
      achat: {
        Row: {
          id: string;
          client_id: string | null;
          date: string;
          mode_paiement: string;
        };
        Insert: {
          id?: string;
          client_id?: string | null;
          date: string;
          mode_paiement: string;
        };
        Update: {
          id?: string;
          client_id?: string | null;
          date?: string;
          mode_paiement?: string;
        };
      };
      lien_achat_produit: {
        Row: {
          id: string;
          id_produit: string;
          id_achat: string;
          quantity_achat: number;
        };
        Insert: {
          id?: string;
          id_produit: string;
          id_achat: string;
          quantity_achat: number;
        };
        Update: {
          id?: string;
          id_produit?: string;
          id_achat?: string;
          quantity_achat?: number;
        };
      };
      achat_produit: {
        Row: {
          id: string;
          achat_id: string;
          produit_id: string;
          quantite: number;
          prix_unitaire: number;
        };
        Insert: {
          id?: string;
          achat_id: string;
          produit_id: string;
          quantite: number;
          prix_unitaire: number;
        };
        Update: {
          id?: string;
          achat_id?: string;
          produit_id?: string;
          quantite?: number;
          prix_unitaire?: number;
        };
      };
      lien_magasin_produit: {
        Row: {
          id: string;
          id_magasin: string;
          id_produit: string;
          prod_quant: number;
        };
        Insert: {
          id?: string;
          id_magasin: string;
          id_produit: string;
          prod_quant: number;
        };
        Update: {
          id?: string;
          id_magasin?: string;
          id_produit?: string;
          prod_quant?: number;
        };
      };
      fournisseurs: {
        Row: {
          id: string;
          nom: string;
          email: string | null;
          telephone: string | null;
          note: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          nom: string;
          email?: string | null;
          telephone?: string | null;
          note?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          nom?: string;
          email?: string | null;
          telephone?: string | null;
          note?: string | null;
          created_at?: string | null;
        };
      };
      lien_produit_fournisseur: {
        Row: {
          id: string;
          produit_id: string;
          fournisseur_id: string;
        };
        Insert: {
          id?: string;
          produit_id: string;
          fournisseur_id: string;
        };
        Update: {
          id?: string;
          produit_id?: string;
          fournisseur_id?: string;
        };
      };
      historique: {
        Row: {
          id: string;
          produit_id: string | null;
          tva_id: string | null;
          date: string;
          tva: number;
        };
        Insert: {
          id?: string;
          produit_id: string | null;
          tva_id: string | null;
          date: string;
          tva: number;
        };
        Update: {
          id?: string;
          produit_id?: string | null;
          tva_id?: string | null;
          date?: string;
          tva?: number;
        };
      };
    };
  };
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey); 