'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { WidgetConfig } from '../../types/dashboard'

interface PieChartWidgetProps {
  config: WidgetConfig
  data?: Array<Record<string, unknown>>
}

export function PieChartWidget({ config, data }: PieChartWidgetProps) {
  const chartData = data || config.config.data || []
  const dataKey = config.config.valueKey || config.config.dataKey || 'value'
  const nameKey = config.config.nameKey || 'name'
  const showLegend = config.config.showLegend ?? true
  const colors = config.config.colors || ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6']

  return (
    <div className="w-full h-full p-4 bg-neutral-800 flex flex-col">
      <h3 className="text-white text-sm font-medium mb-2">{config.title}</h3>
      
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey={dataKey}
              nameKey={nameKey}
              cx="50%"
              cy="50%"
              innerRadius={config.type === 'donut-chart' ? '50%' : 0}
              outerRadius="70%"
              paddingAngle={2}
              label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
              labelLine={false}
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={(entry as { color?: string }).color || colors[index % colors.length]} 
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#404040',
                border: 'none',
                borderRadius: '4px',
                color: '#fff',
              }}
            />
            {showLegend && (
              <Legend 
                verticalAlign="bottom" 
                height={36}
                formatter={(value) => <span style={{ color: '#9ca3af', fontSize: 11 }}>{value}</span>}
              />
            )}
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

