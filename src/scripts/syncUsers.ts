import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Créer un client Supabase avec la clé de service pour avoir accès à auth.users
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function syncUsers() {
  try {
    console.log('Début de la synchronisation des utilisateurs...');

    // 1. Récupérer tous les utilisateurs de auth.users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) throw authError;

    console.log(`${authUsers.users.length} utilisateurs trouvés dans auth.users`);

    // 2. Récupérer tous les utilisateurs de public.users
    const { data: publicUsers, error: publicError } = await supabase
      .from('users')
      .select('id');
    if (publicError) throw publicError;

    console.log(`${publicUsers.length} utilisateurs trouvés dans public.users`);

    // 3. Identifier les utilisateurs manquants
    const existingIds = new Set(publicUsers.map(u => u.id));
    const missingUsers = authUsers.users.filter(u => !existingIds.has(u.id));

    console.log(`${missingUsers.length} utilisateurs à synchroniser`);

    // 4. Créer les utilisateurs manquants dans public.users
    if (missingUsers.length > 0) {
      const { error: insertError } = await supabase
        .from('users')
        .insert(
          missingUsers.map(user => ({
            id: user.id,
            email: user.email,
            name: user.user_metadata.name || user.email?.split('@')[0] || 'Utilisateur',
            role: user.user_metadata.role || 'user'
          }))
        );

      if (insertError) throw insertError;
      console.log('Synchronisation réussie !');
    } else {
      console.log('Aucune synchronisation nécessaire.');
    }

  } catch (error) {
    console.error('Erreur lors de la synchronisation:', error);
  }
}

// Exécuter la synchronisation
syncUsers(); 