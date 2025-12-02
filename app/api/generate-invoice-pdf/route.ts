import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'

/**
 * API Route pour générer des PDFs de factures
 * Utilise jsPDF côté serveur ou Puppeteer pour un rendu avancé
 */

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

/**
 * Générer un PDF de facture simple avec jsPDF
 * Pour un rendu plus avancé, utiliser Puppeteer
 */
function generateInvoicePDF(invoice: InvoiceData): Buffer {
  // Note: En production, utiliser une bibliothèque comme:
  // - jsPDF avec html2canvas
  // - Puppeteer pour un rendu HTML vers PDF
  // - pdfkit pour un contrôle fin
  
  // Pour l'instant, retourner un PDF basique en base64
  // L'implémentation complète nécessiterait l'installation de dépendances
  
  const pdfContent = `
%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 5 0 R
>>
>>
>>
endobj
4 0 obj
<<
/Length 200
>>
stream
BT
/F1 12 Tf
100 700 Td
(FACTURE ${invoice.invoiceNumber}) Tj
0 -20 Td
(Date: ${invoice.date}) Tj
0 -20 Td
(Client: ${invoice.client.name}) Tj
ET
endstream
endobj
5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj
xref
0 6
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000306 00000 n
0000000444 00000 n
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
550
%%EOF
`

  return Buffer.from(pdfContent)
}

/**
 * Générer un PDF de facture avec Puppeteer (recommandé pour un rendu HTML)
 */
