'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'

// Types pour les configurations des graphiques
export interface ReferenceLine {
  value: number
  label: string
  color: string
  strokeDasharray?: string
}

export interface TrendLine {
  startValue: number
  endValue: number
  color: string
  label?: string
}

export interface FillGradient {
  from: string
  to: string
  direction: 'vertical' | 'horizontal'
}

export interface BurnrateConfig {
  data: Array<{ month: string; value: number }>
  strokeColor: string
  strokeWidth?: number
  strokeStyle?: 'solid' | 'dashed' | 'dotted'
  fillPattern: string
  fillOpacity?: number
  fillGradient?: FillGradient | null
  showMarkers?: Array<{ index: number; color: string; label: string }>
  referenceLines?: Array<ReferenceLine>
  trendLine?: TrendLine | null
  showMovingAverage?: boolean
  movingAverageColor?: string
  showAllPoints?: boolean
  pointsColor?: string
  pointsSize?: number
  animated?: boolean
  animationDuration?: number
  title: string
}

export interface SpendingConfig {
  data: Array<{ name: string; percentage: number; color: string }>
  filterThreshold?: number
  title: string
}

export interface TrackerConfig {
  trackedDays: number[]
  markerColor: string
  title: string
}

export type ChartType = 'burnrate' | 'spending' | 'tracker' | null

interface DashboardContextType {
  burnrateConfig: BurnrateConfig
  spendingConfig: SpendingConfig
  trackerConfig: TrackerConfig
  selectedChart: ChartType
  updateBurnrateConfig: (config: Partial<BurnrateConfig>) => void
  updateSpendingConfig: (config: Partial<SpendingConfig>) => void
  updateTrackerConfig: (config: Partial<TrackerConfig>) => void
  setSelectedChart: (chart: ChartType) => void
  resetConfigs: () => void
}

// Configurations par défaut
const defaultBurnrateConfig: BurnrateConfig = {
  data: [
    { month: "Oct", value: 5000 },
    { month: "Nov", value: 8000 },
    { month: "Dec", value: 7500 },
    { month: "Jan", value: 9000 },
    { month: "Feb", value: 15000 },
    { month: "Mar", value: 22000 },
    { month: "Apr", value: 24345 },
    { month: "May", value: 28000 },
    { month: "Jun", value: 32000 },
    { month: "Jul", value: 30000 },
    { month: "Aug", value: 28000 },
    { month: "Sep", value: 25000 },
    { month: "Oct2", value: 22000 },
  ],
  strokeColor: "#fff",
  strokeWidth: 2,
  strokeStyle: "solid",
  fillPattern: "url(#hatchPattern)",
  fillOpacity: 1,
  fillGradient: null,
  trendLine: null,
  showMovingAverage: false,
  movingAverageColor: "#f59e0b",
  showAllPoints: false,
  pointsColor: "#3b82f6",
  pointsSize: 4,
  animated: false,
  animationDuration: 1000,
  title: "Burnrate",
}

const defaultSpendingConfig: SpendingConfig = {
  data: [
    { name: "Equipment", percentage: 35, color: "bg-yellow-500" },
    { name: "Rent", percentage: 24, color: "bg-purple-500" },
    { name: "Travel", percentage: 22, color: "bg-cyan-500" },
    { name: "Salary", percentage: 20, color: "bg-green-500" },
    { name: "Furniture", percentage: 15, color: "bg-lime-500" },
    { name: "Software", percentage: 4, color: "bg-blue-500" },
    { name: "Transfer", percentage: 5, color: "bg-pink-500" },
    { name: "Meals", percentage: 4, color: "bg-orange-500" },
    { name: "Other", percentage: 2, color: "bg-gray-500" },
  ],
  title: "Spending",
}

const defaultTrackerConfig: TrackerConfig = {
  trackedDays: [1, 8, 11, 15, 17, 21, 23],
  markerColor: "bg-blue-400",
  title: "Tracker",
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined)

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [burnrateConfig, setBurnrateConfig] = useState<BurnrateConfig>(defaultBurnrateConfig)
  const [spendingConfig, setSpendingConfig] = useState<SpendingConfig>(defaultSpendingConfig)
  const [trackerConfig, setTrackerConfig] = useState<TrackerConfig>(defaultTrackerConfig)
  const [selectedChart, setSelectedChart] = useState<ChartType>(null)

  const updateBurnrateConfig = (config: Partial<BurnrateConfig>) => {
    setBurnrateConfig(prev => ({ ...prev, ...config }))
  }

  const updateSpendingConfig = (config: Partial<SpendingConfig>) => {
    setSpendingConfig(prev => ({ ...prev, ...config }))
  }

  const updateTrackerConfig = (config: Partial<TrackerConfig>) => {
    setTrackerConfig(prev => ({ ...prev, ...config }))
  }

  const resetConfigs = () => {
    setBurnrateConfig(defaultBurnrateConfig)
    setSpendingConfig(defaultSpendingConfig)
    setTrackerConfig(defaultTrackerConfig)
  }

  return (
    <DashboardContext.Provider
      value={{
        burnrateConfig,
        spendingConfig,
        trackerConfig,
        selectedChart,
        updateBurnrateConfig,
        updateSpendingConfig,
        updateTrackerConfig,
        setSelectedChart,
        resetConfigs,
      }}
    >
      {children}
    </DashboardContext.Provider>
  )
}

export function useDashboard() {
  const context = useContext(DashboardContext)
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider')
  }
  return context
}
