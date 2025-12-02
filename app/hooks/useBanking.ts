import { useState } from 'react'

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

interface UseBankingReturn {
  // Plaid Link
  createLinkToken: (userId: string) => Promise<string | null>
  
  // Comptes
  getAccounts: (userId: string) => Promise<BankAccount[]>
  syncAccounts: (userId: string) => Promise<void>
  disconnectAccount: (accountId: string, userId: string) => Promise<void>
  
  // Transactions
  getTransactions: (
    userId: string,
    accountId?: string,
    startDate?: string,
    endDate?: string
  ) => Promise<BankTransaction[]>
  
  // State
  accounts: BankAccount[]
  transactions: BankTransaction[]
  loading: boolean
  error: string | null
}

/**
 * Hook React pour gérer les connexions bancaires
 */
export function useBanking(): UseBankingReturn {
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [transactions, setTransactions] = useState<BankTransaction[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createLinkToken = async (userId: string): Promise<string | null> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/banking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_link_token',
          userId
        })
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la création du Link Token')
      }

      const data = await response.json()
      return data.linkToken || null
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création du Link Token')
      return null
    } finally {
      setLoading(false)
    }
  }

  const getAccounts = async (userId: string): Promise<BankAccount[]> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/banking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_accounts',
          userId
        })
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des comptes')
      }

      const data = await response.json()
      setAccounts(data.accounts || [])
      return data.accounts || []
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la récupération des comptes')
      return []
    } finally {
      setLoading(false)
    }
  }

  const syncAccounts = async (userId: string): Promise<void> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/banking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'sync_accounts',
          userId
        })
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la synchronisation')
      }

      // Recharger les comptes après synchronisation
      await getAccounts(userId)
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la synchronisation')
    } finally {
      setLoading(false)
    }
  }

  const disconnectAccount = async (accountId: string, userId: string): Promise<void> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/banking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'disconnect_account',
          accountId,
          userId
        })
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la déconnexion')
      }

      // Retirer le compte de la liste
      setAccounts(prev => prev.filter(acc => acc.id !== accountId))
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la déconnexion')
    } finally {
      setLoading(false)
    }
  }

  const getTransactions = async (
    userId: string,
    accountId?: string,
    startDate?: string,
    endDate?: string
  ): Promise<BankTransaction[]> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/banking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_transactions',
          userId,
          accountId,
          startDate,
          endDate
        })
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des transactions')
      }

      const data = await response.json()
      setTransactions(data.transactions || [])
      return data.transactions || []
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la récupération des transactions')
      return []
    } finally {
      setLoading(false)
    }
  }

  return {
    createLinkToken,
    getAccounts,
    syncAccounts,
    disconnectAccount,
    getTransactions,
    accounts,
    transactions,
    loading,
    error
  }
}

