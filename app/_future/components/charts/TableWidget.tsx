'use client'

import type { WidgetConfig } from '../../types/dashboard'

interface TableWidgetProps {
  config: WidgetConfig
  data?: Array<Record<string, unknown>>
}

export function TableWidget({ config, data }: TableWidgetProps) {
  const tableData = data || config.config.data || []
  const columns = config.config.columns || Object.keys(tableData[0] || {}).map(key => ({
    key,
    label: key.charAt(0).toUpperCase() + key.slice(1),
  }))

  // Fonction pour déterminer le style du statut
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'ok':
        return 'bg-green-500/20 text-green-400'
      case 'low':
        return 'bg-yellow-500/20 text-yellow-400'
      case 'critical':
        return 'bg-red-500/20 text-red-400'
      case 'overstock':
        return 'bg-blue-500/20 text-blue-400'
      default:
        return 'bg-neutral-500/20 text-neutral-400'
    }
  }

  return (
    <div className="w-full h-full p-4 bg-neutral-800 flex flex-col">
      <h3 className="text-white text-sm font-medium mb-3">{config.title}</h3>
      
      <div className="flex-1 overflow-auto" style={{ scrollbarWidth: 'thin' }}>
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-neutral-800">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="text-left text-neutral-400 font-medium py-2 px-2 border-b border-neutral-700"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableData.map((row, rowIndex) => (
              <tr 
                key={rowIndex} 
                className="hover:bg-neutral-700/50 transition-colors"
              >
                {columns.map((col) => {
                  const value = row[col.key]
                  const isStatus = col.key === 'status'
                  
                  return (
                    <td 
                      key={col.key} 
                      className="py-2 px-2 border-b border-neutral-700/50"
                    >
                      {isStatus ? (
                        <span className={`px-2 py-0.5 rounded text-xs ${getStatusStyle(value as string)}`}>
                          {value as string}
                        </span>
                      ) : (
                        <span className="text-white">
                          {typeof value === 'number' ? value.toLocaleString() : String(value)}
                        </span>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

