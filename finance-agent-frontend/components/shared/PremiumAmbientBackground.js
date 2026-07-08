'use client';

import React, { useEffect, useRef } from 'react';

export default function PremiumAmbientBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    const resizeCanvas = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resizeCanvas);

    // 1. Ambient Orbs definition
    class AmbientOrb {
      constructor() {
        this.x = Math.random() * w;
        this.y = Math.random() * h;
        this.r = Math.random() * 100 + 150; // 300px to 500px diameter
        this.vx = (Math.random() - 0.5) * 0.2;
        this.vy = (Math.random() - 0.5) * 0.2;
        // Subtle color tones matching branding
        this.color = Math.random() > 0.5 ? '#6366f1' : '#818cf8';
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        // Bounce back from boundaries
        if (this.x - this.r < 0 || this.x + this.r > w) this.vx *= -1;
        if (this.y - this.r < 0 || this.y + this.r > h) this.vy *= -1;
      }

      draw(isDark) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        
        // Soft gradient orb fading to transparent
        const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.r);
        // Under dark mode we keep opacity around 0.07, light mode is slightly fainter 0.05
        const baseOpacity = isDark ? 0.07 : 0.05;
        grad.addColorStop(0, hexToRgba(this.color, baseOpacity));
        grad.addColorStop(0.5, hexToRgba(this.color, baseOpacity * 0.4));
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.restore();
      }
    }

    // Helper to convert hex to rgba
    const hexToRgba = (hex, alpha) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    // Initialize Orbs (3-4)
    const orbs = [];
    for (let i = 0; i < 4; i++) {
      orbs.push(new AmbientOrb());
    }

    let animationFrameId;

    const render = () => {
      const isDark = document.documentElement.classList.contains('dark');
      ctx.clearRect(0, 0, w, h);

      // Render Orbs first (background ambient layer)
      orbs.forEach((orb) => {
        orb.update();
        orb.draw(isDark);
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 1 }}
    />
  );
}
