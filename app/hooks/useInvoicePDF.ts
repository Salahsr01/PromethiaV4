import { useState } from 'react'

interface InvoiceData {
  invoiceNumber: string
  date: string
  dueDate: string
  client: {
    name: string
    address?: string
    email?: string
    phone?: string
  }
  items: Array<{
    description: string
    quantity: number
    unitPrice: number
    total: number
  }>
  subtotal: number
  tax?: number
  taxRate?: number
  total: number
  notes?: string
  company?: {
    name: string
    address?: string
    logo?: string
  }
}

interface UseInvoicePDFReturn {
  generatePDF: (invoiceId?: string, invoiceData?: InvoiceData, method?: 'puppeteer' | 'simple') => Promise<void>
  downloadPDF: (invoiceId: string) => void
  loading: boolean
  error: string | null
}

/**
 * Hook React pour générer des PDFs de factures
 */
export function useInvoicePDF(): UseInvoicePDFReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generatePDF = async (
    invoiceId?: string,
    invoiceData?: InvoiceData,
    method: 'puppeteer' | 'simple' = 'puppeteer'
  ): Promise<void> => {
    if (!invoiceId && !invoiceData) {
      setError('invoiceId ou invoiceData requis')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/generate-invoice-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId,
          invoiceData,
          method
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la génération du PDF')
      }

      const data = await response.json()

      if (data.success && data.pdf) {
        // Créer un lien de téléchargement
        const blob = new Blob(
          [Uint8Array.from(atob(data.pdf), c => c.charCodeAt(0))],
          { type: 'application/pdf' }
        )
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = data.filename || 'facture.pdf'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      } else {
        throw new Error('Erreur lors de la génération du PDF')
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la génération du PDF')
    } finally {
      setLoading(false)
    }
  }

  const downloadPDF = (invoiceId: string): void => {
    const url = `/api/generate-invoice-pdf?id=${invoiceId}`
    window.open(url, '_blank')
  }

  return {
    generatePDF,
    downloadPDF,
    loading,
    error
  }
}

