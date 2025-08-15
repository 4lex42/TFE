# Configuration du Stockage Supabase - Guide Complet

## 🚨 Erreurs Actuelles

### 1. Erreur "Bucket not found"
```
Object { statusCode: "404", error: "Bucket not found", message: "Bucket not found" }
```

### 2. Erreur CORS
```
Blocage d'une requête multiorigines (Cross-Origin Request) : la politique « Same Origin » ne permet pas de consulter la ressource distante
```

### 3. Erreur Permissions RLS
```
ERROR: 42501: must be owner of table objects
```

### 4. Erreur RLS 403 (Nouvelle)
```
Object { statusCode: "403", error: "Unauthorized", message: "new row violates row-level security policy" }
```

## ✅ Solutions

### 🚀 Solution Rapide (Recommandée)

**Étape 1 : Créer le Bucket de Stockage**

1. **Connectez-vous à votre dashboard Supabase**
   - Allez sur https://supabase.com/dashboard
   - Sélectionnez votre projet

2. **Accédez à la section Storage**
   - Dans le menu de gauche, cliquez sur **"Storage"**
   - Cliquez sur **"New bucket"**

3. **Configurez le bucket**
   ```
   Name: product-images
   Public bucket: ✅ Activé (TRÈS IMPORTANT!)
   File size limit: 5MB
   Allowed MIME types: image/*
   ```

4. **Cliquez sur "Create bucket"**

**Étape 2 : Désactiver RLS (CRUCIAL!)**

1. **Dashboard Supabase** → **Storage** → **Policies**
2. **Cliquez sur votre bucket** `product-images`
3. **Désactivez Row Level Security** :
   - Trouvez le toggle "Row Level Security"
   - **Désactivez-le** (OFF)
   - **Sauvegardez**

**Étape 3 : Tester l'Upload**

Utilisez le composant de diagnostic dans votre application pour tester l'upload.

**C'est tout !** Cette configuration simple suffit pour commencer.

---

## 🔧 Configuration Avancée (Optionnelle)

### Si vous voulez garder RLS activé

Si vous préférez garder Row Level Security activé, créez ces politiques via l'interface :

1. **Dashboard Supabase** → **Storage** → **Policies**
2. **Cliquez sur votre bucket** `product-images`
3. **Ajoutez ces politiques** :

#### Politique 1 : Upload pour tous les utilisateurs authentifiés
- **Name** : `Allow authenticated uploads`
- **Operation** : INSERT
- **Target roles** : `authenticated`
- **Policy definition** : `true`

#### Politique 2 : Lecture publique
- **Name** : `Allow public read`
- **Operation** : SELECT
- **Target roles** : `*`
- **Policy definition** : `true`

#### Politique 3 : Suppression pour utilisateurs authentifiés
- **Name** : `Allow authenticated deletes`
- **Operation** : DELETE
- **Target roles** : `authenticated`
- **Policy definition** : `true`

### Configuration CORS (Optionnelle)

1. **Dans votre dashboard Supabase**
   - Allez dans **Settings** > **API**
   - Trouvez la section **"CORS (Cross-Origin Resource Sharing)"**

2. **Ajoutez vos domaines autorisés**
   ```
   http://localhost:3000
   http://localhost:3001
   https://votre-domaine.com
   ```

3. **Sauvegardez les paramètres**

---

## 🔍 Test de la Configuration

### Test Automatique

Utilisez le composant de diagnostic dans votre application :
1. Allez dans la page de gestion des produits
2. Cliquez sur "Afficher Diagnostic"
3. Cliquez sur "Tester l'Upload"

### Test Manuel

```javascript
// Dans la console du navigateur
const testFile = new File(['test'], 'test.txt', { type: 'text/plain' });

const { data, error } = await supabase.storage
  .from('product-images')
  .upload('test.txt', testFile);

console.log('Upload result:', data);
console.log('Upload error:', error);
```

---

## 🚨 Dépannage

### Erreur "Bucket not found"
- ✅ Vérifiez que le bucket `product-images` existe
- ✅ Vérifiez que le bucket est marqué comme "Public"
- ✅ Vérifiez le nom exact (sensible à la casse)

### Erreur "must be owner of table objects"
- ✅ **Solution** : Utilisez l'interface graphique au lieu de SQL
- ✅ Ou ignorez les politiques RLS (bucket public suffit)

### Erreur RLS 403 "new row violates row-level security policy"
- ✅ **Solution 1** : Désactivez RLS sur le bucket (recommandé)
- ✅ **Solution 2** : Créez des politiques RLS permissives
- ✅ **Vérification** : Assurez-vous que l'utilisateur est authentifié

### Erreur CORS
- ✅ **Solution** : Configurez CORS dans Settings > API
- ✅ Ou ignorez pour le développement local

### Erreur d'authentification
- ✅ Vérifiez que l'utilisateur est connecté
- ✅ Vérifiez les clés API Supabase

---

## 📝 Configuration Alternative

Si les problèmes persistent, vous pouvez temporairement désactiver le stockage :

```typescript
// Dans src/lib/storage.ts, modifiez :
const ENABLE_STORAGE = false; // Désactiver temporairement
```

---

## 🔄 Prochaines Étapes

Une fois la configuration terminée :

1. **Testez l'upload d'images** avec le diagnostic
2. **Vérifiez l'affichage des images** dans les produits
3. **Testez la suppression d'images**
4. **Configurez les politiques RLS** si nécessaire (optionnel)

---

## 💡 Conseils

- **Commencez simple** : Un bucket public avec RLS désactivé suffit
- **Testez d'abord** : Utilisez le diagnostic avant de configurer les politiques
- **RLS = Complexité** : Désactivez RLS pour commencer, activez-le plus tard si nécessaire
- **CORS optionnel** : Pas nécessaire pour le développement local
- **Authentification requise** : Assurez-vous que l'utilisateur est connecté

---

## 📞 Support

Si les problèmes persistent :
1. Vérifiez les logs Supabase
2. Consultez la documentation officielle
3. Contactez le support Supabase si nécessaire
