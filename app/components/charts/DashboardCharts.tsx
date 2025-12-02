'use client'

import { LineChart, Line, BarChart, Bar, PieChart, Pie, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts'

// Palette de couleurs moderne
const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#ef4444']

interface ChartData {
  [key: string]: string | number
}

interface DynamicLineChartProps {
  data: ChartData[]
  dataKey?: string
  xKey?: string
  color?: string
}

export function DynamicLineChart({ data, dataKey = 'value', xKey = 'month', color = '#3b82f6' }: DynamicLineChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
        <XAxis dataKey={xKey} tick={{ fill: '#999', fontSize: 11 }} />
        <YAxis tick={{ fill: '#999', fontSize: 11 }} />
        <Tooltip
          contentStyle={{ backgroundColor: '#262626', border: '1px solid #404040', borderRadius: '4px' }}
          labelStyle={{ color: '#fff' }}
          itemStyle={{ color: color }}
        />
        <Line
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          strokeWidth={2}
          dot={{ fill: color, r: 3 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

interface DynamicBarChartProps {
  data: ChartData[]
  dataKey?: string
  xKey?: string
  colors?: string[]
}

export function DynamicBarChart({ data, dataKey = 'value', xKey = 'name', colors = COLORS }: DynamicBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
        <XAxis
          dataKey={xKey}
          tick={{ fill: '#999', fontSize: 11 }}
          angle={-15}
          textAnchor="end"
          height={60}
        />
        <YAxis tick={{ fill: '#999', fontSize: 11 }} />
        <Tooltip
          contentStyle={{ backgroundColor: '#262626', border: '1px solid #404040', borderRadius: '4px' }}
          labelStyle={{ color: '#fff' }}
        />
        <Bar dataKey={dataKey} radius={[4, 4, 0, 0]}>
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

interface DynamicPieChartProps {
  data: ChartData[]
  nameKey?: string
  valueKey?: string
  colors?: string[]
}

export function DynamicPieChart({ data, nameKey = 'name', valueKey = 'value', colors = COLORS }: DynamicPieChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          dataKey={valueKey}
          nameKey={nameKey}
          cx="50%"
          cy="50%"
          outerRadius={60}
          label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
          labelLine={{ stroke: '#999' }}
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ backgroundColor: '#262626', border: '1px solid #404040', borderRadius: '4px' }}
          labelStyle={{ color: '#fff' }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}

interface DynamicAreaChartProps {
  data: ChartData[]
  dataKeys: string[]
  xKey?: string
  colors?: string[]
}

export function DynamicAreaChart({ data, dataKeys, xKey = 'month', colors = COLORS }: DynamicAreaChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
        <XAxis dataKey={xKey} tick={{ fill: '#999', fontSize: 11 }} />
        <YAxis tick={{ fill: '#999', fontSize: 11 }} />
        <Tooltip
          contentStyle={{ backgroundColor: '#262626', border: '1px solid #404040', borderRadius: '4px' }}
          labelStyle={{ color: '#fff' }}
        />
        <Legend wrapperStyle={{ fontSize: '11px', color: '#999' }} />
        {dataKeys.map((key, index) => (
          <Area
            key={key}
            type="monotone"
            dataKey={key}
            stackId="1"
            stroke={colors[index % colors.length]}
            fill={colors[index % colors.length]}
            fillOpacity={0.6}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  )
}
