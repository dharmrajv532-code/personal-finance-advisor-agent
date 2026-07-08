'use client';

import React, { useEffect, useRef } from 'react';

const SHAPE_DEFS = [
  // Left side shapes
  { id: 1, type: 'rect', w: 100, h: 60, top: 15, left: 10, rx: 16, color: '#6366f1', speedX: 0.0008, speedY: 0.0006, ampX: 20, ampY: 15, rotSpeed: 0.0004, opacity: 0.22, parallax: 12 },
  { id: 2, type: 'diamond', w: 80, h: 80, top: 45, left: 5, rx: 12, color: '#818cf8', speedX: 0.0005, speedY: 0.0007, ampX: 15, ampY: 25, rotSpeed: -0.0003, opacity: 0.28, parallax: 8 },
  { id: 3, type: 'rect', w: 130, h: 130, top: 75, left: 8, rx: 24, color: '#6366f1', speedX: 0.0004, speedY: 0.0003, ampX: 25, ampY: 20, rotSpeed: 0.0002, opacity: 0.18, parallax: 15 },
  // Right side shapes
  { id: 4, type: 'diamond', w: 50, h: 50, top: 25, left: 85, rx: 8, color: '#818cf8', speedX: 0.0007, speedY: 0.0009, ampX: 18, ampY: 18, rotSpeed: -0.0005, opacity: 0.35, parallax: 10 },
  { id: 5, type: 'rect', w: 80, h: 120, top: 60, left: 88, rx: 20, color: '#6366f1', speedX: 0.0006, speedY: 0.0005, ampX: 22, ampY: 15, rotSpeed: 0.0003, opacity: 0.20, parallax: 14 },
  { id: 6, type: 'diamond', w: 110, h: 110, top: 80, left: 78, rx: 20, color: '#818cf8', speedX: 0.0003, speedY: 0.0004, ampX: 30, ampY: 25, rotSpeed: 0.0001, opacity: 0.16, parallax: 15 },
  // Center-top and Center-bottom shapes
  { id: 7, type: 'rect', w: 60, h: 60, top: 5, left: 55, rx: 12, color: '#6366f1', speedX: 0.0009, speedY: 0.0008, ampX: 15, ampY: 15, rotSpeed: 0.0006, opacity: 0.30, parallax: 9 },
  { id: 8, type: 'diamond', w: 70, h: 70, top: 90, left: 40, rx: 14, color: '#818cf8', speedX: 0.0004, speedY: 0.0005, ampX: 20, ampY: 20, rotSpeed: -0.0002, opacity: 0.25, parallax: 11 },
];

export default function FloatingGeometry() {
  const containerRef = useRef(null);
  const elementsRef = useRef([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Check media queries for performance / accessibility
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = window.innerWidth < 768;

    if (prefersReducedMotion || isMobile) {
      // Static display for reduced motion, hidden or extremely simplified for mobile to keep battery and rendering cost zero
      if (isMobile) {
        container.style.display = 'none';
      }
      return;
    }

    const mouse = { targetX: 0, targetY: 0, currentX: 0, currentY: 0 };

    const handleMouseMove = (e) => {
      mouse.targetX = (e.clientX - window.innerWidth / 2) / (window.innerWidth / 2);
      mouse.targetY = (e.clientY - window.innerHeight / 2) / (window.innerHeight / 2);
    };

    window.addEventListener('mousemove', handleMouseMove);

    let animId;
    let startTime = Date.now();

    const update = () => {
      const elapsed = Date.now() - startTime;

      // Lerp mouse offsets for smooth movement
      mouse.currentX += (mouse.targetX - mouse.currentX) * 0.06;
      mouse.currentY += (mouse.targetY - mouse.currentY) * 0.06;

      SHAPE_DEFS.forEach((def, index) => {
        const el = elementsRef.current[index];
        if (!el) return;

        // Base floating offsets using sine/cosine curves
        const floatX = Math.sin(elapsed * def.speedX) * def.ampX;
        const floatY = Math.cos(elapsed * def.speedY) * def.ampY;

        // Parallax offset relative to mouse position
        const pX = mouse.currentX * def.parallax;
        const pY = mouse.currentY * def.parallax;

        // Subtle continuous rotation
        const rot = elapsed * def.rotSpeed;

        // Apply 3D transform (translate3d triggers GPU acceleration)
        if (def.type === 'diamond') {
          // Diamond is already rotated 45 degrees, add rotation to it
          el.style.transform = `translate3d(${floatX + pX}px, ${floatY + pY}px, 0) rotate(${45 + rot}deg)`;
        } else {
          el.style.transform = `translate3d(${floatX + pX}px, ${floatY + pY}px, 0) rotate(${rot}deg)`;
        }
      });

      animId = requestAnimationFrame(update);
    };

    animId = requestAnimationFrame(update);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none select-none overflow-hidden"
      style={{ zIndex: 0 }} // Put behind hero text/cards, but on top of dot grid
    >
      {SHAPE_DEFS.map((def, index) => {
        const isDiamond = def.type === 'diamond';
        return (
          <div
            key={def.id}
            ref={(el) => (elementsRef.current[index] = el)}
            className="absolute backdrop-blur-[2px] transition-opacity duration-500"
            style={{
              width: `${def.w}px`,
              height: `${def.h}px`,
              top: `${def.top}%`,
              left: `${def.left}%`,
              borderRadius: `${def.rx}px`,
              opacity: def.opacity,
              border: `1px solid rgba(255, 255, 255, 0.12)`,
              background: `linear-gradient(135deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.01) 100%)`,
              boxShadow: `0 0 25px ${def.color}1e, inset 0 0 10px rgba(255,255,255,0.03)`,
              willChange: 'transform',
            }}
          />
        );
      })}
    </div>
  );
}
