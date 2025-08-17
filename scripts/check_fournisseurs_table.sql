-- Script pour vérifier et corriger la table fournisseurs
-- Exécuter ce script dans votre base de données Supabase

-- 1. Vérifier la structure actuelle de la table
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'fournisseurs' 
ORDER BY ordinal_position;

-- 2. Vérifier les données existantes
SELECT COUNT(*) as total_fournisseurs FROM fournisseurs;
SELECT COUNT(*) as fournisseurs_avec_email FROM fournisseurs WHERE email IS NOT NULL;
SELECT COUNT(*) as fournisseurs_avec_telephone FROM fournisseurs WHERE telephone IS NOT NULL;
SELECT COUNT(*) as fournisseurs_avec_note FROM fournisseurs WHERE note IS NOT NULL;

-- 3. Afficher quelques exemples de fournisseurs
SELECT id, nom, email, telephone, note, created_at
FROM fournisseurs 
ORDER BY nom 
LIMIT 5;

-- 4. Vérifier les contraintes
SELECT conname, contype, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'fournisseurs'::regclass;

-- 5. Créer des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_fournisseurs_nom ON fournisseurs(nom);
CREATE INDEX IF NOT EXISTS idx_fournisseurs_email ON fournisseurs(email) WHERE email IS NOT NULL;

-- 6. Vérifier les politiques RLS si elles existent
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'fournisseurs';

-- 7. Statistiques des fournisseurs
SELECT 
    'Total fournisseurs' as statut,
    COUNT(*) as valeur
FROM fournisseurs 

UNION ALL

SELECT 
    'Avec email' as statut,
    COUNT(*) as valeur
FROM fournisseurs 
WHERE email IS NOT NULL

UNION ALL

SELECT 
    'Avec téléphone' as statut,
    COUNT(*) as valeur
FROM fournisseurs 
WHERE telephone IS NOT NULL

UNION ALL

SELECT 
    'Avec note' as statut,
    COUNT(*) as valeur
FROM fournisseurs 
WHERE note IS NOT NULL;
