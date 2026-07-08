'use client';

import { useEffect, useRef } from 'react';

export default function CrystalCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;

    // Set canvas dimensions
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Mouse tracking
    const mouse = { x: null, y: null };
    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    const handleMouseLeave = () => {
      mouse.x = null;
      mouse.y = null;
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    // Particle class
    class CrystalParticle {
      constructor(w, h) {
        this.baseX = Math.random() * w;
        this.baseY = Math.random() * h;
        this.x = this.baseX;
        this.y = this.baseY;
        
        // Idle drift velocities
        this.vx = (Math.random() - 0.5) * 0.4;
        this.vy = (Math.random() - 0.5) * 0.4;
        
        // Visuals
        this.size = Math.random() * 15 + 10; // 10px to 25px size
        this.angle = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.005;
        this.opacity = Math.random() * 0.15 + 0.1; // 0.1 to 0.25 opacity
        
        // Colors
        this.color1 = '#6366f1';
        this.color2 = '#818cf8';
      }

      update(w, h) {
        // Update the idle base position
        this.baseX += this.vx;
        this.baseY += this.vy;

        // Wrap around screen bounds
        if (this.baseX < -this.size) this.baseX = w + this.size;
        if (this.baseX > w + this.size) this.baseX = -this.size;
        if (this.baseY < -this.size) this.baseY = h + this.size;
        if (this.baseY > h + this.size) this.baseY = -this.size;

        // Rotate
        this.angle += this.rotationSpeed;

        // Interaction logic (attract toward cursor if close)
        if (mouse.x !== null && mouse.y !== null) {
          const dx = mouse.x - this.baseX;
          const dy = mouse.y - this.baseY;
          const dist = Math.hypot(dx, dy);

          if (dist < 150) {
            // Attract position towards mouse
            const force = (150 - dist) / 150;
            const targetX = this.baseX + (dx / dist) * (150 - dist) * 0.35;
            const targetY = this.baseY + (dy / dist) * (150 - dist) * 0.35;

            // Ease towards target
            this.x += (targetX - this.x) * 0.08;
            this.y += (targetY - this.y) * 0.08;
          } else {
            // Return back to base drift position
            this.x += (this.baseX - this.x) * 0.08;
            this.y += (this.baseY - this.y) * 0.08;
          }
        } else {
          // Return back to base drift position
          this.x += (this.baseX - this.x) * 0.08;
          this.y += (this.baseY - this.y) * 0.08;
        }
      }

      draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        // Draw diamond / crystal shape
        ctx.beginPath();
        ctx.moveTo(0, -this.size);
        ctx.lineTo(this.size * 0.6, 0);
        ctx.lineTo(0, this.size);
        ctx.lineTo(-this.size * 0.6, 0);
        ctx.closePath();

        // Create neon gradient fill
        const gradient = ctx.createLinearGradient(-this.size, -this.size, this.size, this.size);
        gradient.addColorStop(0, this.color1);
        gradient.addColorStop(1, this.color2);

        ctx.fillStyle = gradient;
        ctx.globalAlpha = this.opacity;
        ctx.fill();

        // Optional very thin glow stroke
        ctx.strokeStyle = this.color2;
        ctx.globalAlpha = this.opacity * 0.4;
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.restore();
      }
    }

    // Initialize 18 particles
    const particleCount = 18;
    const particles = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push(new CrystalParticle(canvas.width, canvas.height));
    }

    // Render loop
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.update(canvas.width, canvas.height);
        p.draw();
      });

      animationFrameId = requestAnimationFrame(render);
    };
    render();

    // Clean up
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: -1 }}
    />
  );
}
