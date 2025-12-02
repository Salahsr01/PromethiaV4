'use client'

import type { WidgetConfig } from '../types/dashboard'
import { BarChartWidget } from './charts/BarChartWidget'
import { PieChartWidget } from './charts/PieChartWidget'
import { GaugeWidget } from './charts/GaugeWidget'
import { KPIWidget } from './charts/KPIWidget'
import { TableWidget } from './charts/TableWidget'
import { StockWidget } from './charts/StockWidget'

// Import des composants existants
// import { MiniChat } from '../../components/MiniChat'
// import { BurnrateChart } from '../../components/BurnrateChart'

interface DynamicWidgetProps {
  config: WidgetConfig
  data?: unknown
  isSelected?: boolean
  onSelect?: () => void
  isEditing?: boolean
}

export function DynamicWidget({ 
  config, 
  data, 
  isSelected, 
  onSelect,
  isEditing 
}: DynamicWidgetProps) {
  
  // Rendu du contenu selon le type
  const renderContent = () => {
    switch (config.type) {
      case 'bar-chart':
      case 'horizontal-bar':
        return <BarChartWidget config={config} data={data as Array<Record<string, unknown>>} />
      
      case 'pie-chart':
      case 'donut-chart':
        return <PieChartWidget config={config} data={data as Array<Record<string, unknown>>} />
      
      case 'gauge':
        return <GaugeWidget config={config} />
      
      case 'kpi':
        return <KPIWidget config={config} />
      
      case 'table':
        return <TableWidget config={config} data={data as Array<Record<string, unknown>>} />
      
      // Widget spécial pour le stock
      case 'progress':
        if (config.dataCategory === 'stock') {
          return <StockWidget config={config} data={data as Array<{name: string; current: number; min: number; max: number; status: 'ok' | 'low' | 'critical' | 'overstock'}>} />
        }
        return <GaugeWidget config={config} />
      
      case 'line-chart':
      case 'area-chart':
        // Pour l'instant, utiliser BarChart comme fallback
        return <BarChartWidget config={config} data={data as Array<Record<string, unknown>>} />
      
      case 'mini-chat':
        // Placeholder pour le chat
        return (
          <div className="w-full h-full p-4 bg-neutral-800 flex flex-col">
            <h3 className="text-white text-sm font-medium mb-2">Assistance IA</h3>
            <div className="flex-1 flex items-center justify-center text-neutral-500 text-sm">
              Chat IA intégré
            </div>
          </div>
        )
      
      default:
        return (
          <div className="w-full h-full p-4 bg-neutral-800 flex items-center justify-center">
            <span className="text-neutral-500 text-sm">
              Widget type: {config.type}
            </span>
          </div>
        )
    }
  }

  return (
    <div 
      className={`
        relative overflow-hidden rounded-lg transition-all
        ${isSelected ? 'ring-2 ring-blue-500' : ''}
        ${isEditing ? 'cursor-move hover:ring-2 hover:ring-blue-500/50' : ''}
      `}
      onClick={onSelect}
      style={{
        gridColumn: `span ${config.position.width}`,
        gridRow: `span ${config.position.height}`,
      }}
    >
      {renderContent()}
      
      {/* Overlay d'édition */}
      {isEditing && isSelected && (
        <div className="absolute top-2 right-2 flex gap-1">
          <button className="w-6 h-6 bg-neutral-700 hover:bg-neutral-600 rounded flex items-center justify-center text-white text-xs">
            ✎
          </button>
          <button className="w-6 h-6 bg-red-600 hover:bg-red-500 rounded flex items-center justify-center text-white text-xs">
            ✕
          </button>
        </div>
      )}
    </div>
  )
}

