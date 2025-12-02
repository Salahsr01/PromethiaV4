import { NextResponse } from 'next/server'
import { createServerClient } from '../../lib/supabase'

export async function POST() {
  try {
    const supabase = createServerClient()

    // Créer l'utilisateur par défaut
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'salah@promethia.app')
      .single()

    if (existingUser) {
      return NextResponse.json({
        success: true,
        message: 'Utilisateur existe déjà',
        user: existingUser
      })
    }

    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        email: 'salah@promethia.app',
        name: 'Salah-Eddine Sriar'
      } as any)
      .select()
      .single()

    if (error) throw error

    // Créer le tableau de bord par défaut
    const { data: defaultDashboard, error: dashError } = await supabase
      .from('dashboards')
      .insert({
        name: 'Tableau de Bord',
        description: 'Tableau de bord principal avec Burnrate, Tracker et Spending',
        owner_id: (newUser as any).id,
        is_default: true,
        widgets: []
      } as any)
      .select()
      .single()

    if (dashError) {
      console.error('Erreur création dashboard:', dashError)
    }

    return NextResponse.json({
      success: true,
      message: 'Utilisateur et dashboard créés !',
      user: newUser,
      dashboard: defaultDashboard
    })

  } catch (error) {
    console.error('Erreur init user:', error)
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = createServerClient()

    const { data: user, error } = await supabase
      .from('users')
      .select('*, dashboards(*)')
      .eq('email', 'salah@promethia.app')
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      user
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    }, { status: 500 })
  }
}

