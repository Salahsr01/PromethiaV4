'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useDashboardsList } from '../../contexts/DashboardsListContext'
import { Sidebar } from '../../components/ui/Sidebar'

export default function NouveauTableauDeBord() {
  const [description, setDescription] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [status, setStatus] = useState('')
  const { addDashboard } = useDashboardsList()
  const router = useRouter()

  const handleCreate = async () => {
    if (!description.trim() || isCreating) return
    
    setIsCreating(true)
    setStatus('🔍 Analyse de la base de données...')
    
    try {
      // Appeler l'API pour analyser la base et générer le dashboard avec Claude
      const response = await fetch('/api/analyze-and-create-dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description })
      })

      if (!response.ok) {
        throw new Error('Erreur API')
      }

      setStatus('🤖 L\'IA génère votre dashboard...')
      
      const { dashboard } = await response.json()
      
      setStatus('💾 Sauvegarde du tableau de bord...')
      
      // Créer le nouveau tableau de bord avec la config générée par l'IA
      const newDashboard = await addDashboard(
        dashboard.name || description.split(' ').slice(0, 4).join(' '),
        dashboard.description || description,
        dashboard.widgets || []
      )
      
      // Stocker les insights dans localStorage pour les afficher
      if (dashboard.insights) {
        localStorage.setItem(`dashboard-insights-${newDashboard.id}`, JSON.stringify(dashboard.insights))
      }
      
      // Rediriger vers le nouveau tableau de bord
      router.push(`/tableau-de-bord/${newDashboard.id}`)
    } catch (error) {
      console.error('Erreur création tableau:', error)
      setStatus('❌ Erreur lors de la création. Réessayez.')
      setIsCreating(false)
    }
  }

  return (
    <div className="relative w-full min-h-screen bg-blue-800 overflow-hidden">
      {/* Sidebar */}
      <Sidebar currentPage="dashboard" />

      {/* Contenu principal */}
      <main className="ml-16 sm:ml-20 lg:ml-64 min-h-screen flex flex-col items-center justify-center px-6">
        {/* Contenu centré */}
        <div className="w-full max-w-2xl flex flex-col items-center">
          {/* Icône IA */}
          <div className="w-14 h-14 mb-8 flex items-center justify-center">
            <img src="/IA.svg" alt="IA" className="w-10 h-10" />
          </div>

          {/* Titre */}
          <h1 className="text-white text-sm font-medium  mb-8">
            Création d&apos;un nouveau Tableau de bord
          </h1>

          {/* Zone de saisie */}
          <div className="w-full max-w-[667px] relative">
            <div className="relative">
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                placeholder="Décrivez votre nouvel espace..."
                disabled={isCreating}
                className="w-full h-14 px-4 pr-16 bg-neutral-800 outline outline-[0.70px] outline-offset-[-0.70px] outline-neutral-400 text-white placeholder:text-neutral-600 text-sm font-normal  border-none disabled:opacity-50"
              />
              <button
                onClick={handleCreate}
                disabled={!description.trim() || isCreating}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-11 h-9 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:opacity-50 flex items-center justify-center transition-colors"
              >
                {isCreating ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2 10L10 2M10 2H4M10 2V8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Status de création */}
          {status && (
            <p className={`mt-4 text-sm text-center ${status.includes('Erreur') ? 'text-red-400' : 'text-blue-300'}`}>
              {status}
            </p>
          )}

          {/* Texte d'aide */}
          {!isCreating && (
            <p className="mt-6 text-white/50 text-xs text-center max-w-md">
              Décrivez le type de tableau de bord que vous souhaitez créer. 
              Par exemple : &quot;Un tableau pour suivre mes ventes mensuelles&quot; ou &quot;Dashboard RH avec suivi des congés&quot;
            </p>
          )}
        </div>

        {/* Effet décoratif en arrière-plan */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-900/30 rounded-full blur-3xl" />
        </div>
      </main>
    </div>
  )
}

