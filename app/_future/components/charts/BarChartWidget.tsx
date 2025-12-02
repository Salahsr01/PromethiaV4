'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import type { WidgetConfig } from '../../types/dashboard'

interface BarChartWidgetProps {
  config: WidgetConfig
  data?: Array<Record<string, unknown>>
}

export function BarChartWidget({ config, data }: BarChartWidgetProps) {
  const chartData = data || config.config.data || []
  const dataKey = config.config.valueKey || config.config.dataKey || 'value'
  const nameKey = config.config.nameKey || 'name'
  const colors = config.config.colors || ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

  return (
    <div className="w-full h-full p-4 bg-neutral-800 flex flex-col">
      <h3 className="text-white text-sm font-medium mb-4">{config.title}</h3>
      
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <XAxis 
              dataKey={nameKey} 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: "#666", fontSize: 11 }} 
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: "#666", fontSize: 11 }}
              tickFormatter={(value) => {
                if (value >= 1000) return `${(value / 1000).toFixed(0)}k`
                return value
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#404040',
                border: 'none',
                borderRadius: '4px',
                color: '#fff',
              }}
            />
            <Bar dataKey={dataKey} radius={[4, 4, 0, 0]}>
              {chartData.map((_, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={colors[index % colors.length]} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

