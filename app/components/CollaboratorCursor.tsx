'use client'

import React from 'react'
import type { CursorPosition } from '../contexts/CollaborationContext'

interface CollaboratorCursorProps {
  cursor: CursorPosition
}

export function CollaboratorCursor({ cursor }: CollaboratorCursorProps) {
  return (
    <div
      className="fixed pointer-events-none z-[9999] transition-all duration-100 ease-out"
      style={{
        left: `${cursor.x}px`,
        top: `${cursor.y}px`,
        transform: 'translate(-2px, -2px)'
      }}
    >
      {/* Curseur SVG avec la couleur du collaborateur */}
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M20.5736 3.13618C20.7416 3.30428 20.7902 3.50946 20.7352 3.66928L17.8129 12.1628C17.6806 12.5473 17.7318 12.9661 17.9171 13.3223L19.5371 17.3039C19.673 17.6386 19.4198 18.002 19.0586 17.991L12.3411 17.7866L12.2492 17.7831L12.1622 17.8135L3.66934 20.7351C3.50952 20.7901 3.30434 20.7416 3.13625 20.5735C2.96812 20.4054 2.91967 20.2003 2.97466 20.0405L5.89562 11.5469C6.03359 11.1458 5.97397 10.7068 5.76856 10.3412L0.578508 1.10187C0.441173 0.85744 0.508817 0.682665 0.595771 0.59571C0.682756 0.508799 0.857587 0.44116 1.10193 0.578447L10.3406 5.76919C10.7061 5.97454 11.1453 6.03407 11.5463 5.89625L20.0405 2.9746C20.2004 2.91961 20.4055 2.96807 20.5736 3.13618Z"
          fill={cursor.color}
        />
        <path
          d="M20.5736 3.13618C20.7416 3.30428 20.7902 3.50946 20.7352 3.66928L17.8129 12.1628C17.6806 12.5473 17.7318 12.9661 17.9171 13.3223L19.5371 17.3039C19.673 17.6386 19.4198 18.002 19.0586 17.991L12.3411 17.7866L12.2492 17.7831L12.1622 17.8135L3.66934 20.7351C3.50952 20.7901 3.30434 20.7416 3.13625 20.5735C2.96812 20.4054 2.91967 20.2003 2.97466 20.0405L5.89562 11.5469C6.03359 11.1458 5.97397 10.7068 5.76856 10.3412L0.578508 1.10187C0.441173 0.85744 0.508817 0.682665 0.595771 0.59571C0.682756 0.508799 0.857587 0.44116 1.10193 0.578447L10.3406 5.76919C10.7061 5.97454 11.1453 6.03407 11.5463 5.89625L20.0405 2.9746C20.2004 2.91961 20.4055 2.96807 20.5736 3.13618Z"
          fill="black"
          fillOpacity="0.2"
        />
        <path
          d="M20.5736 3.13618C20.7416 3.30428 20.7902 3.50946 20.7352 3.66928L17.8129 12.1628C17.6806 12.5473 17.7318 12.9661 17.9171 13.3223L19.5371 17.3039C19.673 17.6386 19.4198 18.002 19.0586 17.991L12.3411 17.7866L12.2492 17.7831L12.1622 17.8135L3.66934 20.7351C3.50952 20.7901 3.30434 20.7416 3.13625 20.5735C2.96812 20.4054 2.91967 20.2003 2.97466 20.0405L5.89562 11.5469C6.03359 11.1458 5.97397 10.7068 5.76856 10.3412L0.578508 1.10187C0.441173 0.85744 0.508817 0.682665 0.595771 0.59571C0.682756 0.508799 0.857587 0.44116 1.10193 0.578447L10.3406 5.76919C10.7061 5.97454 11.1453 6.03407 11.5463 5.89625L20.0405 2.9746C20.2004 2.91961 20.4055 2.96807 20.5736 3.13618Z"
          stroke="white"
        />
      </svg>

      {/* Label avec le nom du collaborateur */}
      <div
        className="absolute left-6 top-0 px-2 py-1 rounded text-xs font-medium text-white whitespace-nowrap"
        style={{
          backgroundColor: cursor.color,
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
        }}
      >
        {cursor.visitorName}
      </div>
    </div>
  )
}

interface CollaboratorCursorsProps {
  cursorPositions: CursorPosition[]
}

export function CollaboratorCursors({ cursorPositions }: CollaboratorCursorsProps) {
  return (
    <>
      {cursorPositions.map(cursor => (
        <CollaboratorCursor key={cursor.visitorId} cursor={cursor} />
      ))}
    </>
  )
}
