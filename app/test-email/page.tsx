'use client'

import { useState } from 'react'
import { Send, CheckCircle, XCircle, Loader2 } from 'lucide-react'

export default function TestEmailPage() {
  const [email, setEmail] = useState('zakryn20@gmail.com')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    details?: string
  } | null>(null)

  const testEmail = async () => {
    setSending(true)
    setResult(null)

    try {
      const response = await fetch('/api/test-resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (response.ok) {
        setResult({
          success: true,
          message: `✅ Email de test envoyé à ${email}`,
          details: `Message ID: ${data.messageId}`
        })
      } else {
        setResult({
          success: false,
          message: '❌ Échec de l\'envoi',
          details: data.details || data.error || 'Erreur inconnue'
        })
      }
    } catch (error) {
      setResult({
        success: false,
        message: '❌ Erreur réseau',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-light mb-2">Test d&apos;envoi d&apos;email Resend</h1>
        <p className="text-neutral-400 mb-8">
          Testez l&apos;envoi d&apos;emails d&apos;invitation avec votre configuration Resend
        </p>

        {/* Formulaire de test */}
        <div className="bg-[#1a1a1a] border border-neutral-700 p-6 mb-6">
          <label className="block text-sm text-neutral-300 mb-2">
            Adresse email de test
          </label>
          <div className="flex gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 px-4 py-3 bg-neutral-800 border border-neutral-600 text-white rounded focus:outline-none focus:border-blue-500"
              placeholder="email@exemple.com"
            />
            <button
              onClick={testEmail}
              disabled={!email || sending}
              className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {sending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Envoi...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Envoyer
                </>
              )}
            </button>
          </div>
        </div>

        {/* Résultat */}
        {result && (
          <div
            className={`border rounded p-6 ${
              result.success
                ? 'bg-green-500/10 border-green-500/30'
                : 'bg-red-500/10 border-red-500/30'
            }`}
          >
            <div className="flex items-start gap-3">
              {result.success ? (
                <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
              ) : (
                <XCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
              )}
              <div className="flex-1">
                <p className={`font-medium mb-2 ${result.success ? 'text-green-400' : 'text-red-400'}`}>
                  {result.message}
                </p>
                {result.details && (
                  <pre className="text-sm text-neutral-300 whitespace-pre-wrap bg-black/30 p-3 rounded mt-2">
                    {result.details}
                  </pre>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 bg-blue-500/10 border border-blue-500/30 rounded p-6">
          <h2 className="text-lg font-medium text-blue-300 mb-3">
            📋 Instructions de configuration
          </h2>
          <ol className="space-y-3 text-sm text-neutral-300">
            <li className="flex gap-2">
              <span className="text-blue-400 font-mono">1.</span>
              <span>
                Allez sur{' '}
                <a
                  href="https://resend.com/emails"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline"
                >
                  resend.com/emails
                </a>
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-400 font-mono">2.</span>
              <span>Connectez-vous à votre compte Resend</span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-400 font-mono">3.</span>
              <span>
                Dans <strong>Settings</strong>, trouvez la section <strong>&quot;Test emails&quot;</strong> ou{' '}
                <strong>&quot;Allowed emails&quot;</strong>
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-400 font-mono">4.</span>
              <span>
                Ajoutez <code className="bg-black/30 px-2 py-0.5 rounded">zakryn20@gmail.com</code>
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-400 font-mono">5.</span>
              <span>Cliquez sur &quot;Save&quot; ou &quot;Add&quot;</span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-400 font-mono">6.</span>
              <span>Revenez ici et testez l&apos;envoi !</span>
            </li>
          </ol>
        </div>

        {/* Alternatives */}
        <div className="mt-8 bg-neutral-800/50 border border-neutral-700 rounded p-6">
          <h2 className="text-lg font-medium text-neutral-200 mb-3">
            🔄 Alternatives
          </h2>
          <div className="space-y-2 text-sm text-neutral-400">
            <p>
              Si vous ne voulez pas configurer Resend maintenant, vous pouvez inviter des collaborateurs via :
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Le lien d&apos;invitation (copier-coller dans WhatsApp, Slack, etc.)</li>
              <li>Le code à 6 lettres (à partager verbalement ou par SMS)</li>
              <li>QR Code (à générer depuis le lien)</li>
            </ul>
          </div>
        </div>

        {/* Retour */}
        <div className="mt-8 text-center">
          <a
            href="/"
            className="text-blue-400 hover:underline text-sm"
          >
            ← Retour à l&apos;application
          </a>
        </div>
      </div>
    </div>
  )
}
