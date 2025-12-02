import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'

/**
 * API Route pour les connexions bancaires
 * Supporte Plaid (recommandé) et autres providers bancaires
 */

interface BankAccount {
  id: string
  bankName: string
  accountName: string
  accountType: 'checking' | 'savings' | 'credit' | 'loan'
  balance?: number
  currency: string
  lastSync?: string
}

interface BankTransaction {
  id: string
  accountId: string
  amount: number
  date: string
  description: string
  category?: string
  merchant?: string
}

/**
 * Créer un lien Plaid (Link Token)
 * Pour connecter un compte bancaire
 */
export async function POST(request: NextRequest) {
  try {
    const { action, ...data } = await request.json()

    switch (action) {
      case 'create_link_token':
        return createPlaidLinkToken(data.userId)
      case 'exchange_public_token':
        return exchangePlaidPublicToken(data.publicToken, data.userId)
      case 'get_accounts':
        return getBankAccounts(data.userId)
      case 'get_transactions':
        return getBankTransactions(data.userId, data.accountId, data.startDate, data.endDate)
      case 'sync_accounts':
        return syncBankAccounts(data.userId)
      case 'disconnect_account':
        return disconnectBankAccount(data.accountId, data.userId)
      default:
        return NextResponse.json(
          { success: false, error: 'Action non reconnue' },
          { status: 400 }
        )
    }
  } catch (error: any) {
    console.error('Erreur Banking API:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Erreur lors de l\'opération bancaire' },
      { status: 500 }
    )
  }
}

/**
 * Créer un Link Token Plaid pour initialiser la connexion
 */
async function createPlaidLinkToken(userId: string) {
  const PLAID_CLIENT_ID = process.env.PLAID_CLIENT_ID
  const PLAID_SECRET = process.env.PLAID_SECRET
  const PLAID_ENV = process.env.PLAID_ENV || 'sandbox'

  if (!PLAID_CLIENT_ID || !PLAID_SECRET) {
    return NextResponse.json(
      {
        success: false,
        error: 'Plaid n\'est pas configuré. Veuillez ajouter PLAID_CLIENT_ID et PLAID_SECRET dans vos variables d\'environnement.'
      },
      { status: 500 }
    )
  }

  try {
    const plaidUrl = PLAID_ENV === 'production'
      ? 'https://production.plaid.com'
      : 'https://sandbox.plaid.com'

    const response = await fetch(`${plaidUrl}/link/token/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'PLAID-CLIENT-ID': PLAID_CLIENT_ID,
        'PLAID-SECRET': PLAID_SECRET
      },
      body: JSON.stringify({
        client_name: 'Promethia',
        products: ['transactions', 'auth'],
        country_codes: ['FR', 'US', 'CA'],
        language: 'fr',
        user: {
          client_user_id: userId
        },
        webhook: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/banking/webhook`
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Plaid API error: ${JSON.stringify(error)}`)
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      linkToken: data.link_token,
      expiration: data.expiration
    })
  } catch (error: any) {
    throw new Error(`Erreur création Link Token: ${error.message}`)
  }
}

/**
 * Échanger le public token contre un access token permanent
 */
async function exchangePlaidPublicToken(publicToken: string, userId: string) {
  const PLAID_CLIENT_ID = process.env.PLAID_CLIENT_ID
  const PLAID_SECRET = process.env.PLAID_SECRET
  const PLAID_ENV = process.env.PLAID_ENV || 'sandbox'

  if (!PLAID_CLIENT_ID || !PLAID_SECRET) {
    throw new Error('Plaid n\'est pas configuré')
  }

  const plaidUrl = PLAID_ENV === 'production'
    ? 'https://production.plaid.com'
    : 'https://sandbox.plaid.com'

  try {
    // Échanger le public token
    const exchangeResponse = await fetch(`${plaidUrl}/item/public_token/exchange`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'PLAID-CLIENT-ID': PLAID_CLIENT_ID,
        'PLAID-SECRET': PLAID_SECRET
      },
      body: JSON.stringify({
        public_token: publicToken
      })
    })

    if (!exchangeResponse.ok) {
      const error = await exchangeResponse.json()
      throw new Error(`Plaid exchange error: ${JSON.stringify(error)}`)
    }

    const exchangeData = await exchangeResponse.json()
    const accessToken = exchangeData.access_token
    const itemId = exchangeData.item_id

    // Récupérer les comptes
    const accountsResponse = await fetch(`${plaidUrl}/accounts/get`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'PLAID-CLIENT-ID': PLAID_CLIENT_ID,
        'PLAID-SECRET': PLAID_SECRET
      },
      body: JSON.stringify({
        access_token: accessToken
      })
    })

    if (!accountsResponse.ok) {
      throw new Error('Erreur lors de la récupération des comptes')
    }

    const accountsData = await accountsResponse.json()

    // Sauvegarder dans Supabase
    for (const account of accountsData.accounts) {
      await supabase.from('bank_accounts').upsert({
        user_id: userId,
        plaid_item_id: itemId,
        plaid_access_token: accessToken, // En production, chiffrer ce token
        plaid_account_id: account.account_id,
        bank_name: account.name || 'Banque inconnue',
        account_name: account.name,
        account_type: account.type,
        balance: account.balances?.current || 0,
        currency: account.balances?.iso_currency_code || 'EUR',
        last_sync: new Date().toISOString()
      } as any)
    }

    return NextResponse.json({
      success: true,
      message: `${accountsData.accounts.length} compte(s) bancaire(s) connecté(s)`,
      accounts: accountsData.accounts.map((acc: any) => ({
        id: acc.account_id,
        name: acc.name,
        type: acc.type,
        balance: acc.balances?.current || 0
      }))
    })
  } catch (error: any) {
    throw new Error(`Erreur échange token: ${error.message}`)
  }
}

/**
 * Récupérer les comptes bancaires de l'utilisateur
 */
async function getBankAccounts(userId: string) {
  const { data, error } = await supabase
    .from('bank_accounts')
    .select('*')
    .eq('user_id', userId)
    .order('last_sync', { ascending: false })

  if (error) {
    throw new Error(`Erreur Supabase: ${error.message}`)
  }

  return NextResponse.json({
    success: true,
    accounts: data || []
  })
}

/**
 * Récupérer les transactions bancaires
 */
async function getBankTransactions(
  userId: string,
  accountId?: string,
  startDate?: string,
  endDate?: string
) {
  let query = supabase
    .from('bank_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(100)

  if (accountId) {
    query = query.eq('account_id', accountId)
  }

  if (startDate) {
    query = query.gte('date', startDate)
  }

  if (endDate) {
    query = query.lte('date', endDate)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Erreur Supabase: ${error.message}`)
  }

  return NextResponse.json({
    success: true,
    transactions: data || [],
    count: data?.length || 0
  })
}

