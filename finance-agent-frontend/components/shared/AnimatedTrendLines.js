'use client';

import React, { useEffect, useState } from 'react';

const LINE_1_PATH = "M 0 150 C 100 120, 200 180, 350 100 C 500 220, 650 140, 800 160 C 950 90, 1100 240, 1250 110, 1400 150 C 1500 120, 1600 180, 1750 100 C 1900 220, 2050 140, 2200 160 C 2350 90, 2500 240, 2650 110, 2800 150";
const LINE_2_PATH = "M 0 120 C 150 200, 300 80, 500 180 C 700 90, 900 220, 1100 100 C 1250 160, 1450 60, 1600 120 C 1750 200, 1900 80, 2100 180 C 2300 90, 2500 220, 2700 100 C 2850 160, 3050 60, 3200 120";

export default function AnimatedTrendLines() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Only mount animations if prefers-reduced-motion is not set
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = window.innerWidth < 768;
    
    if (!prefersReducedMotion && !isMobile) {
      setMounted(true);
    }
  }, []);

  if (!mounted) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none" style={{ zIndex: -1 }}>
      {/* Glow filter definition */}
      <svg className="absolute w-0 h-0">
        <defs>
          <filter id="glow-filter" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>

      {/* Chart Line 1 */}
      <div 
        className="absolute w-[2800px] h-[300px]" 
        style={{
          top: '12%',
          left: 0,
          animation: 'scrollTrendLine1 28s linear infinite',
          willChange: 'transform',
        }}
      >
        <svg width="2800" height="300" viewBox="0 0 2800 300" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path 
            d={LINE_1_PATH} 
            stroke="#6366f1" 
            strokeWidth="1.5" 
            strokeOpacity="0.22" 
            fill="none"
            filter="url(#glow-filter)"
          />
          {/* Animated dot on the line */}
          <circle r="4" fill="#818cf8" style={{
            offsetPath: `path('${LINE_1_PATH}')`,
            animation: 'moveDot 12s linear infinite, pulseDot 2s ease-in-out infinite',
            filter: 'drop-shadow(0 0 6px #818cf8)',
            willChange: 'transform, opacity',
          }} />
        </svg>
      </div>

      {/* Chart Line 2 */}
      <div 
        className="absolute w-[3200px] h-[300px]" 
        style={{
          top: '38%',
          left: 0,
          animation: 'scrollTrendLine2 40s linear infinite',
          willChange: 'transform',
        }}
      >
        <svg width="3200" height="300" viewBox="0 0 3200 300" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path 
            d={LINE_2_PATH} 
            stroke="#6366f1" 
            strokeWidth="1.5" 
            strokeOpacity="0.16" 
            fill="none"
            filter="url(#glow-filter)"
          />
          {/* Animated dot on the line */}
          <circle r="4" fill="#818cf8" style={{
            offsetPath: `path('${LINE_2_PATH}')`,
            animation: 'moveDot 18s linear infinite, pulseDot 2s ease-in-out infinite',
            filter: 'drop-shadow(0 0 6px #818cf8)',
            willChange: 'transform, opacity',
          }} />
        </svg>
      </div>

      <style jsx global>{`
        @keyframes scrollTrendLine1 {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-1400px, 0, 0); }
        }
        @keyframes scrollTrendLine2 {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-1600px, 0, 0); }
        }
        @keyframes moveDot {
          0% { offset-distance: 0%; }
          100% { offset-distance: 100%; }
        }
        @keyframes pulseDot {
          0%, 100% { transform: scale(0.85); opacity: 0.7; }
          50% { transform: scale(1.2); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