async function generateInvoicePDFWithPuppeteer(invoice: InvoiceData): Promise<Buffer> {
  // Cette fonction nécessite Puppeteer installé
  // Pour l'instant, retourner une erreur si non disponible
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      padding: 40px;
      color: #333;
    }
    .header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 40px;
    }
    .company-info {
      text-align: right;
    }
    .invoice-title {
      font-size: 32px;
      font-weight: bold;
      margin-bottom: 10px;
    }
    .invoice-number {
      font-size: 14px;
      color: #666;
    }
    .client-info {
      margin-bottom: 30px;
    }
    .client-info h3 {
      margin-bottom: 10px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    th {
      background-color: #f5f5f5;
      padding: 12px;
      text-align: left;
      border-bottom: 2px solid #ddd;
    }
    td {
      padding: 12px;
      border-bottom: 1px solid #eee;
    }
    .text-right {
      text-align: right;
    }
    .total-row {
      font-weight: bold;
      font-size: 18px;
    }
    .notes {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="invoice-title">FACTURE</div>
      <div class="invoice-number">N° ${invoice.invoiceNumber}</div>
    </div>
    <div class="company-info">
      <div><strong>${invoice.company?.name || 'Promethia'}</strong></div>
      ${invoice.company?.address ? `<div>${invoice.company.address}</div>` : ''}
    </div>
  </div>

  <div class="client-info">
    <h3>Facturé à:</h3>
    <div><strong>${invoice.client.name}</strong></div>
    ${invoice.client.address ? `<div>${invoice.client.address}</div>` : ''}
    ${invoice.client.email ? `<div>${invoice.client.email}</div>` : ''}
    ${invoice.client.phone ? `<div>${invoice.client.phone}</div>` : ''}
  </div>

  <div style="margin-bottom: 20px;">
    <div><strong>Date d'émission:</strong> ${invoice.date}</div>
    <div><strong>Date d'échéance:</strong> ${invoice.dueDate}</div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th class="text-right">Quantité</th>
        <th class="text-right">Prix unitaire</th>
        <th class="text-right">Total</th>
      </tr>
    </thead>
    <tbody>
      ${invoice.items.map(item => `
        <tr>
          <td>${item.description}</td>
          <td class="text-right">${item.quantity}</td>
          <td class="text-right">${item.unitPrice.toFixed(2)} €</td>
          <td class="text-right">${item.total.toFixed(2)} €</td>
        </tr>
      `).join('')}
    </tbody>
    <tfoot>
      <tr>
        <td colspan="3" class="text-right"><strong>Sous-total:</strong></td>
        <td class="text-right">${invoice.subtotal.toFixed(2)} €</td>
      </tr>
      ${invoice.tax ? `
        <tr>
          <td colspan="3" class="text-right"><strong>TVA (${invoice.taxRate || 20}%):</strong></td>
          <td class="text-right">${invoice.tax.toFixed(2)} €</td>
        </tr>
      ` : ''}
      <tr class="total-row">
        <td colspan="3" class="text-right"><strong>Total:</strong></td>
        <td class="text-right">${invoice.total.toFixed(2)} €</td>
      </tr>
    </tfoot>
  </table>

  ${invoice.notes ? `
    <div class="notes">
      <strong>Notes:</strong>
      <div>${invoice.notes}</div>
    </div>
  ` : ''}
</body>
</html>
`

  // En production avec Puppeteer installé:
  /*
  const puppeteer = require('puppeteer')
  const browser = await puppeteer.launch({ headless: true })
  const page = await browser.newPage()
  await page.setContent(html, { waitUntil: 'networkidle0' })
  const pdf = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' }
  })
  await browser.close()
  return pdf
  */

  // Pour l'instant, retourner un message d'erreur
  throw new Error('Puppeteer n\'est pas installé. Installez-le avec: npm install puppeteer')
}

export async function POST(request: NextRequest) {
  try {
    const { invoiceId, invoiceData, method = 'html' } = await request.json()

    let invoice: InvoiceData

    // Si un ID est fourni, récupérer depuis la base de données
    if (invoiceId) {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', invoiceId)
        .single()

      if (error || !data) {
        return NextResponse.json(
          { success: false, error: 'Facture non trouvée' },
          { status: 404 }
        )
      }

      const invoiceData = data as any
      invoice = {
        invoiceNumber: invoiceData.invoice_number,
        date: invoiceData.date,
        dueDate: invoiceData.due_date,
        client: {
          name: invoiceData.client_name,
          address: invoiceData.client_address,
          email: invoiceData.client_email,
          phone: invoiceData.client_phone
        },
        items: invoiceData.items || [],
        subtotal: invoiceData.subtotal,
        tax: invoiceData.tax,
        taxRate: invoiceData.tax_rate,
        total: invoiceData.total,
        notes: invoiceData.notes,
        company: invoiceData.company || {
          name: 'Promethia'
        }
      }
    } else if (invoiceData) {
      invoice = invoiceData
    } else {
      return NextResponse.json(
        { success: false, error: 'invoiceId ou invoiceData requis' },
        { status: 400 }
      )
    }

    let pdfBuffer: Buffer

    try {
      if (method === 'puppeteer') {
        pdfBuffer = await generateInvoicePDFWithPuppeteer(invoice)
      } else {
        // Méthode simple (basique)
        pdfBuffer = generateInvoicePDF(invoice)
      }
    } catch (error: any) {
      // Si Puppeteer n'est pas disponible, utiliser la méthode simple
      console.warn('Méthode avancée non disponible, utilisation de la méthode simple:', error.message)
      pdfBuffer = generateInvoicePDF(invoice)
    }

    // Retourner le PDF en base64
    const pdfBase64 = pdfBuffer.toString('base64')

    return NextResponse.json({
      success: true,
      pdf: pdfBase64,
      filename: `facture-${invoice.invoiceNumber}.pdf`,
      mimeType: 'application/pdf'
    })
  } catch (error: any) {
    console.error('Erreur génération PDF:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erreur lors de la génération du PDF'
      },
      { status: 500 }
    )
  }
}

/**
 * Télécharger directement le PDF
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const invoiceId = searchParams.get('id')

  if (!invoiceId) {
    return NextResponse.json(
      { success: false, error: 'Paramètre "id" requis' },
      { status: 400 }
    )
  }

  const mockRequest = {
    json: async () => ({ invoiceId })
  } as NextRequest

  const response = await POST(mockRequest)
  const data = await response.json()

  if (!data.success) {
    return response
  }

  // Retourner le PDF directement
  const pdfBuffer = Buffer.from(data.pdf, 'base64')

  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${data.filename}"`
    }
  })
}

