'use client'

import { useState, useMemo } from 'react'
import { Sidebar } from '../components/ui/Sidebar'
import { ChevronLeft, ChevronRight, Plus, Clock, Users, MapPin, MoreVertical } from 'lucide-react'

interface Event {
  id: string
  title: string
  date: Date
  time: string
  duration: string
  type: 'meeting' | 'task' | 'reminder' | 'deadline'
  participants?: string[]
  location?: string
  color: string
}

const MOCK_EVENTS: Event[] = [
  { id: '1', title: 'Réunion équipe produit', date: new Date(2025, 10, 29), time: '09:00', duration: '1h', type: 'meeting', participants: ['Elio', 'Zaki', 'Sarah'], location: 'Salle A', color: 'bg-blue-500' },
  { id: '2', title: 'Review sprint #23', date: new Date(2025, 10, 29), time: '14:00', duration: '2h', type: 'meeting', participants: ['Équipe Dev'], color: 'bg-purple-500' },
  { id: '3', title: 'Inventaire mensuel', date: new Date(2025, 10, 30), time: '10:00', duration: '3h', type: 'task', color: 'bg-green-500' },
  { id: '4', title: 'Deadline commande fournisseur', date: new Date(2025, 11, 2), time: '18:00', duration: '-', type: 'deadline', color: 'bg-red-500' },
  { id: '5', title: 'Formation IA Dashboard', date: new Date(2025, 11, 3), time: '11:00', duration: '1h30', type: 'meeting', participants: ['Salah'], location: 'Visio', color: 'bg-cyan-500' },
  { id: '6', title: 'Mise à jour stock PS5', date: new Date(2025, 11, 4), time: '09:00', duration: '30min', type: 'reminder', color: 'bg-yellow-500' },
  { id: '7', title: 'Call fournisseur Apple', date: new Date(2025, 11, 5), time: '15:00', duration: '45min', type: 'meeting', participants: ['Apple France'], location: 'Téléphone', color: 'bg-blue-500' },
  { id: '8', title: 'Analyse ventes Q4', date: new Date(2025, 11, 6), time: '10:00', duration: '2h', type: 'task', color: 'bg-purple-500' },
]

const DAYS = ['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM']
const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']

