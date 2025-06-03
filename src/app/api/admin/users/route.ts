import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request: Request) {
  try {
    const { email, password, name, role } = await request.json();

    // 1. Créer l'utilisateur dans auth.users
    const { data, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        role
      }
    });

    if (authError) throw authError;

    if (data.user) {
      // 2. Ajouter l'utilisateur dans public.users
      const { error: profileError } = await supabaseAdmin
        .from('users')
        .insert([{
          id: data.user.id,
          email,
          name,
          role
        }]);

      if (profileError) throw profileError;

      return NextResponse.json({ success: true, user: data.user });
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur lors de la création de l\'utilisateur' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*');

    if (error) throw error;

    return NextResponse.json({ users: data });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des utilisateurs' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');

    if (!userId) {
      return NextResponse.json(
        { error: 'ID utilisateur requis' },
        { status: 400 }
      );
    }

    // 1. Supprimer l'utilisateur de auth.users
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(
      userId
    );

    if (authError) throw authError;

    // 2. Supprimer l'utilisateur de public.users
    const { error: profileError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', userId);

    if (profileError) throw profileError;

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de l\'utilisateur' },
      { status: 500 }
    );
  }
} 