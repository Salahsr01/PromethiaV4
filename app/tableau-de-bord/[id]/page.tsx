'use client'

import { useParams } from 'next/navigation'
import { useDashboardsList } from '../../contexts/DashboardsListContext'
import { Sidebar } from '../../components/ui/Sidebar'
import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, AlertTriangle, Package, DollarSign, ShoppingCart, BarChart3, PieChart, MessageSquare, ChevronDown, SlidersHorizontal, MoreVertical } from 'lucide-react'
import { DynamicLineChart, DynamicBarChart, DynamicPieChart, DynamicAreaChart } from '../../components/charts/DashboardCharts'
import { DynamicDashboardProvider, useDynamicDashboard } from '../../contexts/DynamicDashboardContext'
import { DynamicMiniChat } from '../../components/DynamicMiniChat'

interface DashboardWidget {
  type: string
  title: string
  description: string
  value?: string
  subValue?: string
  data?: Record<string, unknown> | Array<Record<string, unknown>>
  priority?: string
  gridSpan?: number
}

// Composant interne qui utilise le contexte
function CustomDashboardContent() {
  const params = useParams()
  const id = params.id as string
  const { getDashboard, dashboards } = useDashboardsList()
  const [isLoading, setIsLoading] = useState(true)
  const [dashboard, setDashboard] = useState<ReturnType<typeof getDashboard>>(undefined)
  const [insights, setInsights] = useState<string[]>([])
  const { selectedWidget, setSelectedWidget, setWidgets } = useDynamicDashboard()

  useEffect(() => {
    // Attendre que les dashboards soient chargés
    if (dashboards.length > 0 || !isLoading) {
      const found = getDashboard(id)
      setDashboard(found)

      // Initialiser les widgets dans le contexte
      if (found && found.widgets) {
        setWidgets(found.widgets as any[])
      }

      // Charger les insights depuis localStorage
      const savedInsights = localStorage.getItem(`dashboard-insights-${id}`)
      if (savedInsights) {
        try {
          setInsights(JSON.parse(savedInsights))
        } catch (e) {
          console.error('Erreur parsing insights:', e)
        }
      }

      setIsLoading(false)
    }
  }, [id, dashboards, getDashboard, isLoading, setWidgets])
  
  // Fonction pour rendre un widget selon son type
  const renderWidget = (widget: DashboardWidget, index: number) => {
    const priorityColors = {
      high: 'border-l-4 border-l-red-500',
      medium: 'border-l-4 border-l-yellow-500',
      low: 'border-l-4 border-l-green-500'
    }
    
    const priorityClass = widget.priority ? priorityColors[widget.priority as keyof typeof priorityColors] || '' : ''
    
    if (widget.type === 'kpi') {
      return (
        <div key={index} className={`bg-neutral-800 p-6 h-full flex flex-col ${priorityClass}`}>
          <div className="flex items-start justify-between mb-3">
            <span className="text-neutral-400 text-xs uppercase tracking-wide">{widget.title}</span>
            {widget.priority === 'high' && <AlertTriangle className="w-4 h-4 text-red-500" />}
          </div>
          <div className="text-white text-3xl font-light mb-2">{widget.value || '-'}</div>
          {widget.subValue && (
            <div className={`text-xs flex items-center gap-1 ${
              widget.subValue.includes('+') || widget.subValue.includes('↑') ? 'text-green-400' :
              widget.subValue.includes('-') || widget.subValue.includes('↓') ? 'text-red-400' :
              'text-neutral-400'
            }`}>
              {widget.subValue.includes('+') && <TrendingUp className="w-3 h-3" />}
              {widget.subValue.includes('-') && <TrendingDown className="w-3 h-3" />}
              {widget.subValue}
            </div>
          )}
          <p className="text-neutral-500 text-[10px] mt-auto">{widget.description}</p>
        </div>
      )
    }

    if (widget.type === 'alert') {
      return (
        <div key={index} className="bg-red-900/20 border border-red-800 p-6 h-full flex flex-col overflow-hidden">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <span className="text-red-400 text-sm font-medium">{widget.title}</span>
          </div>
          <p className="text-white text-sm mb-3">{widget.description}</p>
          {widget.data && Array.isArray((widget.data as any).items) && (
            <div className="flex-1 overflow-y-auto">
              <ul className="space-y-1">
                {((widget.data as any).items as string[]).slice(0, 10).map((item, i) => (
                  <li key={i} className="text-red-300 text-xs flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )
    }

    if (widget.type === 'table') {
      return (
        <div key={index} className="bg-neutral-800 p-6 h-full flex flex-col overflow-hidden">
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-4 h-4 text-blue-400" />
            <span className="text-white text-sm font-medium">{widget.title}</span>
          </div>
          <p className="text-neutral-400 text-xs mb-3">{widget.description}</p>
          {widget.data && Array.isArray((widget.data as any).rows) && (
            <div className="flex-1 overflow-y-auto space-y-2">
              {((widget.data as any).rows as Array<Record<string, string | number>>).map((row, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-neutral-700">
                  <span className="text-white text-xs">{row.name || row.product || Object.values(row)[0]}</span>
                  <span className="text-neutral-400 text-xs">{row.value || row.quantity || Object.values(row)[1]}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )
    }
    
    if (widget.type === 'chart') {
      return (
        <div key={index} className="bg-neutral-800 p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-purple-400" />
            <span className="text-white text-sm font-medium">{widget.title}</span>
          </div>
          <p className="text-neutral-400 text-xs mb-3">{widget.description}</p>
          {/* Placeholder pour le graphique */}
          <div className="h-32 bg-neutral-700/30 rounded flex items-center justify-center">
            <PieChart className="w-8 h-8 text-neutral-600" />
          </div>
        </div>
      )
    }

    // Graphiques ligne
    if (widget.type === 'line-chart' && Array.isArray(widget.data)) {
      const widgetId = `line-chart-${index}`
      return (
        <div key={index} className="bg-neutral-800 p-6 h-full flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {/* Bouton "Demandé à l'IA" */}
              <div
                onClick={() => setSelectedWidget(selectedWidget === widgetId ? null : widgetId)}
                className={`h-6 px-2.5 py-1 bg-neutral-900 outline outline-[0.50px] outline-offset-[-0.50px] ${selectedWidget === widgetId ? 'outline-blue-500' : 'outline-blue-800'} inline-flex justify-center items-center gap-2 whitespace-nowrap cursor-pointer transition-all`}
              >
                <img src="/Star 1.svg" alt="Star" className="w-3 h-3" />
                <div className="text-white text-[10px] font-light">Demandé à l&apos;IA</div>
              </div>
              <button className="px-4 py-2 bg-neutral-700 text-white text-sm flex items-center gap-2">
                {widget.title}
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button className="px-2 py-2 text-neutral-400 hover:text-white">
                <SlidersHorizontal className="w-4 h-4" />
              </button>
              <button className="px-2 py-2 text-neutral-400 hover:text-white">
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          </div>
          <p className="text-neutral-400 text-xs mb-4">{widget.description}</p>
          <div className="flex-1 min-h-0">
            <DynamicLineChart data={widget.data as any} />
          </div>
        </div>
      )
    }

    // Graphiques barres
    if (widget.type === 'bar-chart' && Array.isArray(widget.data)) {
      const widgetId = `bar-chart-${index}`
      return (
        <div key={index} className="bg-neutral-800 p-6 h-full flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {/* Bouton "Demandé à l'IA" */}
              <div
                onClick={() => setSelectedWidget(selectedWidget === widgetId ? null : widgetId)}
                className={`h-6 px-2.5 py-1 bg-neutral-900 outline outline-[0.50px] outline-offset-[-0.50px] ${selectedWidget === widgetId ? 'outline-blue-500' : 'outline-blue-800'} inline-flex justify-center items-center gap-2 whitespace-nowrap cursor-pointer transition-all`}
              >
                <img src="/Star 1.svg" alt="Star" className="w-3 h-3" />
                <div className="text-white text-[10px] font-light">Demandé à l&apos;IA</div>
              </div>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-purple-400" />
                <span className="text-white text-sm font-medium">{widget.title}</span>
              </div>
            </div>
          </div>
          <p className="text-neutral-400 text-xs mb-3">{widget.description}</p>
          <div className="flex-1 min-h-0">
            <DynamicBarChart data={widget.data as any} />
          </div>
        </div>
      )
    }

    // Graphiques camembert
    if (widget.type === 'pie-chart' && Array.isArray(widget.data)) {
      const widgetId = `pie-chart-${index}`
      return (
        <div key={index} className="bg-neutral-800 p-6 h-full flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {/* Bouton "Demandé à l'IA" */}
              <div
                onClick={() => setSelectedWidget(selectedWidget === widgetId ? null : widgetId)}
                className={`h-6 px-2.5 py-1 bg-neutral-900 outline outline-[0.50px] outline-offset-[-0.50px] ${selectedWidget === widgetId ? 'outline-blue-500' : 'outline-blue-800'} inline-flex justify-center items-center gap-2 whitespace-nowrap cursor-pointer transition-all`}
              >
                <img src="/Star 1.svg" alt="Star" className="w-3 h-3" />
                <div className="text-white text-[10px] font-light">Demandé à l&apos;IA</div>
              </div>
              <div className="flex items-center gap-2">
                <PieChart className="w-4 h-4 text-pink-400" />
                <span className="text-white text-sm font-medium">{widget.title}</span>
              </div>
            </div>
          </div>
          <p className="text-neutral-400 text-xs mb-3">{widget.description}</p>
          <div className="flex-1 min-h-0">
            <DynamicPieChart data={widget.data as any} />
          </div>
        </div>
      )
    }

    // Graphiques zone
    if (widget.type === 'area-chart' && Array.isArray(widget.data)) {
      const widgetId = `area-chart-${index}`
      const dataKeys = widget.data.length > 0 ? Object.keys(widget.data[0]).filter(k => k !== 'month' && k !== 'name') : []
      return (
        <div key={index} className="bg-neutral-800 p-6 h-full flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {/* Bouton "Demandé à l'IA" */}
              <div
                onClick={() => setSelectedWidget(selectedWidget === widgetId ? null : widgetId)}
                className={`h-6 px-2.5 py-1 bg-neutral-900 outline outline-[0.50px] outline-offset-[-0.50px] ${selectedWidget === widgetId ? 'outline-blue-500' : 'outline-blue-800'} inline-flex justify-center items-center gap-2 whitespace-nowrap cursor-pointer transition-all`}
              >
                <img src="/Star 1.svg" alt="Star" className="w-3 h-3" />
                <div className="text-white text-[10px] font-light">Demandé à l&apos;IA</div>
              </div>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-cyan-400" />
                <span className="text-white text-sm font-medium">{widget.title}</span>
              </div>
            </div>
          </div>
          <p className="text-neutral-400 text-xs mb-3">{widget.description}</p>
          <div className="flex-1 min-h-0">
            <DynamicAreaChart data={widget.data as any} dataKeys={dataKeys} />
          </div>
        </div>
      )
    }

    // Box d'assistance IA - utiliser le vrai composant MiniChat
    if (widget.type === 'assistance') {
      return (
        <div key={index} className="bg-neutral-800 h-full overflow-hidden">
          <DynamicMiniChat />
        </div>
      )
    }
    
    if (widget.type === 'progress') {
      const percentage = (widget.data as any)?.percentage as number || 0
      return (
        <div key={index} className="bg-neutral-800 p-5">
          <span className="text-neutral-400 text-xs uppercase tracking-wide">{widget.title}</span>
          <div className="mt-3 mb-2">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-white">{widget.value}</span>
              <span className="text-neutral-400">{percentage}%</span>
            </div>
            <div className="h-2 bg-neutral-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
          <p className="text-neutral-500 text-[10px]">{widget.description}</p>
        </div>
      )
    }
    
    // Widget par défaut
    return (
      <div key={index} className="bg-neutral-800 p-5">
        <span className="text-white text-sm font-medium">{widget.title}</span>
        <p className="text-neutral-400 text-xs mt-2">{widget.description}</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="relative w-full min-h-screen bg-[#141414] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-800/30 border-t-blue-800 rounded-full animate-spin" />
      </div>
    )
  }

  if (!dashboard) {
    return (
      <div className="relative w-full min-h-screen bg-[#141414]">
        <Sidebar currentPage="dashboard" currentDashboardId={id} />
        <main className="ml-16 sm:ml-20 lg:ml-64 min-h-screen flex flex-col items-center justify-center px-6">
          <div className="text-center">
            <h1 className="text-white text-xl mb-4">Tableau de bord introuvable</h1>
            <p className="text-neutral-400 text-sm">Ce tableau de bord n&apos;existe pas ou a été supprimé.</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="relative w-full min-h-screen bg-[#141414] overflow-x-hidden">
      {/* Sidebar */}
      <Sidebar currentPage="dashboard" currentDashboardId={id} />

      {/* Contenu principal */}
      <main className="ml-16 sm:ml-20 lg:ml-64 min-h-screen p-6 sm:p-8 lg:p-10">
        {/* Header du tableau de bord */}
        <div className="mb-8">
          <h1 className="text-white text-2xl font-light  mb-2">
            {dashboard.name}
          </h1>
          <p className="text-neutral-400 text-sm ">
            {dashboard.description}
          </p>
        </div>

        {/* Insights de l'IA */}
        {insights.length > 0 && (
          <div className="mb-6 p-4 bg-blue-900/20 border border-blue-800 rounded">
            <div className="flex items-center gap-2 mb-3">
              <img src="/IA.svg" alt="IA" className="w-5 h-5" />
              <span className="text-blue-400 text-sm font-medium">Insights de l&apos;IA</span>
            </div>
            <ul className="space-y-2">
              {insights.map((insight, i) => (
                <li key={i} className="text-white text-xs flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5">•</span>
                  {insight}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Widgets générés par l'IA */}
        {dashboard.widgets && dashboard.widgets.length > 0 ? (
          <>
            {/* Grand graphique principal en haut */}
            {(() => {
              const mainChart = (dashboard.widgets as unknown as DashboardWidget[]).find(
                w => w.type === 'line-chart' || w.type === 'area-chart' || w.type === 'bar-chart'
              )
              if (mainChart) {
                return (
                  <div className="w-full h-[350px] sm:h-[420px] lg:h-[500px] mb-6">
                    {renderWidget(mainChart, -1)}
                  </div>
                )
              }
              return null
            })()}

            {/* Section du bas - Assistance IA à gauche, autres widgets à droite */}
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Box Assistance IA - prend plus de place */}
              {(() => {
                const assistanceWidget = (dashboard.widgets as unknown as DashboardWidget[]).find(w => w.type === 'assistance')
                if (assistanceWidget) {
                  return (
                    <div className="w-full lg:w-[45%] h-80 lg:h-96 overflow-hidden">
                      {renderWidget(assistanceWidget, -2)}
                    </div>
                  )
                }
                return null
              })()}

              {/* Autres widgets côte à côte */}
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-6">
                {(dashboard.widgets as unknown as DashboardWidget[])
                  .filter(w =>
                    w.type !== 'assistance' &&
                    !(w.type === 'line-chart' || w.type === 'area-chart' || w.type === 'bar-chart')
                  )
                  .slice(0, 6)
                  .map((widget, index) => (
                    <div key={index} className="h-80 lg:h-96">
                      {renderWidget(widget, index)}
                    </div>
                  ))
                }
              </div>
            </div>
          </>
        ) : (
          <div className="w-full min-h-[400px] bg-neutral-800 flex flex-col items-center justify-center p-8">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 mx-auto mb-6 bg-blue-800/20 rounded-lg flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 3H10V10H3V3Z" stroke="#1438BB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M14 3H21V10H14V3Z" stroke="#1438BB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M14 14H21V21H14V14Z" stroke="#1438BB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M3 14H10V21H3V14Z" stroke="#1438BB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h2 className="text-white text-lg font-light mb-3">
                Tableau de bord en construction
              </h2>
              <p className="text-neutral-400 text-sm mb-6">
                Ce tableau de bord personnalisé est prêt à être configuré. 
                Utilisez l&apos;assistant IA pour ajouter des widgets et visualisations.
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-800 text-white text-sm cursor-pointer hover:bg-blue-700 transition-colors">
                <img src="/Star 1.svg" alt="" className="w-4 h-4" />
                <span>Configurer avec l&apos;IA</span>
              </div>
            </div>
          </div>
        )}

        {/* Info sur la création */}
        <div className="mt-6 text-neutral-500 text-xs">
          Créé le {dashboard.createdAt.toLocaleDateString('fr-FR', { 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
          })}
        </div>
      </main>
    </div>
  )
}

// Composant wrapper avec le provider
export default function CustomDashboard() {
  return (
    <DynamicDashboardProvider>
      <CustomDashboardContent />
    </DynamicDashboardProvider>
  )
}

