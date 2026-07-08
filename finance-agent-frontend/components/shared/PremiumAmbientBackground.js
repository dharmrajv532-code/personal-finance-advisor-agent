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

    // 2. Floating Morphing Shapes
    // All shapes are drawn as 6-vertex polygons, allowing seamless coordinate interpolation
    class MorphingShape {
      constructor() {
        this.x = Math.random() * w;
        this.y = Math.random() * h;
        this.size = Math.random() * 60 + 50; // 50px to 110px range (making them larger: 40px to 150px range overall)
        this.vx = (Math.random() - 0.5) * 0.4;
        this.vy = (Math.random() - 0.5) * 0.4;
        this.angle = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.006;
        this.opacity = Math.random() * 0.15 + 0.5; // Opacity 0.5 to 0.65 (requirements: 0.5 to 0.7)

        // Initialize 6 local vertices coordinates representing local offsets
        // Start as diamond shape
        this.localVertices = this.getVerticesForShape('diamond');
        this.targetVertices = this.getVerticesForShape('diamond');
        this.currentShapeType = 'diamond';
      }

      getVerticesForShape(type) {
        const vertices = [];
        if (type === 'diamond') {
          // Diamond: 4 corners, duplicating top/bottom corners to get 6 vertices
          vertices.push({ x: 1, y: 0 });          // Right
          vertices.push({ x: 0, y: -1.3 });       // Top (1)
          vertices.push({ x: 0, y: -1.3 });       // Top (2)
          vertices.push({ x: -1, y: 0 });         // Left
          vertices.push({ x: 0, y: 1.3 });        // Bottom (1)
          vertices.push({ x: 0, y: 1.3 });        // Bottom (2)
        } else if (type === 'triangle') {
          // Triangle: 3 corners, duplicating each to get 6 vertices
          for (let i = 0; i < 3; i++) {
            const angle = (i * 2 * Math.PI) / 3 - Math.PI / 2;
            const x = Math.cos(angle);
            const y = Math.sin(angle);
            vertices.push({ x, y });
            vertices.push({ x, y });
          }
        } else if (type === 'hexagon') {
          // Hexagon: 6 distinct vertices
          for (let i = 0; i < 6; i++) {
            const angle = (i * 2 * Math.PI) / 6;
            const x = Math.cos(angle);
            const y = Math.sin(angle);
            vertices.push({ x, y });
          }
        }
        return vertices;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.angle += this.rotationSpeed;

        // Boundaries wrap-around
        const pad = this.size * 1.5;
        if (this.x < -pad) this.x = w + pad;
        if (this.x > w + pad) this.x = -pad;
        if (this.y < -pad) this.y = h + pad;
        if (this.y > h + pad) this.y = -pad;

        // Cursor proximity check
        if (mouse.x !== null && mouse.y !== null) {
          const dx = mouse.x - this.x;
          const dy = mouse.y - this.y;
          const dist = Math.hypot(dx, dy);

          if (dist < 100) {
            // Morph dynamically: closer = more complex shape
            let nextShape = 'diamond';
            if (dist <= 40) {
              nextShape = 'hexagon';
            } else if (dist <= 75) {
              nextShape = 'triangle';
            }
            
            if (nextShape !== this.currentShapeType) {
              this.currentShapeType = nextShape;
              this.targetVertices = this.getVerticesForShape(nextShape);
            }
          } else {
            // Revert back to idle diamond
            if (this.currentShapeType !== 'diamond') {
              this.currentShapeType = 'diamond';
              this.targetVertices = this.getVerticesForShape('diamond');
            }
          }
        } else {
          // Revert to idle diamond when mouse is out
          if (this.currentShapeType !== 'diamond') {
            this.currentShapeType = 'diamond';
            this.targetVertices = this.getVerticesForShape('diamond');
          }
        }

        // Interpolate vertices coordinates smoothly (lerp)
        for (let i = 0; i < 6; i++) {
          this.localVertices[i].x += (this.targetVertices[i].x - this.localVertices[i].x) * 0.08;
          this.localVertices[i].y += (this.targetVertices[i].y - this.localVertices[i].y) * 0.08;
        }
      }

      draw(isDark) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Neon coloring based on theme
        const color = isDark ? '#818cf8' : '#6366f1';

        // Draw shape with morphing coordinates
        ctx.beginPath();
        const p0 = this.localVertices[0];
        ctx.moveTo(p0.x * this.size, p0.y * this.size);
        for (let i = 1; i < 6; i++) {
          const p = this.localVertices[i];
          ctx.lineTo(p.x * this.size, p.y * this.size);
        }
        ctx.closePath();

        // Neon Glow border
        ctx.shadowBlur = 18;
        ctx.shadowColor = color;
        ctx.strokeStyle = color;
        ctx.globalAlpha = this.opacity;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.restore();
      }
    }

    // Initialize Orbs (3-4) and Morphing Shapes (4-5)
    const orbs = [];
    for (let i = 0; i < 4; i++) {
      orbs.push(new AmbientOrb());
    }

    const shapes = [];
    for (let i = 0; i < 5; i++) {
      shapes.push(new MorphingShape());
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

      // Render Morphing shapes on top
      shapes.forEach((shape) => {
        shape.update();
        shape.draw(isDark);
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

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
      style={{ zIndex: 1 }}
    />
  );
}
