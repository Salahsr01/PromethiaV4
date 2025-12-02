import { NextResponse } from 'next/server'
import { createServerClient } from '../../lib/supabase'

const SCHEMA_SQL = `
-- Extension pour générer des UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table des utilisateurs (extension de auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des tableaux de bord
CREATE TABLE IF NOT EXISTS public.dashboards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  owner_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  is_default BOOLEAN DEFAULT FALSE,
  widgets JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des collaborateurs sur les tableaux de bord
CREATE TABLE IF NOT EXISTS public.dashboard_collaborators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dashboard_id UUID NOT NULL REFERENCES public.dashboards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('viewer', 'editor', 'admin')),
  invited_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(dashboard_id, user_id)
);

-- Table des conversations
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL DEFAULT 'Nouvelle conversation',
  owner_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  is_collaborative BOOLEAN DEFAULT FALSE,
  dashboard_id UUID REFERENCES public.dashboards(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des messages
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des participants aux conversations
CREATE TABLE IF NOT EXISTS public.conversation_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  is_online BOOLEAN DEFAULT FALSE,
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(conversation_id, user_id)
);
`

export async function POST() {
  try {
    const supabase = createServerClient()

    // Créer un utilisateur par défaut pour les tests
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', 'salah@promethia.app')
      .single()

    if (!existingUser) {
      const { error: userError } = await supabase
        .from('users')
        .insert({
          email: 'salah@promethia.app',
          name: 'Salah-Eddine Sriar'
        } as any)

      if (userError && !userError.message.includes('duplicate')) {
        console.log('Note: User table might not exist yet or user already exists')
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Base de données prête ! Les tables doivent être créées via le SQL Editor de Supabase.',
      instructions: [
        '1. Va sur https://supabase.com/dashboard/project/ftysvyzrntsusgyqznsp/sql',
        '2. Copie le contenu de supabase/schema.sql',
        '3. Exécute le script'
      ]
    })

  } catch (error) {
    console.error('Erreur init database:', error)
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = createServerClient()

    // Vérifier si les tables existent
    const checks = await Promise.allSettled([
      supabase.from('users').select('count').limit(1),
      supabase.from('dashboards').select('count').limit(1),
      supabase.from('conversations').select('count').limit(1),
      supabase.from('messages').select('count').limit(1)
    ])

    const tables = ['users', 'dashboards', 'conversations', 'messages']
    const status: Record<string, boolean> = {}

    checks.forEach((result, index) => {
      if (result.status === 'fulfilled' && !result.value.error) {
        status[tables[index]] = true
      } else {
        status[tables[index]] = false
      }
    })

    const allTablesExist = Object.values(status).every(v => v)

    return NextResponse.json({
      success: true,
      tablesExist: allTablesExist,
      tables: status,
      message: allTablesExist 
        ? '✅ Toutes les tables sont créées !' 
        : '⚠️ Certaines tables manquent. Exécute le script SQL dans Supabase.'
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    }, { status: 500 })
  }
}