export default function Calendrier() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date())
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month')

  const calendar = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const firstDayAdjusted = firstDay === 0 ? 6 : firstDay - 1
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const daysInPrevMonth = new Date(year, month, 0).getDate()

    const weeks: Array<Array<{ day: number; isCurrentMonth: boolean; date: Date }>> = []
    let week: Array<{ day: number; isCurrentMonth: boolean; date: Date }> = []

    // Jours du mois précédent
    for (let i = firstDayAdjusted - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i
      week.push({ day, isCurrentMonth: false, date: new Date(year, month - 1, day) })
    }

    // Jours du mois actuel
    for (let i = 1; i <= daysInMonth; i++) {
      week.push({ day: i, isCurrentMonth: true, date: new Date(year, month, i) })
      if (week.length === 7) {
        weeks.push(week)
        week = []
      }
    }

    // Jours du mois suivant
    if (week.length > 0) {
      let nextDay = 1
      while (week.length < 7) {
        week.push({ day: nextDay++, isCurrentMonth: false, date: new Date(year, month + 1, nextDay - 1) })
      }
      weeks.push(week)
    }

    return weeks
  }, [currentDate])

  const getEventsForDate = (date: Date) => {
    return MOCK_EVENTS.filter(e => 
      e.date.getDate() === date.getDate() &&
      e.date.getMonth() === date.getMonth() &&
      e.date.getFullYear() === date.getFullYear()
    )
  }

  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : []

  const isToday = (date: Date) => {
    const today = new Date()
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear()
  }

  const isSelected = (date: Date) => {
    if (!selectedDate) return false
    return date.getDate() === selectedDate.getDate() &&
           date.getMonth() === selectedDate.getMonth() &&
           date.getFullYear() === selectedDate.getFullYear()
  }

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const getTypeIcon = (type: Event['type']) => {
    switch (type) {
      case 'meeting': return <Users className="w-3 h-3" />
      case 'task': return <Clock className="w-3 h-3" />
      case 'deadline': return <Clock className="w-3 h-3" />
      default: return <Clock className="w-3 h-3" />
    }
  }

  return (
    <div className="relative w-full min-h-screen bg-[#141414] overflow-x-hidden">
      <Sidebar currentPage="calendar" />

      <main className="ml-16 sm:ml-20 lg:ml-64 min-h-screen flex">
        {/* Calendrier principal */}
        <div className="flex-1 p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-white text-xl font-light ">Calendrier</h1>
              <p className="text-neutral-500 text-xs mt-1">Planifiez vos tâches et événements</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-neutral-800">
                <button
                  onClick={() => setViewMode('month')}
                  className={`px-4 py-2 text-xs  transition-colors ${
                    viewMode === 'month' ? 'bg-blue-800 text-white' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Mois
                </button>
                <button
                  onClick={() => setViewMode('week')}
                  className={`px-4 py-2 text-xs  transition-colors ${
                    viewMode === 'week' ? 'bg-blue-800 text-white' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Semaine
                </button>
              </div>
              <button className="h-9 px-4 bg-blue-800 text-white text-xs  flex items-center gap-2 hover:bg-blue-700 transition-colors">
                <Plus className="w-3.5 h-3.5" />
                Nouvel événement
              </button>
            </div>
          </div>

          {/* Navigation mois */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={handlePrevMonth}
              className="w-10 h-10 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-white text-lg font-light ">
              {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <button
              onClick={handleNextMonth}
              className="w-10 h-10 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Grille calendrier */}
          <div className="bg-neutral-800">
            {/* Jours de la semaine */}
            <div className="grid grid-cols-7 border-b border-neutral-700">
              {DAYS.map(day => (
                <div key={day} className="py-3 text-center text-neutral-500 text-[10px] uppercase tracking-wider ">
                  {day}
                </div>
              ))}
            </div>

            {/* Semaines */}
            <div className="divide-y divide-neutral-700">
              {calendar.map((week, weekIndex) => (
                <div key={weekIndex} className="grid grid-cols-7">
                  {week.map((dayObj, dayIndex) => {
                    const events = getEventsForDate(dayObj.date)
                    const today = isToday(dayObj.date)
                    const selected = isSelected(dayObj.date)

                    return (
                      <div
                        key={dayIndex}
                        onClick={() => setSelectedDate(dayObj.date)}
                        className={`min-h-[100px] p-2 cursor-pointer transition-colors ${
                          !dayObj.isCurrentMonth ? 'bg-neutral-900/50' : 'hover:bg-neutral-700/30'
                        } ${selected ? 'bg-blue-900/20 ring-1 ring-blue-500' : ''}`}
                      >
                        <div className={`text-sm  mb-1 ${
                          !dayObj.isCurrentMonth ? 'text-neutral-600' :
                          today ? 'w-7 h-7 flex items-center justify-center bg-blue-500 text-white rounded-full' :
                          'text-white'
                        }`}>
                          {dayObj.day}
                        </div>
                        <div className="space-y-1">
                          {events.slice(0, 2).map(event => (
                            <div
                              key={event.id}
                              className={`px-1.5 py-0.5 text-[9px] text-white truncate ${event.color}`}
                            >
                              {event.time} {event.title}
                            </div>
                          ))}
                          {events.length > 2 && (
                            <div className="text-[9px] text-neutral-500 pl-1.5">
                              +{events.length - 2} autres
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar événements */}
        <div className="w-80 border-l border-neutral-800 p-6">
          <div className="mb-6">
            <h3 className="text-white text-sm font-medium ">
              {selectedDate ? (
                <>
                  {selectedDate.getDate()} {MONTHS[selectedDate.getMonth()]}
                </>
              ) : (
                'Sélectionnez une date'
              )}
            </h3>
            <p className="text-neutral-500 text-xs mt-1">
              {selectedDateEvents.length} événement{selectedDateEvents.length !== 1 ? 's' : ''}
            </p>
          </div>

          {selectedDateEvents.length > 0 ? (
            <div className="space-y-3">
              {selectedDateEvents.map(event => (
                <div key={event.id} className="bg-neutral-800 p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className={`w-1 h-full min-h-[40px] ${event.color} mr-3`} />
                    <div className="flex-1">
                      <h4 className="text-white text-sm ">{event.title}</h4>
                      <div className="flex items-center gap-2 mt-1 text-neutral-500 text-xs">
                        <Clock className="w-3 h-3" />
                        <span>{event.time}</span>
                        <span>•</span>
                        <span>{event.duration}</span>
                      </div>
                    </div>
                    <button className="p-1 text-neutral-500 hover:text-white transition-colors">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {event.participants && (
                    <div className="flex items-center gap-2 mt-3 text-neutral-400 text-xs">
                      <Users className="w-3 h-3" />
                      <span>{event.participants.join(', ')}</span>
                    </div>
                  )}
                  
                  {event.location && (
                    <div className="flex items-center gap-2 mt-2 text-neutral-400 text-xs">
                      <MapPin className="w-3 h-3" />
                      <span>{event.location}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-12 h-12 mx-auto mb-4 bg-neutral-800 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-neutral-600" />
              </div>
              <p className="text-neutral-500 text-sm">Aucun événement</p>
              <button className="mt-4 text-blue-400 text-xs hover:text-blue-300 transition-colors flex items-center gap-1 mx-auto">
                <Plus className="w-3 h-3" />
                Ajouter un événement
              </button>
            </div>
          )}

          {/* Mini IA Assistant */}
          <div className="mt-6 p-4 bg-blue-900/20 border border-blue-800">
            <div className="flex items-center gap-2 mb-3">
              <img src="/IA.svg" alt="IA" className="w-4 h-4" />
              <span className="text-blue-400 text-xs font-medium">Assistant IA</span>
            </div>
            <p className="text-white text-xs mb-3">
              Besoin d&apos;aide pour planifier vos tâches ou analyser votre emploi du temps ?
            </p>
            <button className="w-full h-9 bg-blue-800 text-white text-xs  hover:bg-blue-700 transition-colors">
              Demander à l&apos;IA
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}


