import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Créer un client Supabase avec la clé de service (côté serveur)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { userId, newStatus } = await request.json();

    // Validation des données
    if (!userId || !newStatus) {
      return NextResponse.json(
        { error: 'ID utilisateur et nouveau statut sont requis' },
        { status: 400 }
      );
    }

    // Récupérer les informations de l'utilisateur
    const { data: user, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (fetchError || !user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    // Mettre à jour le statut dans la table users
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ status: newStatus })
      .eq('id', userId);

    if (updateError) {
      console.error('Erreur mise à jour statut:', updateError);
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour du statut' },
        { status: 500 }
      );
    }

    // Log du changement de statut
    console.log(`Statut de l'utilisateur ${user.email} changé vers: ${newStatus}`);

    return NextResponse.json({
      success: true,
      data: {
        message: `Statut de l'utilisateur mis à jour avec succès vers ${newStatus}`,
        user: { ...user, status: newStatus }
      }
    });

  } catch (error) {
    console.error('Erreur serveur mise à jour statut utilisateur:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
