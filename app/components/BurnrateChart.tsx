"use client"

import { Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Line, ComposedChart } from "recharts"
import { ChevronDown, SlidersHorizontal, MoreVertical, Info } from 'lucide-react'
import { useDashboard } from '../contexts/DashboardContext'
import { useMemo } from 'react'

export function BurnrateChart() {
  const { burnrateConfig, setSelectedChart, selectedChart } = useDashboard()
  const { 
    data, 
    strokeColor, 
    strokeWidth = 2,
    strokeStyle = 'solid',
    fillPattern, 
    fillOpacity = 1,
    fillGradient,
    showMarkers, 
    referenceLines, 
    trendLine, 
    showMovingAverage, 
    movingAverageColor, 
    showAllPoints, 
    pointsColor,
    pointsSize = 4,
    animated = false,
    animationDuration = 1000,
    title 
  } = burnrateConfig

  // Convertir strokeStyle en strokeDasharray
  const getStrokeDasharray = () => {
    switch (strokeStyle) {
      case 'dashed': return '8 4'
      case 'dotted': return '2 2'
      default: return undefined
    }
  }

  // Calculer les données enrichies (moyenne mobile, tendance)
  const enrichedData = useMemo(() => {
    return data.map((item, index) => {
      // Moyenne mobile sur 3 mois
      let movingAvg = null
      if (index >= 2) {
        movingAvg = Math.round((data[index].value + data[index - 1].value + data[index - 2].value) / 3)
      }

      // Valeur de tendance linéaire
      let trendValue = null
      if (trendLine) {
        const progress = index / (data.length - 1)
        trendValue = Math.round(trendLine.startValue + (trendLine.endValue - trendLine.startValue) * progress)
      }

      return {
        ...item,
        movingAverage: movingAvg,
        trend: trendValue
      }
    })
  }, [data, trendLine])

  // Rendu des points/marqueurs
  const renderDot = (props: { cx?: number; cy?: number; index?: number }) => {
    const { cx, cy, index } = props
    if (cx === undefined || cy === undefined || index === undefined) return null
    
    // Marqueurs spécifiques
    const marker = showMarkers?.find(m => m.index === index)
    if (marker) {
      return (
        <g key={`marker-${index}`}>
          <circle cx={cx} cy={cy} r={pointsSize + 2} fill={marker.color} stroke="#fff" strokeWidth={2} />
          {marker.label && (
            <text x={cx} y={cy - 12} textAnchor="middle" fill={marker.color} fontSize={10} fontWeight="bold">
              {marker.label}
            </text>
          )}
        </g>
      )
    }

    // Afficher tous les points si demandé
    if (showAllPoints) {
      return (
        <circle 
          key={`point-${index}`}
          cx={cx} 
          cy={cy} 
          r={pointsSize} 
          fill={pointsColor || "#3b82f6"} 
          stroke="#fff" 
          strokeWidth={1.5} 
        />
      )
    }

    return null
  }

  // Déterminer le fill à utiliser
  const getFillValue = () => {
    if (fillGradient) {
      return 'url(#customGradient)'
    }
    return fillPattern
  }
  
  return (
    <div className="bg-neutral-800 p-6 relative h-full overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {/* Bouton "Demandé à l&apos;IA" - à côté du titre */}
          <div 
            onClick={() => setSelectedChart(selectedChart === 'burnrate' ? null : 'burnrate')}
            className={`h-6 px-2.5 py-1 bg-neutral-900 outline outline-[0.50px] outline-offset-[-0.50px] ${selectedChart === 'burnrate' ? 'outline-blue-500' : 'outline-blue-800'} inline-flex justify-center items-center gap-2 whitespace-nowrap cursor-pointer ai-request-btn group`}
          >
            <img src="/Star 1.svg" alt="Star" className="w-3 h-3 relative z-10 transition-all duration-300" />
            <div className="text-white text-[10px] font-light  relative z-10 transition-colors duration-300">Demandé à l&apos;IA</div>
          </div>
          <button className="px-4 py-2 bg-neutral-700 text-white text-sm  flex items-center gap-2">
            {title}
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-4 py-2 bg-neutral-700 text-white text-sm  flex items-center gap-2">
            July 2023 - July 2024
            <ChevronDown className="w-4 h-4" />
          </button>
          <button className="px-2 py-2 text-neutral-400 hover:text-white">
            <SlidersHorizontal className="w-4 h-4" />
          </button>
          <button className="px-2 py-2 text-neutral-400 hover:text-white">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center gap-2 text-sm text-neutral-400 mb-1 ">
          <span>2 months runway</span>
          <Info className="w-3.5 h-3.5" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-neutral-400 text-2xl ">€</span>
          <span className="text-5xl font-light tracking-tight text-white" style={{fontFamily: 'monospace'}}>19,546.50</span>
        </div>
        
        {/* Légende dynamique */}
        <div className="flex gap-4 mt-2 text-xs text-neutral-500">
          {trendLine && (
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-0.5" style={{ backgroundColor: trendLine.color }}></div>
              <span>Tendance</span>
            </div>
          )}
          {showMovingAverage && (
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-0.5" style={{ backgroundColor: movingAverageColor }}></div>
              <span>Moy. mobile (3 mois)</span>
            </div>
          )}
        </div>
      </div>

      <div className="h-[300px] mt-8">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={enrichedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <pattern
                id="hatchPattern"
                patternUnits="userSpaceOnUse"
                width="4"
                height="4"
                patternTransform="rotate(45)"
              >
                <line x1="0" y1="0" x2="0" y2="4" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
              </pattern>
              {fillGradient && (
                <linearGradient 
                  id="customGradient" 
                  x1={fillGradient.direction === 'horizontal' ? '0%' : '0%'} 
                  y1={fillGradient.direction === 'horizontal' ? '0%' : '0%'} 
                  x2={fillGradient.direction === 'horizontal' ? '100%' : '0%'} 
                  y2={fillGradient.direction === 'horizontal' ? '0%' : '100%'}
                >
                  <stop offset="0%" stopColor={fillGradient.from} stopOpacity={fillOpacity} />
                  <stop offset="100%" stopColor={fillGradient.to} stopOpacity={fillOpacity * 0.3} />
                </linearGradient>
              )}
            </defs>
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#666", fontSize: 12 }} dy={10} />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#666", fontSize: 12 }}
              tickFormatter={(value) => `€${value / 1000}k`}
              width={60}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-neutral-700 px-3 py-2 shadow-lg border border-neutral-600">
                      <p className="text-white font-semibold mb-1">{label}</p>
                      <p className="text-white " style={{fontFamily: 'monospace'}}>
                        Valeur: € {payload[0]?.value?.toLocaleString()}
                      </p>
                      {payload.find(p => p.dataKey === 'movingAverage')?.value && (
                        <p className="text-amber-400 text-sm">
                          Moy. mobile: € {payload.find(p => p.dataKey === 'movingAverage')?.value?.toLocaleString()}
                        </p>
                      )}
                      {payload.find(p => p.dataKey === 'trend')?.value && (
                        <p className="text-cyan-400 text-sm">
                          Tendance: € {payload.find(p => p.dataKey === 'trend')?.value?.toLocaleString()}
                        </p>
                      )}
                    </div>
                  )
                }
                return null
              }}
            />
            
            {/* Courbe principale */}
            <Area
              type="monotone"
              dataKey="value"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeDasharray={getStrokeDasharray()}
              fill={getFillValue()}
              fillOpacity={fillGradient ? 1 : fillOpacity}
              dot={renderDot}
              activeDot={{ r: pointsSize + 4 }}
              isAnimationActive={animated}
              animationDuration={animationDuration}
            />

            {/* Courbe de tendance */}
            {trendLine && (
              <Line
                type="linear"
                dataKey="trend"
                stroke={trendLine.color}
                strokeWidth={2}
                strokeDasharray="8 4"
                dot={false}
                activeDot={false}
              />
            )}

            {/* Moyenne mobile */}
            {showMovingAverage && (
              <Line
                type="monotone"
                dataKey="movingAverage"
                stroke={movingAverageColor || "#f59e0b"}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: movingAverageColor || "#f59e0b" }}
              />
            )}

            {/* Lignes de référence */}
            {referenceLines?.map((line, index) => (
              <ReferenceLine
                key={index}
                y={line.value}
                stroke={line.color}
                strokeDasharray={line.strokeDasharray || "5 5"}
                strokeWidth={2}
                label={{
                  value: line.label,
                  position: 'right',
                  fill: line.color,
                  fontSize: 12,
                  fontFamily: 'AF Neue Berlin',
                }}
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
