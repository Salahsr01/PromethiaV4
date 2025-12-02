'use client'

import React, { useState, useEffect } from 'react';

export default function IALoadingAnimation() {
  const statusMessages = [
    "Analyse de la question...",
    "Récolte des informations...",
    "En plein raisonnement...",
    "Vérification des données...",
    "Formulation de la réponse...",
  ];

  const [currentStatusIndex, setCurrentStatusIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStatusIndex((prevIndex) =>
        (prevIndex + 1) % statusMessages.length
      );
    }, 2500); // Change le statut toutes les 2.5 secondes

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="inline-flex justify-start items-start gap-1.5">
      <div className="w-5 h-5 relative flex-shrink-0">
        <svg width="15" height="22" viewBox="0 0 15 22" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <defs>
            <linearGradient id="loadingGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF">
                <animate
                  attributeName="stop-color"
                  values="#FFFFFF; #5265B9; #1438BB; #5265B9; #FFFFFF"
                  dur="2s"
                  repeatCount="indefinite"
                />
              </stop>
              <stop offset="50%" stopColor="#5265B9">
                <animate
                  attributeName="stop-color"
                  values="#5265B9; #1438BB; #5265B9; #FFFFFF; #5265B9"
                  dur="2s"
                  repeatCount="indefinite"
                />
              </stop>
              <stop offset="100%" stopColor="#1438BB">
                <animate
                  attributeName="stop-color"
                  values="#1438BB; #5265B9; #FFFFFF; #5265B9; #1438BB"
                  dur="2s"
                  repeatCount="indefinite"
                />
              </stop>
            </linearGradient>
          </defs>
          <path d="M7.1518 0.564594C7.31162 0.305461 7.68838 0.305461 7.8482 0.564594L9.43493 3.13744C9.49295 3.23151 9.58656 3.29811 9.69446 3.32206L13.2012 4.10063C13.6284 4.19549 13.6284 4.80451 13.2012 4.89937L9.69446 5.67794C9.58656 5.70189 9.49295 5.76849 9.43493 5.86256L7.8482 8.43541C7.68838 8.69454 7.31162 8.69454 7.1518 8.43541L5.56507 5.86256C5.50705 5.76849 5.41344 5.70189 5.30554 5.67794L1.79879 4.89937C1.37155 4.80451 1.37155 4.19549 1.79879 4.10063L5.30554 3.32206C5.41344 3.29811 5.50705 3.23151 5.56507 3.13744L7.1518 0.564594Z" fill="url(#loadingGradient)"/>
          <path d="M7.12377 9.88119C7.26521 9.54991 7.73479 9.54991 7.87623 9.88119L9.45231 13.5726C9.49891 13.6817 9.59061 13.7652 9.70361 13.8015L13.7853 15.1105C14.1642 15.232 14.1642 15.768 13.7853 15.8895L9.70361 17.1985C9.59061 17.2348 9.49891 17.3183 9.45231 17.4274L7.87623 21.1188C7.73479 21.4501 7.26521 21.4501 7.12377 21.1188L5.54769 17.4274C5.50109 17.3183 5.40939 17.2348 5.29639 17.1985L1.2147 15.8895C0.835817 15.768 0.835816 15.232 1.2147 15.1105L5.29639 13.8015C5.40939 13.7652 5.50109 13.6817 5.54769 13.5726L7.12377 9.88119Z" fill="url(#loadingGradient)"/>
        </svg>
      </div>

      {/* Texte avec animation gradient */}
      <div className="p-[5px] inline-flex flex-col justify-start items-start">
        <div
          className="text-xs font-normal  transition-opacity duration-300"
          style={{
            backgroundImage: 'linear-gradient(to bottom, #FFFFFF, #5265B9, #1438BB)',
            backgroundSize: '100% 200%',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            animation: 'gradientShift 2s ease-in-out infinite'
          }}
        >
          {statusMessages[currentStatusIndex]}
        </div>
        <style jsx>{`
          @keyframes gradientShift {
            0%, 100% { background-position: 0% 0%; }
            50% { background-position: 0% 100%; }
          }
        `}</style>
      </div>
    </div>
  );
}
