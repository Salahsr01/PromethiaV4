import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import CollaborationInviteEmail from '../../emails/CollaborationInvite'

// Clé API Resend - à configurer dans .env.local
const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      email, 
      inviterName, 
      inviteCode, 
      joinLink,
      conversationTitle 
    } = body

    // Validation
    if (!email || !inviterName || !inviteCode || !joinLink) {
      return NextResponse.json(
        { error: 'Paramètres manquants' },
        { status: 400 }
      )
    }

    // Vérifier que la clé API est configurée
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY non configurée')
      return NextResponse.json(
        { error: 'Service email non configuré' },
        { status: 500 }
      )
    }

    // Envoyer l'email
    const { data, error } = await resend.emails.send({
      from: 'Promethia <noreply@v1.promethia-one.com>',
      to: [email],
      subject: `${inviterName} vous invite à collaborer sur Promethia`,
      react: CollaborationInviteEmail({
        inviterName,
        inviteCode,
        joinLink,
        conversationTitle: conversationTitle || 'une session collaborative'
      }),
    })

    if (error) {
      console.error('❌ Erreur Resend:', error)

      // Message d'erreur spécifique pour l'adresse de test
      let errorMessage = error.message || 'Erreur envoi email'

      if (errorMessage.includes('onboarding@resend.dev') || errorMessage.includes('domain')) {
        errorMessage = `L'email ne peut pas être envoyé avec l'adresse de test Resend.

Solutions :
1. Dans votre dashboard Resend (resend.com/emails), ajoutez "${email}" comme adresse de test
2. Ou configurez votre propre domaine vérifié dans Resend`
      }

      return NextResponse.json(
        {
          error: 'Erreur envoi email',
          details: errorMessage,
          rawError: error
        },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      messageId: data?.id,
      message: `Invitation envoyée à ${email}`
    })

  } catch (error) {
    console.error('Erreur API send-invite:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

