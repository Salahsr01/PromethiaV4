"use client"

import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useDashboard } from '../contexts/DashboardContext'

const days = ["LUN", "MAR", "MER", "JEU", "VEN", "SAM", "DIM"]
const monthNames = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"]

export function TrackerCard() {
  const { trackerConfig, setSelectedChart, selectedChart } = useDashboard()
  const { trackedDays, markerColor, title } = trackerConfig
  const [currentDate, setCurrentDate] = useState(new Date())

  const calendar = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    // Premier jour du mois (0 = dimanche, 1 = lundi, etc.)
    const firstDay = new Date(year, month, 1).getDay()
    // Ajuster pour que lundi soit 0 (au lieu de dimanche)
    const firstDayAdjusted = firstDay === 0 ? 6 : firstDay - 1

    // Nombre de jours dans le mois
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    // Nombre de jours du mois précédent
    const daysInPrevMonth = new Date(year, month, 0).getDate()

    const calendarDays = []
    let week = []

    // Jours du mois précédent
    for (let i = firstDayAdjusted - 1; i >= 0; i--) {
      week.push({ day: daysInPrevMonth - i, isCurrentMonth: false })
    }

    // Jours du mois actuel
    for (let i = 1; i <= daysInMonth; i++) {
      week.push({ day: i, isCurrentMonth: true })
      if (week.length === 7) {
        calendarDays.push(week)
        week = []
      }
    }

    // Jours du mois suivant
    if (week.length > 0) {
      let nextDay = 1
      while (week.length < 7) {
        week.push({ day: nextDay++, isCurrentMonth: false })
      }
      calendarDays.push(week)
    }

    return calendarDays
  }, [currentDate])

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  return (
    <div className="bg-neutral-800 p-4 h-full relative overflow-hidden">
      {/* Bouton "Demandé à l&apos;IA" */}
      <div className="mb-3">
        <div 
          onClick={() => setSelectedChart(selectedChart === 'tracker' ? null : 'tracker')}
          className={`h-6 px-2.5 py-1 bg-neutral-900 outline outline-[0.50px] outline-offset-[-0.50px] ${selectedChart === 'tracker' ? 'outline-blue-500' : 'outline-blue-800'} inline-flex justify-center items-center gap-2 whitespace-nowrap cursor-pointer ai-request-btn group w-fit`}
        >
          <img src="/star 1.svg" alt="Star" className="w-3 h-3 relative z-10 transition-all duration-300" />
          <div className="text-white text-[10px] font-light  relative z-10 transition-colors duration-300">Demandé à l&apos;IA</div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-white text-lg font-normal ">{title}</div>
          <p className="text-sm text-neutral-400 ">165,5 h</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handlePrevMonth}
            className="w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-white px-2 ">
            {monthNames[currentDate.getMonth()]}
          </span>
          <button
            onClick={handleNextMonth}
            className="w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-white transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {days.map((day) => (
          <div key={day} className="text-center text-[10px] text-neutral-400 py-0.5 ">
            {day}
          </div>
        ))}
      </div>

      <div className="space-y-0">
        {calendar.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 gap-0.5">
            {week.map((dayObj, dayIndex) => {
              const isTracked = trackedDays.includes(dayObj.day) && dayObj.isCurrentMonth
              return (
                <div
                  key={dayIndex}
                  className={`text-center py-1 text-xs  ${
                    !dayObj.isCurrentMonth ? "text-neutral-600" : isTracked ? markerColor.replace('bg-', 'text-') : "text-white"
                  }`}
                >
                  {dayObj.day}
                  {isTracked && (
                    <div className="flex justify-center mt-0.5 gap-0.5">
                      <div className={`w-1 h-1 ${markerColor}`} />
                      <div className={`w-1 h-1 ${markerColor}`} />
                      <div className={`w-1 h-1 ${markerColor} opacity-50`} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
