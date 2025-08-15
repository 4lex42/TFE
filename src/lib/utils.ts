import { supabase } from './supabase';

// Fonctions pour les opérations de quantité
export const incrementQuantity = async (produitId: string, amount: number) => {
  try {
    const { data: produit, error: fetchError } = await supabase
      .from('produit')
      .select('quantity')
      .eq('id', produitId)
      .single();

    if (fetchError) throw fetchError;

    const { error: updateError } = await supabase
      .from('produit')
      .update({ quantity: (produit.quantity || 0) + amount })
      .eq('id', produitId);

    if (updateError) throw updateError;
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Une erreur est survenue' };
  }
};

export const decrementQuantity = async (produitId: string, amount: number) => {
  try {
    const { data: produit, error: fetchError } = await supabase
      .from('produit')
      .select('quantity')
      .eq('id', produitId)
      .single();

    if (fetchError) throw fetchError;

    const newQuantity = Math.max(0, (produit.quantity || 0) - amount);

    const { error: updateError } = await supabase
      .from('produit')
      .update({ quantity: newQuantity })
      .eq('id', produitId);

    if (updateError) throw updateError;
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Une erreur est survenue' };
  }
};

// Fonctions de formatage
export const formatPrice = (price: number, currency: string = '€'): string => {
  return `${price.toFixed(2)} ${currency}`;
};

export const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('fr-FR');
};

export const formatDateTime = (date: string): string => {
  return new Date(date).toLocaleString('fr-FR');
};

// Fonctions de validation
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Le mot de passe doit contenir au moins 8 caractères');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins une majuscule');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins une minuscule');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins un chiffre');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Fonctions de calcul
export const calculateTotal = (items: Array<{ prix: number; quantite: number }>): number => {
  return items.reduce((total, item) => total + (item.prix * item.quantite), 0);
};

export const calculateTotalWithTva = (
  items: Array<{ prix: number; quantite: number }>, 
  tvaRate: number
): number => {
  const subtotal = calculateTotal(items);
  return subtotal * (1 + tvaRate / 100);
};

// Fonctions de gestion des erreurs
export const handleSupabaseError = (error: any): string => {
  if (error?.message) {
    return error.message;
  }
  
  if (error?.details) {
    return error.details;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return 'Une erreur inattendue est survenue';
};

// Fonctions de stockage local
export const setLocalStorage = (key: string, value: any): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Erreur lors de la sauvegarde en localStorage:', error);
  }
};

export const getLocalStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Erreur lors de la lecture du localStorage:', error);
    return defaultValue;
  }
};

export const removeLocalStorage = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Erreur lors de la suppression du localStorage:', error);
  }
};

// Fonctions de génération d'ID
export const generateCode = (prefix: string = 'PROD'): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `${prefix}-${timestamp}-${random}`.toUpperCase();
};

// Fonctions de tri et filtrage
export const sortByDate = <T extends { date: string }>(items: T[], ascending: boolean = false): T[] => {
  return [...items].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return ascending ? dateA - dateB : dateB - dateA;
  });
};

export const sortByName = <T extends { nom: string }>(items: T[], ascending: boolean = true): T[] => {
  return [...items].sort((a, b) => {
    const nameA = a.nom.toLowerCase();
    const nameB = b.nom.toLowerCase();
    return ascending ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
  });
};

export const filterBySearch = <T extends { nom: string }>(items: T[], searchTerm: string): T[] => {
  if (!searchTerm.trim()) return items;
  
  const term = searchTerm.toLowerCase();
  return items.filter(item => 
    item.nom.toLowerCase().includes(term)
  );
};

// Fonctions de pagination
export const paginate = <T>(items: T[], page: number, pageSize: number): T[] => {
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  return items.slice(startIndex, endIndex);
};

export const getTotalPages = (totalItems: number, pageSize: number): number => {
  return Math.ceil(totalItems / pageSize);
};
