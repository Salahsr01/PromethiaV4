import type { Metadata, Viewport } from 'next'
import './globals.css'
import { DashboardsListProvider } from './contexts/DashboardsListContext'
import { CollaborationProvider } from './contexts/CollaborationContext'

export const metadata: Metadata = {
  title: 'Promethia',
  description: 'Assistant IA professionnel pour la gestion de projet et l\'analyse de données',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Promethia'
  },
  formatDetection: {
    telephone: false
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: 'https://promethia.app',
    siteName: 'Promethia',
    title: 'Promethia - Assistant IA Professionnel',
    description: 'Assistant IA professionnel pour la gestion de projet et l\'analyse de données',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Promethia'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Promethia',
    description: 'Assistant IA professionnel',
    images: ['/og-image.png']
  },
  icons: {
    icon: [
      { url: '/icons/icon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-16x16.png', sizes: '16x16', type: 'image/png' }
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }
    ]
  }
}

export const viewport: Viewport = {
  themeColor: '#1438BB',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://api.anthropic.com" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="antialiased">
        <CollaborationProvider>
          <DashboardsListProvider>
            {children}
          </DashboardsListProvider>
        </CollaborationProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  // Toujours désactiver les service workers existants d'abord
                  navigator.serviceWorker.getRegistrations().then(function(registrations) {
                    for(let registration of registrations) {
                      registration.unregister();
                    }
                    
                    // Enregistrer seulement si on n'est pas en localhost (production)
                    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
                      navigator.serviceWorker.register('/sw.js').then(
                        function(registration) {
                          console.log('ServiceWorker registration successful');
                        },
                        function(err) {
                          console.log('ServiceWorker registration failed: ', err);
                        }
                      );
                    } else {
                      console.log('ServiceWorker désactivé en développement');
                    }
                  });
                });
              }
            `
          }}
        />
      </body>
    </html>
  )
}
