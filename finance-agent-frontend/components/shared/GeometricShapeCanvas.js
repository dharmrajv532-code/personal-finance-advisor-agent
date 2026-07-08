'use client';

import React, { useEffect, useRef } from 'react';

export default function GeometricShapeCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Golden ratio for regular icosahedron vertices construction
    const phi = (1 + Math.sqrt(5)) / 2;
    const rawVertices = [
      [-1, phi, 0], [1, phi, 0], [-1, -phi, 0], [1, -phi, 0],
      [0, -1, phi], [0, 1, phi], [0, -1, -phi], [0, 1, -phi],
      [-phi, 0, -1], [phi, 0, -1], [-phi, 0, 1], [phi, 0, 1]
    ];

    // Scale unit vertices to the desired size
    const R = 100; // Shape radius
    const vertices = rawVertices.map(([x, y, z]) => {
      const len = Math.hypot(x, y, z);
      return [ (x / len) * R, (y / len) * R, (z / len) * R ];
    });

    // Generate edges (distance between adjacent unit vertices is exactly 2, distSq is 4)
    const edges = [];
    for (let i = 0; i < rawVertices.length; i++) {
      for (let j = i + 1; j < rawVertices.length; j++) {
        const dx = rawVertices[i][0] - rawVertices[j][0];
        const dy = rawVertices[i][1] - rawVertices[j][1];
        const dz = rawVertices[i][2] - rawVertices[j][2];
        const distSq = dx*dx + dy*dy + dz*dz;
        if (distSq < 4.1) {
          edges.push([i, j]);
        }
      }
    }

    let angleX = 0.5;
    let angleY = 0.5;
    let speedX = 0.002;
    let speedY = 0.003;

    const mouse = { x: null, y: null, targetX: 0, targetY: 0 };

    const handleMouseMove = (e) => {
      // Relative cursor offsets from the center of the viewport (-1 to 1)
      mouse.targetY = (e.clientY - window.innerHeight / 2) / (window.innerHeight / 2);
      mouse.targetX = (e.clientX - window.innerWidth / 2) / (window.innerWidth / 2);
    };

    const handleMouseLeave = () => {
      mouse.targetX = 0;
      mouse.targetY = 0;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    let animationFrameId;

    const render = () => {
      const isDark = document.documentElement.classList.contains('dark');
      
      // Update rotation speed smoothly towards cursor offsets
      const targetSpeedX = mouse.targetY !== 0 ? mouse.targetY * 0.025 : 0.002;
      const targetSpeedY = mouse.targetX !== 0 ? mouse.targetX * 0.025 : 0.003;

      speedX += (targetSpeedX - speedX) * 0.05;
      speedY += (targetSpeedY - speedY) * 0.05;

      angleX += speedX;
      angleY += speedY;

      // Direct tilt offset for tactile responsiveness
      const displayAngleX = angleX + mouse.targetY * 0.25;
      const displayAngleY = angleY + mouse.targetX * 0.25;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Rotate and project vertices
      const rotated = vertices.map(([x, y, z]) => {
        // Rotate around X-axis
        let y1 = y * Math.cos(displayAngleX) - z * Math.sin(displayAngleX);
        let z1 = y * Math.sin(displayAngleX) + z * Math.cos(displayAngleX);

        // Rotate around Y-axis
        let x2 = x * Math.cos(displayAngleY) + z1 * Math.sin(displayAngleY);
        let z2 = -x * Math.sin(displayAngleY) + z1 * Math.cos(displayAngleY);

        // Perspective projection
        const D = 320; // Perspective distance
        const scale = D / (D + z2);
        const px = canvas.width / 2 + x2 * scale;
        const py = canvas.height / 2 + y1 * scale;

        return { x: px, y: py, z: z2 };
      });

      // Colors based on theme
      const colorBase = isDark ? '129, 140, 248' : '99, 102, 241'; // #818cf8 : #6366f1
      const nodeColor = isDark ? '#818cf8' : '#6366f1';

      // Draw edges with depth sorting (opacity based on Z-depth)
      edges.forEach(([u, v]) => {
        const avgZ = (rotated[u].z + rotated[v].z) / 2;
        // Map avgZ (range -R to R) to opacity
        // Closer vertices have lower z value (towards camera)
        const t = (avgZ + R) / (2 * R); // 0 to 1
        const opacity = (1 - t) * 0.38 + 0.07; // opacity ranges from 0.07 (back) to 0.45 (front)

        ctx.beginPath();
        ctx.moveTo(rotated[u].x, rotated[u].y);
        ctx.lineTo(rotated[v].x, rotated[v].y);
        ctx.strokeStyle = `rgba(${colorBase}, ${opacity})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // Draw nodes (vertices) with depth sorting
      rotated.forEach((node, i) => {
        const t = (node.z + R) / (2 * R);
        const opacity = (1 - t) * 0.75 + 0.15; // opacity ranges from 0.15 to 0.9

        ctx.beginPath();
        ctx.arc(node.x, node.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = nodeColor;
        ctx.globalAlpha = opacity;
        ctx.fill();
        ctx.globalAlpha = 1.0; // Reset
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={400}
      className="absolute pointer-events-none select-none"
      style={{ zIndex: 0 }}
    />
  );
}
