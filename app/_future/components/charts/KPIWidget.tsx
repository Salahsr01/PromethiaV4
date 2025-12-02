'use client'

import type { WidgetConfig } from '../../types/dashboard'

interface KPIWidgetProps {
  config: WidgetConfig
}

export function KPIWidget({ config }: KPIWidgetProps) {
  const value = config.config.value || 0
  const previousValue = config.config.previousValue
  const unit = config.config.unit || ''
  const format = config.config.format || 'number'
  const primaryColor = config.config.primaryColor || '#3b82f6'
  
  // Calculer la variation
  let variation = 0
  let variationPercent = 0
  if (previousValue !== undefined && previousValue !== 0) {
    variation = value - previousValue
    variationPercent = ((value - previousValue) / previousValue) * 100
  }
  
  // Formater la valeur
  const formatValue = (val: number) => {
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('fr-FR', { 
          style: 'currency', 
          currency: 'EUR',
          maximumFractionDigits: 0 
        }).format(val)
      case 'percent':
        return `${val.toFixed(1)}%`
      default:
        return val.toLocaleString('fr-FR')
    }
  }
  
  const isPositive = variation >= 0

  return (
    <div className="w-full h-full p-4 bg-neutral-800 flex flex-col justify-center">
      <h3 className="text-neutral-400 text-xs font-medium uppercase tracking-wide mb-2">
        {config.title}
      </h3>
      
      <div className="flex items-baseline gap-2">
        <span 
          className="text-3xl font-bold"
          style={{ color: primaryColor }}
        >
          {formatValue(value)}
        </span>
        {unit && format === 'number' && (
          <span className="text-neutral-500 text-lg">{unit}</span>
        )}
      </div>
      
      {previousValue !== undefined && (
        <div className="flex items-center gap-2 mt-2">
          <div 
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
              isPositive 
                ? 'bg-green-500/20 text-green-400' 
                : 'bg-red-500/20 text-red-400'
            }`}
          >
            <span>{isPositive ? '↑' : '↓'}</span>
            <span>{Math.abs(variationPercent).toFixed(1)}%</span>
          </div>
          <span className="text-neutral-500 text-xs">
            vs période précédente
          </span>
        </div>
      )}
    </div>
  )
}

