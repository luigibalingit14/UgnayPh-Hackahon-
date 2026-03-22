"use client";

import React from "react";

export function UgnayLogo({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Outer ring gradient (blue → indigo → gold) */}
        <linearGradient id="ring-g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0038A8" />
          <stop offset="50%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#FCD116" />
        </linearGradient>

        {/* Sun body gradient */}
        <radialGradient id="sun-g" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#FEF08A" />
          <stop offset="60%" stopColor="#FCD116" />
          <stop offset="100%" stopColor="#D97706" />
        </radialGradient>

        {/* Inner disc (glassmorphism base) */}
        <radialGradient id="disc-g" cx="50%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#1e2a4a" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#080c14" stopOpacity="0.7" />
        </radialGradient>

        {/* Soft glow around sun */}
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ── Background disc ── */}
      <circle cx="50" cy="50" r="46" fill="url(#disc-g)" />

      {/* ── Outer border ring with gradient ── */}
      <circle cx="50" cy="50" r="46" stroke="url(#ring-g)" strokeWidth="2" strokeOpacity="0.8" />

      {/* ── 6 outer network nodes (representing 6 modules) ── */}
      {/* Top */}
      <circle cx="50" cy="10" r="3.5" fill="#6366f1" fillOpacity="0.9" />
      {/* Top-right */}
      <circle cx="81" cy="27" r="3.5" fill="#CE1126" fillOpacity="0.9" />
      {/* Bottom-right */}
      <circle cx="81" cy="73" r="3.5" fill="#FCD116" fillOpacity="0.9" />
      {/* Bottom */}
      <circle cx="50" cy="90" r="3.5" fill="#0038A8" fillOpacity="0.9" />
      {/* Bottom-left */}
      <circle cx="19" cy="73" r="3.5" fill="#10b981" fillOpacity="0.9" />
      {/* Top-left */}
      <circle cx="19" cy="27" r="3.5" fill="#818cf8" fillOpacity="0.9" />

      {/* ── Subtle connector lines to center ── */}
      <g stroke="rgba(255,255,255,0.08)" strokeWidth="1">
        <line x1="50" y1="13" x2="50" y2="38" />
        <line x1="78" y1="29" x2="60" y2="41" />
        <line x1="78" y1="71" x2="60" y2="59" />
        <line x1="50" y1="87" x2="50" y2="62" />
        <line x1="22" y1="71" x2="40" y2="59" />
        <line x1="22" y1="29" x2="40" y2="41" />
      </g>

      {/* ── Philippine Sun (central mark) ── */}
      <g filter="url(#glow)">
        {/* 8 sun rays — static */}
        <g stroke="#FCD116" strokeWidth="2.8" strokeLinecap="round" opacity="0.95">
          {/* Cardinal */}
          <line x1="50" y1="36" x2="50" y2="27" />
          <line x1="50" y1="64" x2="50" y2="73" />
          <line x1="36" y1="50" x2="27" y2="50" />
          <line x1="64" y1="50" x2="73" y2="50" />
          {/* Ordinal */}
          <line x1="40.1" y1="40.1" x2="33.9" y2="33.9" />
          <line x1="59.9" y1="59.9" x2="66.1" y2="66.1" />
          <line x1="59.9" y1="40.1" x2="66.1" y2="33.9" />
          <line x1="40.1" y1="59.9" x2="33.9" y2="66.1" />
        </g>

        {/* Sun disc */}
        <circle cx="50" cy="50" r="12" fill="url(#sun-g)" />
        {/* Inner bright core */}
        <circle cx="50" cy="50" r="5.5" fill="#FFF9C4" />
        {/* Center specular highlight */}
        <circle cx="47" cy="47" r="2" fill="white" fillOpacity="0.6" />
      </g>
    </svg>
  );
}
