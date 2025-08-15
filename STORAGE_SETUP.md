# Configuration du Stockage Supabase pour les Images de Produits

## 📋 Prérequis

1. Un projet Supabase configuré
2. Les permissions d'administrateur sur votre projet Supabase

## 🚀 Configuration du Bucket de Stockage

### 1. Créer le Bucket

1. Connectez-vous à votre dashboard Supabase
2. Allez dans la section **Storage**
3. Cliquez sur **"New bucket"**
4. Configurez le bucket :
   - **Name**: `product-images`
   - **Public bucket**: ✅ Activé (pour permettre l'accès public aux images)
   - **File size limit**: 5MB (ou selon vos besoins)
   - **Allowed MIME types**: `image/*`

### 2. Configurer les Permissions RLS (Row Level Security)

Dans l'éditeur SQL de Supabase, exécutez les commandes suivantes :

```sql
-- Activer RLS sur le bucket
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre l'upload d'images (utilisateurs authentifiés)
CREATE POLICY "Allow authenticated users to upload images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'product-images' 
  AND auth.role() = 'authenticated'
);

-- Politique pour permettre la lecture publique des images
CREATE POLICY "Allow public read access to images" ON storage.objects
FOR SELECT USING (bucket_id = 'product-images');

-- Politique pour permettre la suppression d'images (utilisateurs authentifiés)
CREATE POLICY "Allow authenticated users to delete images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'product-images' 
  AND auth.role() = 'authenticated'
);

-- Politique pour permettre la mise à jour d'images (utilisateurs authentifiés)
CREATE POLICY "Allow authenticated users to update images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'product-images' 
  AND auth.role() = 'authenticated'
);
```

### 3. Vérifier la Configuration

Après la configuration, vous devriez voir :
- ✅ Bucket `product-images` créé
- ✅ RLS activé avec les politiques appropriées
- ✅ Accès public activé

## 🔧 Utilisation dans l'Application

### Composant ImageUpload

Le composant `ImageUpload` gère automatiquement :
- ✅ Validation des types de fichiers (images uniquement)
- ✅ Validation de la taille (max 5MB)
- ✅ Upload vers Supabase Storage
- ✅ Prévisualisation des images
- ✅ Gestion des erreurs
- ✅ Drag & drop

### Fonctionnalités

1. **Upload d'image** : Glissez-déposez ou cliquez pour sélectionner
2. **Prévisualisation** : Aperçu immédiat de l'image sélectionnée
3. **Validation** : Vérification automatique du type et de la taille
4. **Gestion d'erreurs** : Messages d'erreur clairs
5. **Suppression** : Bouton pour retirer l'image

## 📁 Structure des Fichiers

```
src/
├── components/
│   ├── ImageUpload.tsx          # Composant d'upload d'images
│   └── ProductManagement.tsx    # Gestion des produits avec images
├── lib/
│   ├── storage.ts               # Utilitaires de stockage
│   └── supabase.ts              # Configuration Supabase
└── hooks/
    └── useProduits.ts           # Hook pour les produits
```

## 🛠️ Fonctions Utilitaires

### `storageUtils.uploadImage(file, fileName?)`
Upload une image vers Supabase Storage.

### `storageUtils.deleteImage(imageUrl)`
Supprime une image du stockage.

### `storageUtils.validateImage(file)`
Valide le type et la taille d'un fichier image.

### `storageUtils.generateFileName(originalName)`
Génère un nom de fichier unique.

## 🔒 Sécurité

- ✅ Validation côté client et serveur
- ✅ Limitation de taille de fichier
- ✅ Types de fichiers restreints
- ✅ Noms de fichiers uniques
- ✅ Permissions RLS configurées

## 🚨 Dépannage

### Erreur "Bucket not found"
- Vérifiez que le bucket `product-images` existe
- Vérifiez le nom exact du bucket

### Erreur "Access denied"
- Vérifiez les politiques RLS
- Vérifiez que l'utilisateur est authentifié

### Erreur "File too large"
- Vérifiez la limite de taille du bucket
- Vérifiez la validation côté client

### Images ne s'affichent pas
- Vérifiez que le bucket est public
- Vérifiez les URLs générées
- Vérifiez les politiques de lecture

## 📝 Notes Importantes

1. **Performance** : Les images sont optimisées pour le web
2. **Sécurité** : Validation stricte des types de fichiers
3. **UX** : Interface intuitive avec drag & drop
4. **Maintenance** : Nettoyage automatique des anciennes images
5. **Scalabilité** : Structure prête pour la croissance

## 🔄 Mise à Jour

Pour mettre à jour la configuration :
1. Modifiez les politiques RLS si nécessaire
2. Ajustez les limites de taille
3. Ajoutez de nouveaux types de fichiers si besoin
4. Testez les nouvelles configurations
