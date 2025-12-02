import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import * as React from 'react'

interface CollaborationInviteEmailProps {
  inviterName: string
  inviteCode: string
  joinLink: string
  conversationTitle?: string
}

export default function CollaborationInviteEmail({
  inviterName = 'Un partenaire',
  inviteCode = 'ABC123',
  joinLink = 'https://promethia.app?join=ABC123',
  conversationTitle = 'une conversation'
}: CollaborationInviteEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{inviterName} vous invite à collaborer sur Promethia</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header avec logo */}
          <Section style={header}>
            <div style={logoContainer}>
              <div style={logoIcon}>✦</div>
              <Text style={logoText}>Promethia</Text>
            </div>
          </Section>

          {/* Contenu principal */}
          <Section style={content}>
            <Heading style={heading}>
              Invitation à collaborer
            </Heading>
            
            <Text style={paragraph}>
              <strong style={highlightName}>{inviterName}</strong> vous invite à rejoindre {conversationTitle} sur Promethia.
            </Text>

            <Text style={paragraph}>
              Travaillez ensemble en temps réel, partagez vos idées et bénéficiez de l&apos;assistance de notre IA pour atteindre vos objectifs.
            </Text>

            {/* Code d'invitation */}
            <Section style={codeSection}>
              <Text style={codeLabel}>Votre code d&apos;invitation</Text>
              <Text style={codeValue}>{inviteCode}</Text>
            </Section>

            {/* Bouton principal */}
            <Section style={buttonSection}>
              <Button style={button} href={joinLink}>
                Rejoindre la session
              </Button>
            </Section>

            <Text style={smallText}>
              Ou copiez ce lien dans votre navigateur :
            </Text>
            <Link href={joinLink} style={linkStyle}>
              {joinLink}
            </Link>
          </Section>

          <Hr style={hr} />

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Ce lien expire dans 24 heures. Si vous n&apos;avez pas demandé cette invitation, vous pouvez ignorer cet email.
            </Text>
            <Text style={footerText}>
              © 2024 Promethia - Assistant IA Professionnel
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

// Styles
const main = {
  backgroundColor: '#0f0f0f',
  fontFamily: "'Helvetica Neue', 'Arial', sans-serif",
  padding: '40px 0',
}

const container = {
  backgroundColor: '#1a1a1a',
  margin: '0 auto',
  maxWidth: '560px',
  borderRadius: '0px',
}

const header = {
  backgroundColor: '#1438BB',
  padding: '24px 40px',
}

const logoContainer = {
  display: 'flex' as const,
  alignItems: 'center' as const,
  gap: '12px',
}

const logoIcon = {
  fontSize: '24px',
  color: '#ffffff',
}

const logoText = {
  color: '#ffffff',
  fontSize: '20px',
  fontWeight: '300' as const,
  margin: '0',
  letterSpacing: '1px',
}

const content = {
  padding: '40px',
}

const heading = {
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: '300' as const,
  margin: '0 0 24px 0',
  letterSpacing: '-0.5px',
}

const paragraph = {
  color: '#a0a0a0',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '0 0 20px 0',
}

const highlightName = {
  color: '#ffffff',
}

const codeSection = {
  backgroundColor: '#0f0f0f',
  padding: '24px',
  margin: '32px 0',
  textAlign: 'center' as const,
  border: '1px solid #333',
}

const codeLabel = {
  color: '#666',
  fontSize: '12px',
  textTransform: 'uppercase' as const,
  letterSpacing: '2px',
  margin: '0 0 12px 0',
}

const codeValue = {
  color: '#ffffff',
  fontSize: '36px',
  fontWeight: '600' as const,
  letterSpacing: '8px',
  fontFamily: 'monospace',
  margin: '0',
}

const buttonSection = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const button = {
  backgroundColor: '#1438BB',
  color: '#ffffff',
  padding: '16px 40px',
  fontSize: '14px',
  fontWeight: '500' as const,
  textDecoration: 'none',
  display: 'inline-block',
  letterSpacing: '0.5px',
}

const smallText = {
  color: '#666',
  fontSize: '13px',
  margin: '0 0 8px 0',
  textAlign: 'center' as const,
}

const linkStyle = {
  color: '#1438BB',
  fontSize: '13px',
  textDecoration: 'none',
  display: 'block',
  textAlign: 'center' as const,
  wordBreak: 'break-all' as const,
}

const hr = {
  borderColor: '#333',
  margin: '0',
}

const footer = {
  padding: '24px 40px',
}

const footerText = {
  color: '#666',
  fontSize: '12px',
  lineHeight: '20px',
  margin: '0 0 8px 0',
  textAlign: 'center' as const,
}

