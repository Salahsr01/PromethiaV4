import { NextResponse } from 'next/server'
import { supabase } from '../../lib/supabase'

export async function GET() {
  try {
    // Test de connexion simple
    const { data, error } = await supabase
      .from('dashboards')
      .select('count')
      .limit(1)

    if (error) {
      // Si l'erreur est "relation does not exist", les tables n'ont pas été créées
      if (error.message.includes('does not exist')) {
        return NextResponse.json({
          success: false,
          message: 'Connexion Supabase OK, mais les tables n\'ont pas encore été créées. Exécute le script SQL.',
          error: error.message
        })
      }
      throw error
    }

    return NextResponse.json({
      success: true,
      message: 'Connexion Supabase établie avec succès !',
      data
    })

  } catch (error) {
    console.error('Erreur test Supabase:', error)
    return NextResponse.json({
      success: false,
      message: 'Erreur de connexion à Supabase',
      error: (error as Error).message
    }, { status: 500 })
  }
}

