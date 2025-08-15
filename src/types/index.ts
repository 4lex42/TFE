// Types de base
export interface BaseEntity {
  id: string;
}

// Types pour les utilisateurs
export interface User extends BaseEntity {
  name: string | null;
  role: string | null;
  email: string;
  password: string;
}

// Types pour les magasins
export interface Magasin extends BaseEntity {
  location: number;
  users?: User[];
  produits?: MagasinProduit[];
}

export interface MagasinProduit extends BaseEntity {
  id_magasin: string;
  id_produit: string;
  prod_quant: number;
  produit?: Produit;
}

export interface LienUserMagasin extends BaseEntity {
  user_id: string;
  magasin_id: string;
}

// Types pour les produits
export interface Produit extends BaseEntity {
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

// Types pour les catégories
export interface Categorie extends BaseEntity {
  nom_categorie: string;
}

export interface LienCategorieProduit extends BaseEntity {
  id_produit: string;
  id_categorie: string;
}

// Types pour la TVA
export interface Tva extends BaseEntity {
  date: string;
  tva: number;
}

// Types pour les prédictions
export interface Prediction extends BaseEntity {
  date: string;
  prod_prix: number;
  ventes: number;
}

export interface PredictionResult {
  predictedSales: number;
  confidence: number;
}

// Types pour les ajouts de produits
export interface AjoutProduit extends BaseEntity {
  date: string;
  fournisseur: string | null;
  quantity: number;
  type: 'VENTE' | 'RETRAIT_MANUEL' | 'AJOUT';
  note: string | null;
}

export interface AjoutProduitWithProduit extends AjoutProduit {
  produit?: Produit;
}

// Types pour les achats et ventes
export interface Achat extends BaseEntity {
  client_id: string | null;
  date: string;
  mode_paiement: string;
  produits?: AchatProduit[];
}

export interface AchatProduit extends BaseEntity {
  achat_id: string;
  produit_id: string;
  quantite: number;
  prix_unitaire: number;
  produit?: {
    id: string;
    nom: string;
    prix: number;
    photo?: string | null;
  };
}

export interface LienAchatProduit extends BaseEntity {
  id_produit: string;
  id_achat: string;
  quantity_achat: number;
}

// Types pour les statistiques
export interface VenteStats {
  total_ventes: number;
  total_revenus: number;
  produits_vendus: number;
  date_range: {
    start: string;
    end: string;
  };
}

export interface AjoutStats {
  total_ajouts: number;
  total_ventes: number;
  total_retraits: number;
  nombre_operations: number;
}

// Types pour les formulaires
export interface ProduitFormData {
  nom: string;
  quantity: number;
  quantity_critique: number;
  prix: number;
  code: string;
  photo?: string | null;
  description?: string | null;
  tva_id?: string | null;
  categorieIds?: string[];
}

export interface AchatFormData {
  client_id?: string | null;
  date: string;
  mode_paiement: string;
  produits: Array<{
    produit_id: string;
    quantite: number;
    prix_unitaire: number;
  }>;
}

export interface AjoutProduitFormData {
  date: string;
  fournisseur?: string | null;
  quantity: number;
  type: 'VENTE' | 'RETRAIT_MANUEL' | 'AJOUT';
  note?: string | null;
  produit_id?: string;
}

// Types pour les filtres et recherche
export interface FilterOptions {
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  dateFrom?: string;
  dateTo?: string;
}

export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

// Types pour la pagination
export interface PaginationOptions {
  page: number;
  pageSize: number;
  total: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationOptions;
}

// Types pour les réponses d'API
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Types pour les états de chargement
export interface LoadingState {
  loading: boolean;
  error: string | null;
}

// Types pour les notifications
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
}

// Types pour les permissions
export interface Permission {
  resource: string;
  action: string;
}

export interface Role {
  name: string;
  permissions: Permission[];
}

// Types pour les exports
export interface ExportOptions {
  format: 'csv' | 'excel' | 'pdf';
  filters?: FilterOptions;
  columns?: string[];
}

// Types pour les imports
export interface ImportResult {
  success: boolean;
  imported: number;
  errors: Array<{
    row: number;
    message: string;
  }>;
}

// Types pour les graphiques
export interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
  }>;
}

export interface ChartOptions {
  responsive: boolean;
  maintainAspectRatio: boolean;
  scales?: {
    y?: {
      beginAtZero: boolean;
    };
  };
}
