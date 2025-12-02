'use client'

import { BurnrateChart } from '../components/BurnrateChart'
import { MiniChat } from '../components/MiniChat'
import { TrackerCard } from '../components/TrackerCard'
import { SpendingCard } from '../components/SpendingCard'
import { DashboardProvider } from '../contexts/DashboardContext'
import { Sidebar } from '../components/ui/Sidebar'

export default function TableauDeBord() {
  return (
    <DashboardProvider>
      <div className="relative w-full min-h-screen bg-[#141414] overflow-x-hidden">
        {/* Sidebar avec les onglets */}
        <Sidebar currentPage="dashboard" />

        {/* Contenu principal - décalé pour la sidebar */}
        <main className="ml-16 sm:ml-20 lg:ml-64 min-h-screen p-4 sm:p-6 lg:p-8">
          {/* Chart Burnrate - pleine largeur */}
          <div className="w-full h-[350px] sm:h-[420px] lg:h-[500px] mb-6">
            <BurnrateChart />
          </div>

          {/* Bottom section - MiniChat à gauche, Tracker + Spending à droite */}
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Box Assistance IA - prend plus de place */}
            <div className="w-full lg:w-[45%] h-80 lg:h-96 bg-neutral-800 overflow-hidden">
              <MiniChat />
            </div>

            {/* Tracker et Spending côte à côte */}
            <div className="flex-1 flex flex-col sm:flex-row gap-6">
              {/* Box Tracker */}
              <div className="flex-1 h-80 lg:h-96 bg-neutral-800">
                <TrackerCard />
              </div>

              {/* Box Spending */}
              <div className="flex-1 h-80 lg:h-96 bg-neutral-800">
                <SpendingCard />
              </div>
            </div>
          </div>
        </main>
      </div>
    </DashboardProvider>
  )
}
