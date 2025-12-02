"use client"

import { ChevronDown } from 'lucide-react'
import { useDashboard } from '../contexts/DashboardContext'

export function SpendingCard() {
  const { spendingConfig, setSelectedChart, selectedChart } = useDashboard()
  const { data, filterThreshold, title } = spendingConfig

  // Filtrer les données si un seuil est défini
  const filteredData = filterThreshold
    ? data.filter(item => item.percentage >= filterThreshold)
    : data

  return (
    <div className="bg-neutral-800 p-4 h-full relative overflow-hidden">
      {/* Bouton "Demandé à l&apos;IA" */}
      <div className="mb-3">
        <div 
          onClick={() => setSelectedChart(selectedChart === 'spending' ? null : 'spending')}
          className={`h-6 px-2.5 py-1 bg-neutral-900 outline outline-[0.50px] outline-offset-[-0.50px] ${selectedChart === 'spending' ? 'outline-blue-500' : 'outline-blue-800'} inline-flex justify-center items-center gap-2 whitespace-nowrap cursor-pointer ai-request-btn group w-fit`}
        >
          <img src="/star 1.svg" alt="Star" className="w-3 h-3 relative z-10 transition-all duration-300" />
          <div className="text-white text-[10px] font-light  relative z-10 transition-colors duration-300">Demandé à l&apos;IA</div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-2">
        <div className="text-white text-base font-normal ">{title}</div>
        <button className="px-2 py-1 bg-neutral-700 text-white text-xs  flex items-center gap-1.5">
          This month
          <ChevronDown className="w-3 h-3" />
        </button>
      </div>

      <div className="space-y-2">
        {filteredData.map((item) => (
          <div key={item.name} className="flex items-center gap-2">
            <div className={`w-2 h-2 flex-shrink-0 ${item.color}`} />
            <span className="text-xs text-white w-16 flex-shrink-0 ">{item.name}</span>
            <div className="flex-1 h-1.5 bg-neutral-700 overflow-hidden">
              <div className="h-full bg-white/80" style={{ width: `${item.percentage}%` }} />
            </div>
            <span className="text-xs text-neutral-400 w-8 text-right ">{item.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}
