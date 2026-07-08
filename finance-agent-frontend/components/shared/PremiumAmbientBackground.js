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

    // Track size to update canvas dimension properly
    const resizeCanvas = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resizeCanvas);

    // Detect media query states
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = window.innerWidth < 768;

    // 1. Ambient Orbs definition
    class AmbientOrb {
      constructor() {
        this.x = Math.random() * w;
        this.y = Math.random() * h;
        this.r = Math.random() * 100 + 175; // 350px to 550px diameter
        this.vx = (Math.random() - 0.5) * (isMobile ? 0.05 : 0.15); // slower on mobile
        this.vy = (Math.random() - 0.5) * (isMobile ? 0.05 : 0.15);
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
        const baseOpacity = isDark ? 0.06 : 0.04;
        grad.addColorStop(0, hexToRgba(this.color, baseOpacity));
        grad.addColorStop(0.5, hexToRgba(this.color, baseOpacity * 0.4));
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.restore();
      }
    }

    // 2. Neural network particles definition
    class Particle {
      constructor() {
        this.x = Math.random() * w;
        this.y = Math.random() * h;
        this.r = Math.random() * 1.0 + 1.0; // 1-2px size
        this.vx = (Math.random() - 0.5) * 0.22;
        this.vy = (Math.random() - 0.5) * 0.22;
        this.baseOpacity = Math.random() * 0.15 + 0.15; // 0.15 to 0.3 opacity
        this.opacity = this.baseOpacity;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        // Wrap around boundaries
        if (this.x < 0) this.x = w;
        if (this.x > w) this.x = 0;
        if (this.y < 0) this.y = h;
        if (this.y > h) this.y = 0;
      }

      draw(colorStr) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${colorStr}, ${this.opacity})`;
        ctx.fill();
      }
    }

    // Helper to convert hex to rgba
    const hexToRgba = (hex, alpha) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    // Initialize Orbs
    const orbs = [];
    const orbCount = isMobile ? 2 : 3;
    for (let i = 0; i < orbCount; i++) {
      orbs.push(new AmbientOrb());
    }

    // Initialize Particles (30-40, throttle on mobile or when prefers-reduced-motion)
    const particles = [];
    const particleCount = prefersReducedMotion ? 0 : isMobile ? 25 : 80;
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    let animationFrameId;

    const render = () => {
      const isDark = document.documentElement.classList.contains('dark');
      ctx.clearRect(0, 0, w, h);

      // 1. Render Orbs (background ambient layer)
      orbs.forEach((orb) => {
        if (!prefersReducedMotion) {
          orb.update();
        }
        orb.draw(isDark);
      });

      // 2. Render neural network particles
      const particleColor = isDark ? '129, 140, 248' : '99, 102, 241';
      
      particles.forEach((p) => {
        p.update();
        p.draw(particleColor);
      });

      // Draw neural net connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.hypot(dx, dy);

          if (dist < 100) {
            // Stronger opacity closer to each other, max 0.07 opacity
            const opacity = (1 - dist / 100) * 0.07;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(${particleColor}, ${opacity})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
      {/* Subtle Dot Grid Pattern Overlay (dots: 1px, spacing: 30px, opacity: 0.07) */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.8]"
        style={{
          backgroundImage: 'radial-gradient(rgba(99, 102, 241, 0.07) 1px, transparent 1px)',
          backgroundSize: '30px 30px',
        }}
      />
      {/* Orbs & Particle Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
      />
    </div>
  );
}
