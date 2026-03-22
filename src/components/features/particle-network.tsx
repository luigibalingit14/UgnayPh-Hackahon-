"use client";

import { useEffect, useRef } from "react";

export function ParticleNetwork() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Theme Colors
    const colors = ["#6366f1", "#fbbf24", "#0038A8", "#CE1126"];

    // Mouse struct
    const mouse = { x: -1000, y: -1000, radius: 150 };

    class Particle {
      x: number;
      y: number;
      size: number;
      baseX: number;
      baseY: number;
      density: number;
      color: string;
      vx: number;
      vy: number;

      constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        this.baseX = x;
        this.baseY = y;
        this.vx = (Math.random() - 0.5) * 1.5;
        this.vy = (Math.random() - 0.5) * 1.5;
        this.size = Math.random() * 2.5 + 1;
        this.density = Math.random() * 30 + 1;
        this.color = colors[Math.floor(Math.random() * colors.length)];
      }

      draw() {
        if (!ctx) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
      }

      update() {
        if (!canvas) return;

        // Move particle
        this.x += this.vx;
        this.y += this.vy;

        // Edge collision
        if (this.x < 0 || this.x > canvas.width) this.vx = -this.vx;
        if (this.y < 0 || this.y > canvas.height) this.vy = -this.vy;

        // Mouse interaction
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const forceDirectionX = dx / distance;
        const forceDirectionY = dy / distance;
        const maxDistance = mouse.radius;
        const force = (maxDistance - distance) / maxDistance;

        if (distance < maxDistance) {
          const pushX = forceDirectionX * force * 5;
          const pushY = forceDirectionY * force * 5;
          this.x -= pushX;
          this.y -= pushY;
        }
      }
    }

    let particles: Particle[] = [];
    let animationFrameId: number;

    const init = () => {
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.parentElement?.getBoundingClientRect() || { width: window.innerWidth, height: window.innerHeight };
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      particles = [];
      const numberOfParticles = Math.min((rect.width * rect.height) / 12000, 150);
      for (let i = 0; i < numberOfParticles; i++) {
        const x = Math.random() * rect.width;
        const y = Math.random() * rect.height;
        particles.push(new Particle(x, y));
      }
    };

    const animate = () => {
      if (!canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();

        for (let j = i; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 150) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.15 - distance / 1000})`;
            ctx.lineWidth = 1;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
      animationFrameId = requestAnimationFrame(animate);
    };

    const handleMouseMove = (x: number, y: number) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = x - rect.left;
      mouse.y = y - rect.top;
    };

    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    const resizeObserver = new ResizeObserver(() => {
      init();
    });
    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    const mouseMoveHandler = (e: MouseEvent) => handleMouseMove(e.clientX, e.clientY);
    const touchMoveHandler = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        handleMouseMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    window.addEventListener("mousemove", mouseMoveHandler);
    window.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("touchmove", touchMoveHandler, { passive: true });

    init();
    animate();

    return () => {
      window.removeEventListener("mousemove", mouseMoveHandler);
      window.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("touchmove", touchMoveHandler);
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none mix-blend-screen opacity-60 z-0 transition-opacity duration-1000"
    />
  );
}
