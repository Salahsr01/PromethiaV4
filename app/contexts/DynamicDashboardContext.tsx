'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'

interface DynamicDashboardWidget {
  type: string
  title: string
  description: string
  value?: string
  subValue?: string
  data?: any
  priority?: string
  gridSpan?: number
}

type SelectedWidget = string | null

interface DynamicDashboardContextType {
  widgets: DynamicDashboardWidget[]
  selectedWidget: SelectedWidget
  setSelectedWidget: (widget: SelectedWidget) => void
  setWidgets: (widgets: DynamicDashboardWidget[]) => void
}

const DynamicDashboardContext = createContext<DynamicDashboardContextType | undefined>(undefined)

export function DynamicDashboardProvider({ children }: { children: ReactNode }) {
  const [widgets, setWidgets] = useState<DynamicDashboardWidget[]>([])
  const [selectedWidget, setSelectedWidget] = useState<SelectedWidget>(null)

  return (
    <DynamicDashboardContext.Provider
      value={{
        widgets,
        selectedWidget,
        setSelectedWidget,
        setWidgets,
      }}
    >
      {children}
    </DynamicDashboardContext.Provider>
  )
}

export function useDynamicDashboard() {
  const context = useContext(DynamicDashboardContext)
  if (context === undefined) {
    throw new Error('useDynamicDashboard must be used within a DynamicDashboardProvider')
  }
  return context
}
