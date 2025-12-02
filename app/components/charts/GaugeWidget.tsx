'use client'

import type { WidgetConfig } from '../../lib/dashboard'

interface GaugeWidgetProps {
  config: WidgetConfig
}

export function GaugeWidget({ config }: GaugeWidgetProps) {
  const value = config.config.value || 0
  const min = config.config.min || 0
  const max = config.config.max || 100
  const unit = config.config.unit || '%'
  const primaryColor = config.config.primaryColor || '#3b82f6'
  
  // Calculer le pourcentage
  const percentage = ((value - min) / (max - min)) * 100
  const clampedPercentage = Math.max(0, Math.min(100, percentage))
  
  // Calculer l'angle pour l'arc (180 degrés = demi-cercle)
  const angle = (clampedPercentage / 100) * 180
  
  // Déterminer la couleur selon les seuils
  const thresholds = config.config.thresholds || [
    { value: 30, color: '#ef4444' },  // Rouge < 30%
    { value: 70, color: '#f59e0b' },  // Orange 30-70%
    { value: 100, color: '#22c55e' }, // Vert > 70%
  ]
  
  let color = primaryColor
  for (const threshold of thresholds) {
    if (clampedPercentage <= threshold.value) {
      color = threshold.color
      break
    }
  }

  return (
    <div className="w-full h-full p-4 bg-neutral-800 flex flex-col items-center justify-center">
      <h3 className="text-white text-sm font-medium mb-4">{config.title}</h3>
      
      <div className="relative w-32 h-16">
        {/* Arc de fond */}
        <svg className="w-full h-full" viewBox="0 0 100 50">
          <path
            d="M 5 50 A 45 45 0 0 1 95 50"
            fill="none"
            stroke="#404040"
            strokeWidth="8"
            strokeLinecap="round"
          />
          {/* Arc de valeur */}
          <path
            d="M 5 50 A 45 45 0 0 1 95 50"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${(angle / 180) * 141.37} 141.37`}
            style={{ transition: 'stroke-dasharray 0.5s ease' }}
          />
        </svg>
        
        {/* Valeur au centre */}
        <div className="absolute inset-0 flex items-end justify-center pb-1">
          <span className="text-2xl font-bold text-white">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </span>
          <span className="text-sm text-neutral-400 ml-1">{unit}</span>
        </div>
      </div>
      
      {/* Labels min/max */}
      <div className="w-32 flex justify-between mt-1">
        <span className="text-xs text-neutral-500">{min}</span>
        <span className="text-xs text-neutral-500">{max}</span>
      </div>
    </div>
  )
}

