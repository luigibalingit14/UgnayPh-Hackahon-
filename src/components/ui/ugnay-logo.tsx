"use client";

import React from "react";

export function UgnayLogo({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Main sun gold gradient */}
        <radialGradient id="sun-body" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#FFEC6B" />
          <stop offset="50%" stopColor="#FCD116" />
          <stop offset="100%" stopColor="#E6A800" />
        </radialGradient>
        {/* Ray gradient */}
        <linearGradient id="ray-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFF176" />
          <stop offset="100%" stopColor="#E6A800" />
        </linearGradient>
        {/* Specular highlight */}
        <radialGradient id="specular" cx="38%" cy="32%" r="45%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.55)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
      </defs>

      {/* === 8 POINTED RAYS (4 long cardinal + 4 shorter diagonal) === */}
      {/* The Philippine sun has 8 rays — each is a diamond/kite shape */}

      {/* TOP ray (long cardinal) */}
      <polygon points="100,8 108,72 100,78 92,72" fill="url(#ray-grad)" />
      {/* BOTTOM ray */}
      <polygon points="100,192 108,128 100,122 92,128" fill="url(#ray-grad)" />
      {/* LEFT ray */}
      <polygon points="8,100 72,92 78,100 72,108" fill="url(#ray-grad)" />
      {/* RIGHT ray */}
      <polygon points="192,100 128,92 122,100 128,108" fill="url(#ray-grad)" />

      {/* TOP-RIGHT diagonal (shorter) */}
      <polygon points="158,42 117,90 111,84 141,46" fill="url(#ray-grad)" />
      {/* BOTTOM-RIGHT diagonal */}
      <polygon points="158,158 117,110 111,116 141,154" fill="url(#ray-grad)" />
      {/* BOTTOM-LEFT diagonal */}
      <polygon points="42,158 83,110 89,116 59,154" fill="url(#ray-grad)" />
      {/* TOP-LEFT diagonal */}
      <polygon points="42,42 83,90 89,84 59,46" fill="url(#ray-grad)" />

      {/* === MAIN SUN DISC === */}
      <circle cx="100" cy="100" r="55" fill="url(#sun-body)" />

      {/* Inner shading ring for depth */}
      <circle cx="100" cy="100" r="55" fill="none" stroke="#C88A00" strokeWidth="2" strokeOpacity="0.5" />

      {/* Specular highlight (glossy look) */}
      <ellipse cx="85" cy="80" rx="25" ry="18" fill="url(#specular)" />
    </svg>
  );
}
