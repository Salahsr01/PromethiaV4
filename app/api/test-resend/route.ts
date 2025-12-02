import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email requis' },
        { status: 400 }
      )
    }

    console.log('🔧 Test envoi email à:', email)
    console.log('🔑 Clé API présente:', !!process.env.RESEND_API_KEY)

    // Test simple sans template
    const { data, error } = await resend.emails.send({
      from: 'Promethia <noreply@v1.promethia-one.com>',
      to: [email],
      subject: 'Test Promethia - Email de test',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Test d'envoi d'email Promethia</h2>
          <p>Si vous recevez cet email, la configuration Resend fonctionne correctement !</p>
          <p>Timestamp: ${new Date().toISOString()}</p>
        </div>
      `,
    })

    if (error) {
      console.error('❌ Erreur Resend:', error)
      return NextResponse.json(
        {
          success: false,
          error: 'Erreur envoi email',
          details: error,
          message: error.message || 'Erreur inconnue'
        },
        { status: 500 }
      )
    }

    console.log('✅ Email envoyé:', data)
    return NextResponse.json({
      success: true,
      messageId: data?.id,
      message: `Email de test envoyé à ${email}`,
      data
    })

  } catch (error) {
    console.error('❌ Erreur API test-resend:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur serveur',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'API test-resend active',
    apiKeyConfigured: !!process.env.RESEND_API_KEY,
    note: 'Utilisez POST avec { "email": "votre@email.com" } pour tester'
  })
}