/**
 * Synchroniser les comptes bancaires avec Plaid
 */
async function syncBankAccounts(userId: string) {
  const { data: accounts, error } = await supabase
    .from('bank_accounts')
    .select('*')
    .eq('user_id', userId)

  if (error || !accounts) {
    throw new Error('Erreur lors de la récupération des comptes')
  }

  const PLAID_CLIENT_ID = process.env.PLAID_CLIENT_ID
  const PLAID_SECRET = process.env.PLAID_SECRET
  const PLAID_ENV = process.env.PLAID_ENV || 'sandbox'

  if (!PLAID_CLIENT_ID || !PLAID_SECRET) {
    throw new Error('Plaid n\'est pas configuré')
  }

  const plaidUrl = PLAID_ENV === 'production'
    ? 'https://production.plaid.com'
    : 'https://sandbox.plaid.com'

  let syncedCount = 0

  for (const account of accounts) {
    try {
      // Récupérer les transactions récentes (30 derniers jours)
      const endDate = new Date().toISOString().split('T')[0]
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      const response = await fetch(`${plaidUrl}/transactions/get`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'PLAID-CLIENT-ID': PLAID_CLIENT_ID,
          'PLAID-SECRET': PLAID_SECRET
        },
        body: JSON.stringify({
          access_token: (account as any).plaid_access_token,
          start_date: startDate,
          end_date: endDate
        })
      })

      if (!response.ok) continue

      const transactionsData = await response.json()

      // Sauvegarder les transactions
      for (const transaction of transactionsData.transactions || []) {
        await supabase.from('bank_transactions').upsert({
          user_id: userId,
          account_id: (account as any).plaid_account_id,
          plaid_transaction_id: transaction.transaction_id,
          amount: transaction.amount,
          date: transaction.date,
          description: transaction.name,
          category: transaction.category?.[0] || 'Autre',
          merchant: transaction.merchant_name || null
        } as any)
      }

      // Mettre à jour le dernier sync
      const updatePayload: any = { last_sync: new Date().toISOString() }
      await (supabase as any)
        .from('bank_accounts')
        .update(updatePayload)
        .eq('id', (account as any).id)

      syncedCount++
    } catch (error) {
      console.error(`Erreur sync compte ${(account as any).id}:`, error)
    }
  }

  return NextResponse.json({
    success: true,
    message: `${syncedCount} compte(s) synchronisé(s)`,
    syncedCount
  })
}

/**
 * Déconnecter un compte bancaire
 */
async function disconnectBankAccount(accountId: string, userId: string) {
  const { error } = await supabase
    .from('bank_accounts')
    .delete()
    .eq('id', accountId)
    .eq('user_id', userId)

  if (error) {
    throw new Error(`Erreur déconnexion: ${error.message}`)
  }

  return NextResponse.json({
    success: true,
    message: 'Compte bancaire déconnecté'
  })
}

/**
 * Webhook Plaid pour les notifications
 */
export async function PUT(request: NextRequest) {
  // Webhook handler pour Plaid
  const webhook = await request.json()
  
  // Traiter les webhooks Plaid (transactions, erreurs, etc.)
  console.log('Plaid webhook:', webhook)

  return NextResponse.json({ success: true })
}

