'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useDashboardsList } from '../../contexts/DashboardsListContext'
import { Plus, ChevronDown, ChevronRight } from 'lucide-react'

interface SidebarProps {
  conversationTitle?: string
  isCollabActive?: boolean
  onNewConversation?: () => void
  currentPage?: 'chatbox' | 'dashboard' | 'database' | 'calendar'
  currentDashboardId?: string
}

// Ordre fixe des éléments de navigation - NE PAS MODIFIER L'ORDRE
// Ordre requis : 1. Chatbox, 2. Tableau de Bord, 3. Base de donnée, 4. Calendrier
const navItems: ReadonlyArray<{ id: string; label: string; icon: string; href: string }> = [
  { id: 'chatbox', label: 'Le Chatbox', icon: '/Star 1.svg', href: '/' },
  { id: 'dashboard', label: 'Le Tableau de Bord', icon: '/bord.svg', href: '/tableau-de-bord' },
  { id: 'database', label: 'La base de donnée', icon: '/base.svg', href: '/base-de-donnees' },
  { id: 'calendar', label: 'Le Calendrier', icon: '/calendrier.svg', href: '/calendrier' },
]

export function Sidebar({
  conversationTitle,
  isCollabActive = false,
  onNewConversation,
  currentPage = 'chatbox',
  currentDashboardId
}: SidebarProps) {
  const { dashboards } = useDashboardsList()
  const [isDashboardsExpanded, setIsDashboardsExpanded] = useState(currentPage === 'dashboard')
  
  // Filtrer pour ne pas afficher le tableau par défaut dans la liste (il est déjà dans navItems)
  const customDashboards = dashboards.filter(d => !d.isDefault)
  
  return (
    <aside className="fixed left-0 top-0 h-full w-16 sm:w-20 lg:w-64 bg-surface flex flex-col py-8 sm:py-10 lg:py-12 px-3 sm:px-4 lg:px-6 z-50">
      {/* User info - hidden on mobile */}
      <div className="hidden lg:flex items-center gap-3 mb-10">
        <div className="px-2.5 py-1 bg-white">
          <span className="text-black text-xs">Compte Pro +</span>
        </div>
        <span className="text-white text-xs font-light">Salah-Eddine Sriar</span>
      </div>

      {/* New conversation button */}
      {onNewConversation && (
        <button
          onClick={onNewConversation}
          className="w-full py-2.5 px-3 lg:py-3 lg:px-4 bg-blue-800 flex justify-center lg:justify-start items-center gap-3 hover:bg-blue-700 transition-colors mb-10"
        >
          <img src="/IA.svg" alt="" className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="text-white text-xs hidden lg:inline whitespace-nowrap">Nouvelle conversation</span>
        </button>
      )}

      {/* Navigation - Ordre fixe : Chatbox, Tableau de Bord, Base de données, Calendrier */}
      <nav className="flex flex-col gap-5 lg:gap-6">
        {navItems.map((item) => {
          const isActive = currentPage === item.id
          const isDisabled = item.href === '#'
          
          return (
            <div key={item.id}>
              {isDisabled ? (
                <div className="flex items-center gap-3 opacity-50 cursor-not-allowed py-1">
                  <img src={item.icon} alt="" className="w-4 h-4 flex-shrink-0" />
                  <span className="text-white/50 text-xs font-light hidden lg:inline">{item.label}</span>
                </div>
              ) : (
                <>
                  {item.id === 'dashboard' ? (
                    <div>
                      <div 
                        className={`flex items-center gap-3 hover:opacity-80 transition-opacity py-1 cursor-pointer ${
                          isActive ? '' : 'opacity-50'
                        }`}
                        onClick={() => setIsDashboardsExpanded(!isDashboardsExpanded)}
                      >
                        <img src={item.icon} alt="" className="w-4 h-4 flex-shrink-0" />
                        <div className="hidden lg:flex items-center gap-2 overflow-hidden flex-1">
                          <span className={`text-xs font-light ${isActive ? 'text-white' : 'text-white/50'}`}>
                            {item.label}
                          </span>
                          {customDashboards.length > 0 && (
                            isDashboardsExpanded ? 
                              <ChevronDown className="w-3 h-3 text-white/50" /> : 
                              <ChevronRight className="w-3 h-3 text-white/50" />
                          )}
                        </div>
                      </div>
                      
                      {/* Liste des tableaux de bord */}
                      {isDashboardsExpanded && (
                        <div className="hidden lg:block mt-2 ml-7 space-y-2">
                          {/* Tableau par défaut */}
                          <Link 
                            href="/tableau-de-bord"
                            className={`block text-[10px] font-light py-1 hover:text-white transition-colors ${
                              currentDashboardId === 'default' || (!currentDashboardId && currentPage === 'dashboard') 
                                ? 'text-white' 
                                : 'text-white/50'
                            }`}
                          >
                            • Principal
                          </Link>
                          
                          {/* Tableaux personnalisés */}
                          {customDashboards.map(dashboard => (
                            <Link 
                              key={dashboard.id}
                              href={`/tableau-de-bord/${dashboard.id}`}
                              className={`block text-[10px] font-light py-1 hover:text-white transition-colors truncate ${
                                currentDashboardId === dashboard.id ? 'text-white' : 'text-white/50'
                              }`}
                            >
                              • {dashboard.name}
                            </Link>
                          ))}
                          
                          {/* Bouton créer nouveau */}
                          <Link
                            href="/tableau-de-bord/nouveau"
                            className="flex items-center gap-1.5 text-[10px] font-light py-1 text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Créer un espace</span>
                          </Link>
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 hover:opacity-80 transition-opacity py-1 ${
                        isActive ? '' : 'opacity-50'
                      }`}
                    >
                      <img src={item.icon} alt="" className="w-4 h-4 flex-shrink-0" />
                      <div className="hidden lg:flex items-center gap-3 overflow-hidden">
                        <span className={`text-xs font-light ${isActive ? 'text-white' : 'text-white/50'}`}>
                          {item.label}
                        </span>
                        {item.id === 'chatbox' && conversationTitle && (
                          <>
                            <div className="w-2 h-2 bg-zinc-300 rounded-full flex-shrink-0" />
                            <span className="text-white text-[10px] font-light truncate max-w-[100px]">
                              {conversationTitle}
                            </span>
                          </>
                        )}
                      </div>
                    </Link>
                  )}
                </>
              )}
              
              {/* Collaborators section */}
              {item.id === 'chatbox' && isCollabActive && conversationTitle && (
                <div className="hidden lg:block mt-3 ml-7 p-3 bg-blue-800">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-end gap-3">
                      <span className="text-white text-xs font-light">Elio CHIRAT</span>
                      <span className="text-indigo-400 text-xs font-light">Zaki AIT YOUNES</span>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-1.5">
                        <span className="text-white text-[6px] font-light">Connecté</span>
                        <div className="w-1 h-1 bg-lime-600 rounded-full" />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-white/50 text-[6px] font-light">Déconnecté</span>
                        <div className="w-1 h-1 bg-white/50 rounded-full" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </nav>
    </aside>
  )
}

