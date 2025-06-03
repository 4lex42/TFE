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
      };
      magasin: {
        Row: {
          id: string;
          location: number;
          adresse: string;
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
          tva_id: string;
          predict_id: string;
          description: string | null;
          ajout_produit_id: string;
        };
      };
      predictions: {
        Row: {
          id: string;
          date: string;
          prod_prix: number;
          ventes: number;
        };
      };
      categorie: {
        Row: {
          id: string;
          nom_categorie: string;
        };
      };
      produit_categorie: {
        Row: {
          id: string;
          produit_id: string;
          categorie_id: string;
        };
      };
      achat: {
        Row: {
          id: string;
          client_id: string | null;
          date: string;
          mode_paiement: string;
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
      };
    };
  };
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey); 