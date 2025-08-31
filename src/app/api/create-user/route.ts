import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Créer un client Supabase avec la clé de service (côté serveur)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, role } = await request.json();

    // Validation des données
    if (!email || !password || !name || !role) {
      return NextResponse.json(
        { error: 'Tous les champs sont requis' },
        { status: 400 }
      );
    }

    // Créer l'utilisateur avec l'API d'administration
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        role,
      }
    });

    if (authError) {
      console.error('Erreur création utilisateur auth:', authError);
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    // Ajouter les informations dans la table users
    if (authData.user) {
      const { error: profileError } = await supabaseAdmin
        .from('users')
        .insert([{
          id: authData.user.id,
          email,
          name,
          role,
          status: 'pending', // Nouveaux utilisateurs sont en attente d'approbation
        }]);

      if (profileError) {
        console.error('Erreur création profil utilisateur:', profileError);
        // Si l'insertion du profil échoue, supprimer l'utilisateur auth créé
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        return NextResponse.json(
          { error: 'Erreur lors de la création du profil utilisateur' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        user: authData.user,
        message: 'Utilisateur créé avec succès'
      }
    });

  } catch (error) {
    console.error('Erreur serveur création utilisateur:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
