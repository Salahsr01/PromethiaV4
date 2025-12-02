-- =============================================
-- PROMETHIA - Schema Supabase
-- =============================================

-- Extension pour générer des UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABLES
-- =============================================

-- Table des utilisateurs (extension de auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
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
  owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
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
  invited_by UUID NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(dashboard_id, user_id)
);

-- Table des conversations
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL DEFAULT 'Nouvelle conversation',
  owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
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

-- Table des participants aux conversations (pour le mode collaboration)
CREATE TABLE IF NOT EXISTS public.conversation_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  is_online BOOLEAN DEFAULT FALSE,
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(conversation_id, user_id)
);

-- =============================================
-- INDEX pour les performances
-- =============================================

CREATE INDEX IF NOT EXISTS idx_dashboards_owner ON public.dashboards(owner_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_collaborators_dashboard ON public.dashboard_collaborators(dashboard_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_collaborators_user ON public.dashboard_collaborators(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_owner ON public.conversations(owner_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON public.messages(created_at);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation ON public.conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user ON public.conversation_participants(user_id);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Activer RLS sur toutes les tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboard_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;

-- Policies pour users
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Policies pour dashboards
CREATE POLICY "Users can view their own dashboards" ON public.dashboards
  FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "Users can view dashboards they collaborate on" ON public.dashboards
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.dashboard_collaborators
      WHERE dashboard_id = dashboards.id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create dashboards" ON public.dashboards
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update their own dashboards" ON public.dashboards
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Editors can update dashboards" ON public.dashboards
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.dashboard_collaborators
      WHERE dashboard_id = dashboards.id 
        AND user_id = auth.uid() 
        AND role IN ('editor', 'admin')
    )
  );

CREATE POLICY "Users can delete their own dashboards" ON public.dashboards
  FOR DELETE USING (owner_id = auth.uid());

-- Policies pour conversations
CREATE POLICY "Users can view their own conversations" ON public.conversations
  FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "Participants can view collaborative conversations" ON public.conversations
  FOR SELECT USING (
    is_collaborative AND EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_id = conversations.id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create conversations" ON public.conversations
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update their own conversations" ON public.conversations
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Users can delete their own conversations" ON public.conversations
  FOR DELETE USING (owner_id = auth.uid());

-- Policies pour messages
CREATE POLICY "Users can view messages in their conversations" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE id = messages.conversation_id 
        AND (owner_id = auth.uid() OR is_collaborative)
    )
  );

CREATE POLICY "Users can create messages in their conversations" ON public.messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE id = messages.conversation_id 
        AND (owner_id = auth.uid() OR is_collaborative)
    )
  );

-- =============================================
-- FUNCTIONS & TRIGGERS
-- =============================================

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dashboards_updated_at
  BEFORE UPDATE ON public.dashboards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour créer automatiquement un profil utilisateur après inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour créer le profil utilisateur
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- TABLES BANCAIRES
-- =============================================

-- Table des comptes bancaires connectés
CREATE TABLE IF NOT EXISTS public.bank_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  plaid_item_id TEXT,
  plaid_access_token TEXT NOT NULL, -- En production, chiffrer ce champ
  plaid_account_id TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  account_name TEXT NOT NULL,
  account_type TEXT NOT NULL CHECK (account_type IN ('checking', 'savings', 'credit', 'loan')),
  balance DECIMAL(15, 2) DEFAULT 0,
  currency TEXT DEFAULT 'EUR',
  last_sync TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, plaid_account_id)
);

-- Table des transactions bancaires
CREATE TABLE IF NOT EXISTS public.bank_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL, -- plaid_account_id
  plaid_transaction_id TEXT UNIQUE,
  amount DECIMAL(15, 2) NOT NULL,
  date DATE NOT NULL,
  description TEXT NOT NULL,
  category TEXT,
  merchant TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABLES FACTURES
-- =============================================

-- Table des factures
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL UNIQUE,
  date DATE NOT NULL,
  due_date DATE NOT NULL,
  client_name TEXT NOT NULL,
  client_address TEXT,
  client_email TEXT,
  client_phone TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal DECIMAL(15, 2) NOT NULL,
  tax DECIMAL(15, 2) DEFAULT 0,
  tax_rate DECIMAL(5, 2) DEFAULT 0,
  total DECIMAL(15, 2) NOT NULL,
  notes TEXT,
  company JSONB,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'cancelled')),
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABLES MCP SERVERS
-- =============================================

-- Table des serveurs MCP configurés
CREATE TABLE IF NOT EXISTS public.mcp_servers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('http', 'stdio', 'sse')),
  enabled BOOLEAN DEFAULT TRUE,
  config JSONB DEFAULT '{}'::jsonb,
  capabilities TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INDEX pour les nouvelles tables
-- =============================================

CREATE INDEX IF NOT EXISTS idx_bank_accounts_user ON public.bank_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_user ON public.bank_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_account ON public.bank_transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_date ON public.bank_transactions(date);
CREATE INDEX IF NOT EXISTS idx_invoices_user ON public.invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON public.invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_mcp_servers_user ON public.mcp_servers(user_id);

-- =============================================
-- RLS pour les nouvelles tables
-- =============================================

ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mcp_servers ENABLE ROW LEVEL SECURITY;

-- Policies pour bank_accounts
CREATE POLICY "Users can view their own bank accounts" ON public.bank_accounts
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own bank accounts" ON public.bank_accounts
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own bank accounts" ON public.bank_accounts
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own bank accounts" ON public.bank_accounts
  FOR DELETE USING (user_id = auth.uid());

-- Policies pour bank_transactions
CREATE POLICY "Users can view their own transactions" ON public.bank_transactions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own transactions" ON public.bank_transactions
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Policies pour invoices
CREATE POLICY "Users can view their own invoices" ON public.invoices
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own invoices" ON public.invoices
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own invoices" ON public.invoices
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own invoices" ON public.invoices
  FOR DELETE USING (user_id = auth.uid());

-- Policies pour mcp_servers
CREATE POLICY "Users can view their own MCP servers" ON public.mcp_servers
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own MCP servers" ON public.mcp_servers
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own MCP servers" ON public.mcp_servers
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own MCP servers" ON public.mcp_servers
  FOR DELETE USING (user_id = auth.uid());

-- Triggers pour updated_at
CREATE TRIGGER update_bank_accounts_updated_at
  BEFORE UPDATE ON public.bank_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mcp_servers_updated_at
  BEFORE UPDATE ON public.mcp_servers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- REALTIME
-- =============================================

-- Activer le realtime pour la collaboration
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.dashboard_collaborators;

