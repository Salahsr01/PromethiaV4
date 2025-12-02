'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts'
import type { WidgetConfig } from '../../types/dashboard'

interface StockWidgetProps {
  config: WidgetConfig
  data?: Array<{
    name: string
    current: number
    min: number
    max: number
    status: 'ok' | 'low' | 'critical' | 'overstock'
  }>
}

export function StockWidget({ config, data }: StockWidgetProps) {
  const stockData = data || config.config.data || []
  
  // Couleurs selon le statut
  const getColor = (status: string) => {
    switch (status) {
      case 'ok': return '#22c55e'
      case 'low': return '#f59e0b'
      case 'critical': return '#ef4444'
      case 'overstock': return '#3b82f6'
      default: return '#6b7280'
    }
  }

  return (
    <div className="w-full h-full p-4 bg-neutral-800 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white text-sm font-medium">{config.title}</h3>
        <div className="flex gap-3 text-[10px]">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-neutral-400">OK</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
            <span className="text-neutral-400">Bas</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            <span className="text-neutral-400">Critique</span>
          </div>
        </div>
      </div>
      
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={stockData} 
            layout="vertical"
            margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
          >
            <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: "#666", fontSize: 10 }} />
            <YAxis 
              type="category" 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: "#999", fontSize: 11 }}
              width={55}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#404040',
                border: 'none',
                borderRadius: '4px',
                color: '#fff',
                fontSize: 12,
              }}
              formatter={(value, name) => {
                if (name === 'current') return [`${value} unités`, 'Stock actuel']
                return [value, name]
              }}
            />
            <Bar dataKey="current" radius={[0, 4, 4, 0]} barSize={16}>
              {stockData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={getColor(String(entry.status || 'normal'))}
                />
              ))}
            </Bar>
            {/* Ligne de stock minimum moyen */}
            <ReferenceLine
              x={stockData.reduce((sum, d) => sum + Number(d.min || 0), 0) / stockData.length}
              stroke="#ef4444"
              strokeDasharray="3 3"
              label={{ value: 'Min', fill: '#ef4444', fontSize: 10, position: 'top' }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      {/* Résumé */}
      <div className="flex justify-between mt-2 pt-2 border-t border-neutral-700 text-xs">
        <div className="text-neutral-400">
          <span className="text-red-400 font-medium">
            {stockData.filter(d => d.status === 'critical').length}
          </span> critique(s)
        </div>
        <div className="text-neutral-400">
          <span className="text-yellow-400 font-medium">
            {stockData.filter(d => d.status === 'low').length}
          </span> bas
        </div>
        <div className="text-neutral-400">
          <span className="text-green-400 font-medium">
            {stockData.filter(d => d.status === 'ok').length}
          </span> OK
        </div>
      </div>
    </div>
  )
}

