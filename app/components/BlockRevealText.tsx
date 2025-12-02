'use client'

import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

interface BlockRevealTextProps {
  text: string;
  delay?: number;
}

export default function BlockRevealText({ text, delay = 0 }: BlockRevealTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const phraseElements = containerRef.current.querySelectorAll('.phrase');

    // Animation GSAP pour révéler le texte phrase par phrase
    gsap.fromTo(
      phraseElements,
      {
        opacity: 0,
      },
      {
        opacity: 1,
        duration: 0.01,
        stagger: 0.08,
        delay: delay,
        ease: 'power2.out',
      }
    );

    // Animation des blocs révélateurs - très rapide
    const blocks = containerRef.current.querySelectorAll('.reveal-block');
    gsap.fromTo(
      blocks,
      {
        width: '100%',
      },
      {
        width: '0%',
        duration: 0.2,
        stagger: 0.08,
        delay: delay,
        ease: 'power2.inOut',
      }
    );
  }, [text, delay]);

  // Découper le texte en phrases (basé sur . ! ? et retours à la ligne)
  const phrases = text.split(/([.!?]\s+|\n+)/).filter(phrase => phrase.trim().length > 0);

  return (
    <div ref={containerRef} className="inline">
      {phrases.map((phrase, index) => (
        <span key={index} className="inline-block relative overflow-hidden">
          <span className="phrase opacity-0">{phrase}</span>
          <span
            className="reveal-block absolute top-0 left-0 h-full bg-[#1438BB]"
            style={{ width: '100%' }}
          />
        </span>
      ))}
    </div>
  );
}
