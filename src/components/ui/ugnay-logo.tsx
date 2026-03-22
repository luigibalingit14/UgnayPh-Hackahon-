"use client";

import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP);
}

export function UgnayLogo({ className = "w-10 h-10" }: { className?: string }) {
  const container = useRef<SVGSVGElement>(null);

  useGSAP(() => {
    // 1. Entrance animation
    gsap.from(container.current, {
      scale: 0.5,
      opacity: 0,
      duration: 1.8,
      ease: "elastic.out(1, 0.45)"
    });

    // 2. Slow outer ring rotation
    gsap.to(".logo-outer-ring", {
      rotation: 360,
      transformOrigin: "50px 50px",
      duration: 20,
      repeat: -1,
      ease: "none"
    });

    // 3. Counter-rotation for inner star rays (opposite direction for depth)
    gsap.to(".logo-rays", {
      rotation: -360,
      transformOrigin: "50px 50px",
      duration: 30,
      repeat: -1,
      ease: "none"
    });

    // 4. Pulsing core glow
    gsap.to(".logo-core-pulse", {
      r: 15,
      opacity: 0.25,
      duration: 2,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    });

    // 5. Node orbit with stagger
    gsap.to(".logo-node", {
      opacity: 0.4,
      scale: 0.7,
      transformOrigin: "center center",
      duration: 1.2,
      stagger: { each: 0.18, repeat: -1, yoyo: true },
      ease: "power1.inOut"
    });

    // 6. Data flow on lines
    gsap.to(".logo-flow", {
      strokeDashoffset: -24,
      duration: 1.8,
      repeat: -1,
      ease: "none"
    });

  }, { scope: container });

  return (
    <svg
      ref={container}
      viewBox="0 0 100 100"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Indigo-Purple core gradient */}
        <radialGradient id="logo-core-grad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#4f46e5" />
        </radialGradient>

        {/* Gold sun gradient */}
        <radialGradient id="logo-sun-grad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="70%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#d97706" />
        </radialGradient>

        {/* Outer ring gradient */}
        <linearGradient id="logo-ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#818cf8" stopOpacity="0.8" />
          <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#c084fc" stopOpacity="0.8" />
        </linearGradient>

        {/* Glow filter for sun */}
        <filter id="sun-glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Soft glow for nodes */}
        <filter id="node-glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Outer ring glow */}
        <filter id="ring-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ── Background disc (glassmorphism base) ── */}
      <circle cx="50" cy="50" r="47" fill="url(#logo-core-grad)" fillOpacity="0.15" />
      <circle cx="50" cy="50" r="47" stroke="url(#logo-ring-grad)" strokeWidth="0.8" strokeOpacity="0.5" />

      {/* ── Outer dashed orbital ring (rotating) ── */}
      <circle
        className="logo-outer-ring"
        cx="50" cy="50" r="40"
        stroke="url(#logo-ring-grad)"
        strokeWidth="1.2"
        strokeDasharray="3 5"
        strokeLinecap="round"
        filter="url(#ring-glow)"
      />

      {/* ── Network connection lines (data flowing) ── */}
      <g strokeWidth="1.2" strokeLinecap="round">
        {/* Left cluster */}
        <line className="logo-flow" x1="50" y1="50" x2="14" y2="36" stroke="#818cf8" strokeDasharray="4 4" strokeOpacity="0.7" />
        <line className="logo-flow" x1="50" y1="50" x2="14" y2="64" stroke="#818cf8" strokeDasharray="4 4" strokeOpacity="0.7" />
        <line className="logo-flow" x1="14" y1="36" x2="14" y2="64" stroke="#818cf8" strokeDasharray="3 6" strokeOpacity="0.4" />
        {/* Right cluster */}
        <line className="logo-flow" x1="50" y1="50" x2="86" y2="36" stroke="#c084fc" strokeDasharray="4 4" strokeOpacity="0.7" />
        <line className="logo-flow" x1="50" y1="50" x2="86" y2="64" stroke="#c084fc" strokeDasharray="4 4" strokeOpacity="0.7" />
        <line className="logo-flow" x1="86" y1="36" x2="86" y2="64" stroke="#c084fc" strokeDasharray="3 6" strokeOpacity="0.4" />
        {/* Top & bottom */}
        <line className="logo-flow" x1="50" y1="50" x2="50" y2="12" stroke="#f59e0b" strokeDasharray="4 4" strokeOpacity="0.6" />
        <line className="logo-flow" x1="50" y1="50" x2="50" y2="88" stroke="#f59e0b" strokeDasharray="4 4" strokeOpacity="0.6" />
      </g>

      {/* ── Central Sun (Philippine sun symbol) ── */}
      <g filter="url(#sun-glow)">
        {/* Pulsing aura ring */}
        <circle className="logo-core-pulse" cx="50" cy="50" r="12" fill="#f59e0b" opacity="0.2" />

        {/* 8-Point sun rays ── counter-rotating */}
        <g className="logo-rays" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round">
          <line x1="50" y1="33" x2="50" y2="25" />
          <line x1="50" y1="67" x2="50" y2="75" />
          <line x1="33" y1="50" x2="25" y2="50" />
          <line x1="67" y1="50" x2="75" y2="50" />
          <line x1="38.8" y1="38.8" x2="33.2" y2="33.2" />
          <line x1="61.2" y1="61.2" x2="66.8" y2="66.8" />
          <line x1="61.2" y1="38.8" x2="66.8" y2="33.2" />
          <line x1="38.8" y1="61.2" x2="33.2" y2="66.8" />
        </g>

        {/* Sun body */}
        <circle cx="50" cy="50" r="11" fill="url(#logo-sun-grad)" />
        <circle cx="50" cy="50" r="7" fill="#fef08a" fillOpacity="0.9" />
        {/* Bright center */}
        <circle cx="50" cy="50" r="3" fill="#ffffff" fillOpacity="0.85" />
      </g>

      {/* ── 8 Orbital Network Nodes ── */}
      {/* Top */}
      <circle className="logo-node" cx="50" cy="12" r="3.5" fill="#fef08a" filter="url(#node-glow)" />
      {/* Bottom */}
      <circle className="logo-node" cx="50" cy="88" r="3.5" fill="#fef08a" filter="url(#node-glow)" />
      {/* Left cluster */}
      <circle className="logo-node" cx="14" cy="36" r="3" fill="#818cf8" filter="url(#node-glow)" />
      <circle className="logo-node" cx="14" cy="64" r="3" fill="#818cf8" filter="url(#node-glow)" />
      {/* Right cluster */}
      <circle className="logo-node" cx="86" cy="36" r="3" fill="#c084fc" filter="url(#node-glow)" />
      <circle className="logo-node" cx="86" cy="64" r="3" fill="#c084fc" filter="url(#node-glow)" />
    </svg>
  );
}
