import { supabase } from './supabase';

// Configuration du bucket de stockage
export const STORAGE_BUCKET = 'product-images';

// Mode de développement - désactiver temporairement si nécessaire
const ENABLE_STORAGE = true;

// Fonctions utilitaires pour le stockage
export const storageUtils = {
  // Upload d'une image
  async uploadImage(file: File, fileName?: string): Promise<{ url: string; error?: string }> {
    try {
      // Vérifier si le stockage est activé
      if (!ENABLE_STORAGE) {
        console.warn('Storage désactivé - utilisation d\'une URL factice');
        return { url: 'https://via.placeholder.com/150' };
      }

      const fileExt = file.name.split('.').pop();
      const finalFileName = fileName || `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${finalFileName}`;

      console.log('Tentative d\'upload vers:', STORAGE_BUCKET, 'avec le fichier:', filePath);

      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, file);

      if (uploadError) {
        console.error('Erreur upload Supabase:', uploadError);
        
        // Si c'est une erreur de bucket non trouvé, donner des instructions
        if (uploadError.message?.includes('Bucket not found')) {
          throw new Error(`Bucket '${STORAGE_BUCKET}' non trouvé. Veuillez créer le bucket dans votre dashboard Supabase.`);
        }
        
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(filePath);

      console.log('Upload réussi, URL publique:', publicUrl);
      return { url: publicUrl };
    } catch (error) {
      console.error('Erreur upload image:', error);
      
      // Retourner une URL factice en cas d'erreur pour permettre le test
      if (error instanceof Error && error.message.includes('Bucket not found')) {
        return { 
          url: 'https://via.placeholder.com/150?text=Upload+Error', 
          error: 'Bucket non configuré. Veuillez créer le bucket "product-images" dans Supabase.' 
        };
      }
      
      return { 
        url: 'https://via.placeholder.com/150?text=Error', 
        error: error instanceof Error ? error.message : 'Erreur lors de l\'upload' 
      };
    }
  },

  // Suppression d'une image
  async deleteImage(imageUrl: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!ENABLE_STORAGE) {
        console.warn('Storage désactivé - suppression simulée');
        return { success: true };
      }

      // Extraire le nom du fichier de l'URL
      const urlParts = imageUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];

      // Ignorer les URLs factices
      if (imageUrl.includes('placeholder.com')) {
        return { success: true };
      }

      const { error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([fileName]);

      if (error) {
        throw error;
      }

      return { success: true };
    } catch (error) {
      console.error('Erreur suppression image:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur lors de la suppression' 
      };
    }
  },

  // Validation d'une image
  validateImage(file: File): { valid: boolean; error?: string } {
    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      return { valid: false, error: 'Le fichier doit être une image (JPG, PNG, GIF, etc.)' };
    }

    // Vérifier la taille (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return { valid: false, error: 'L\'image ne doit pas dépasser 5MB' };
    }

    return { valid: true };
  },

  // Générer un nom de fichier unique
  generateFileName(originalName: string): string {
    const fileExt = originalName.split('.').pop();
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    return `${timestamp}-${randomString}.${fileExt}`;
  },

  // Vérifier si le bucket existe
  async checkBucketExists(): Promise<boolean> {
    try {
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .list('', { limit: 1 });
      
      if (error) {
        console.error('Erreur vérification bucket:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Erreur lors de la vérification du bucket:', error);
      return false;
    }
  }
};

// Hook personnalisé pour la gestion des images
export const useImageUpload = () => {
  const uploadImage = async (file: File): Promise<{ url: string; error?: string }> => {
    return await storageUtils.uploadImage(file);
  };

  const deleteImage = async (imageUrl: string): Promise<{ success: boolean; error?: string }> => {
    return await storageUtils.deleteImage(imageUrl);
  };

  const validateImage = (file: File): { valid: boolean; error?: string } => {
    return storageUtils.validateImage(file);
  };

  const checkBucketExists = async (): Promise<boolean> => {
    return await storageUtils.checkBucketExists();
  };

  return {
    uploadImage,
    deleteImage,
    validateImage,
    checkBucketExists
  };
};
