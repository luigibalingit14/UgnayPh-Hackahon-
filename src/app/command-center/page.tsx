"use client";

import { useRef, useState, useEffect } from "react";
import { 
  ShieldAlert, Activity, AlertTriangle, CloudRain, 
  MapPin, Radio, ShieldCheck, Car, Briefcase, Heart, Leaf, 
  ChevronRight, RefreshCcw
} from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Map, Overlay } from "pigeon-maps";

function mapTiler(x: number, y: number, z: number) {
  return `https://cartodb-basemaps-a.global.ssl.fastly.net/dark_all/${z}/${x}/${y}.png`;
}

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP);
}

// Simulated Live Data
const recentEvents = [
  { id: 1, type: "vibecheck", msg: "Phishing SMS detected in NCR", time: "Just now", color: "text-indigo-400" },
  { id: 2, type: "mobility", msg: "Severe pothole reported at EDSA", time: "2m ago", color: "text-amber-400" },
  { id: 3, type: "health", msg: "Dengue cluster possible in Region 3", time: "5m ago", color: "text-blue-400" },
  { id: 4, type: "governance", msg: "Brgy. San Jose streetlights fixed", time: "12m ago", color: "text-rose-400" },
  { id: 5, type: "agri", msg: "Low soil moisture warning in Isabela", time: "18m ago", color: "text-lime-400" },
  { id: 6, type: "jobs", msg: "15 new LGU urgent hiring posted", time: "22m ago", color: "text-emerald-400" },
];

export default function CommandCenterPage() {
  const container = useRef<HTMLDivElement>(null);
  const [liveEvents, setLiveEvents] = useState(recentEvents);
  
  // Ticking metrics simulation
  const [metrics, setMetrics] = useState({
    vibecheck: 12405, mobility: 843, health: 3120, 
    governance: 589, agri: 420, jobs: 8900
  });

  useEffect(() => {
    // Simulate real-time data ticking
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        vibecheck: prev.vibecheck + Math.floor(Math.random() * 5),
        mobility: prev.mobility + Math.floor(Math.random() * 2),
        health: prev.health + Math.floor(Math.random() * 3),
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useGSAP(() => {
    const tl = gsap.timeline();
    // Entrance animations
    tl.fromTo(".cc-header", { y: -50, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: "power3.out" });
    tl.fromTo(".cc-card", { scale: 0.9, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.8, stagger: 0.1, ease: "back.out(1.2)" }, "-=0.5");
    tl.fromTo(".cc-map-ping", { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 2, stagger: 0.2, ease: "elastic.out(1, 0.3)" }, "-=0.2");
  }, { scope: container });

  return (
    <div className="min-h-screen bg-[#020617] text-white selection:bg-indigo-500/30 overflow-hidden font-sans" ref={container}>
      {/* Background Matrix Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none opacity-20" />
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/10 via-transparent to-rose-900/10 pointer-events-none" />

      <div className="relative z-10 p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto h-screen flex flex-col">
        
        {/* HEADER */}
        <header className="cc-header flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 shrink-0 border-b border-white/10 pb-6">
          <div className="flex items-center gap-4">
            <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/20 border border-indigo-400/30">
              <Radio className="h-6 w-6 text-indigo-400 animate-pulse" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
              </span>
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-display font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60">
                LGU Command Center
              </h1>
              <p className="text-sm text-indigo-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live Unified Dashboard • UgnayPH Systems Active
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 bg-white/5 rounded-full px-4 py-2 border border-white/10 text-sm font-mono text-white/70">
            <RefreshCcw className="h-3 w-3 animate-spin duration-3000" />
            Last Sync: Real-time
          </div>
        </header>

        {/* MAIN DASHBOARD GRID */}
        <div className="flex-[1] grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0 pb-4">
          
          {/* LEFT: Modules Summary (3 columns) */}
          <div className="lg:col-span-3 flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
            {/* VibeCheck */}
            <div className="cc-card p-5 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 backdrop-blur-md relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><ShieldAlert className="h-24 w-24" /></div>
              <p className="text-xs text-indigo-300 font-semibold uppercase tracking-wider mb-1">VibeCheck</p>
              <h3 className="text-3xl font-bold text-white mb-2">{metrics.vibecheck.toLocaleString()}</h3>
              <p className="text-xs text-white/50">Disinformation/Scams Flagged</p>
            </div>

            {/* Mobility */}
            <div className="cc-card p-5 rounded-2xl bg-amber-950/30 border border-amber-500/20 backdrop-blur-md relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Car className="h-24 w-24" /></div>
              <p className="text-xs text-amber-300 font-semibold uppercase tracking-wider mb-1">Mobility Watch</p>
              <h3 className="text-3xl font-bold text-white mb-2">{metrics.mobility.toLocaleString()}</h3>
              <p className="text-xs text-white/50">Active Road Hazard Reports</p>
            </div>

            {/* Health */}
            <div className="cc-card p-5 rounded-2xl bg-blue-950/30 border border-blue-500/20 backdrop-blur-md relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Heart className="h-24 w-24" /></div>
              <p className="text-xs text-blue-300 font-semibold uppercase tracking-wider mb-1">HealthReach</p>
              <h3 className="text-3xl font-bold text-white mb-2">{metrics.health.toLocaleString()}</h3>
              <p className="text-xs text-white/50">Symptom Trackers Submitted</p>
            </div>

            {/* Governance + Jobs + Agri mini row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="cc-card p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md">
                <ShieldCheck className="h-5 w-5 text-rose-400 mb-2" />
                <h4 className="text-xl font-bold">{metrics.governance}</h4>
                <p className="text-[10px] text-white/50 uppercase">Gov Reports</p>
              </div>
              <div className="cc-card p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md">
                <Briefcase className="h-5 w-5 text-emerald-400 mb-2" />
                <h4 className="text-xl font-bold">{(metrics.jobs / 1000).toFixed(1)}k</h4>
                <p className="text-[10px] text-white/50 uppercase">Job Matches</p>
              </div>
            </div>
          </div>

          {/* CENTER: The Map Simulation (6 columns) */}
          <div className="lg:col-span-6 flex flex-col">
            <div className="cc-card flex-1 rounded-2xl bg-[#080c1d]/60 border border-white/10 backdrop-blur-xl relative flex flex-col overflow-hidden">
              <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/20 shrink-0">
                <h2 className="text-sm font-semibold flex items-center gap-2">
                  <Activity className="h-4 w-4 text-emerald-400" />
                  National Heatmap <span className="text-white/40 font-normal ml-2">Simulated Radar View</span>
                </h2>
                <div className="flex gap-2 text-[10px] font-mono">
                  <span className="px-2 py-1 rounded bg-indigo-500/20 text-indigo-300">NCR: HIGH</span>
                  <span className="px-2 py-1 rounded bg-amber-500/20 text-amber-300">REG 3: MED</span>
                </div>
              </div>

              {/* Pigeon Map Container */}
              <div className="flex-1 relative flex items-center justify-center bg-[#0a0f1c] overflow-hidden rounded-b-2xl">
                <Map 
                  provider={mapTiler} 
                  defaultCenter={[14.5995, 120.9842]}
                  defaultZoom={11}
                  metaWheelZoom={true}
                >
                  {/* CRITICAL: Severe Flooding */}
                  <Overlay anchor={[14.6150, 120.9950]} offset={[8, 8]}>
                    <div className="cc-map-ping relative flex h-4 w-4">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-600 shadow-[0_0_15px_rgba(225,29,72,0.8)] border-2 border-white/20"></span>
                      <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-black/80 px-2 py-1 rounded text-[10px] border border-rose-500/50 text-rose-200 whitespace-nowrap shadow-xl">
                        <p className="font-bold">CRITICAL: Severe Flooding</p>
                        <p className="opacity-70 text-[9px]">Mobility & Gov Module</p>
                      </div>
                    </div>
                  </Overlay>

                  {/* VibeCheck Alert */}
                  <Overlay anchor={[14.5800, 121.0500]} offset={[6, 6]}>
                    <div className="cc-map-ping relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75 animate-delay-150"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)] border border-white/20"></span>
                    </div>
                  </Overlay>

                  {/* Mobility Alert */}
                  <Overlay anchor={[14.6300, 121.0200]} offset={[6, 6]}>
                    <div className="cc-map-ping relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75 animate-delay-300"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500 shadow-[0_0_10px_rgba(251,191,36,0.8)] border border-white/20"></span>
                    </div>
                  </Overlay>

                  {/* Health Alert */}
                  <Overlay anchor={[14.6700, 121.0400]} offset={[4, 4]}>
                    <div className="cc-map-ping relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75 animate-delay-700"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500 border border-white/20"></span>
                    </div>
                  </Overlay>
                </Map>
              </div>
            </div>
          </div>

          {/* RIGHT: Live Feed & A.I. Insights (3 columns) */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            
            {/* Live Feed */}
            <div className="cc-card flex-1 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md flex flex-col overflow-hidden">
              <div className="p-4 border-b border-white/10 bg-black/20 shrink-0">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                  Live Activity Feed
                </h3>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {liveEvents.map((event) => (
                  <div key={event.id} className="group relative pl-4 pb-4 border-l border-white/10 last:border-transparent last:pb-0">
                    <div className={`absolute -left-[5px] top-0.5 h-2.5 w-2.5 rounded-full bg-current ${event.color} shadow-[0_0_8px_currentColor]`} />
                    <p className="text-[10px] text-white/40 mb-1">{event.time} • {event.type.toUpperCase()}</p>
                    <p className="text-sm text-white/90 leading-tight group-hover:text-white transition-colors">{event.msg}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Actionable Insights */}
            <div className="cc-card rounded-2xl bg-gradient-to-br from-indigo-900/40 to-purple-900/20 border border-indigo-500/30 backdrop-blur-md p-5 relative overflow-hidden shrink-0">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl" />
              <h3 className="text-sm font-semibold flex items-center gap-2 mb-3 text-indigo-300">
                <CloudRain className="h-4 w-4" />
                AI Groq Insights
              </h3>
              <p className="text-sm text-white/80 leading-relaxed mb-4">
                "Anomaly detected in Region 3: A 40% spike in dengue symptom reports matches incoming heavy rainfall forecasts. Immediate advisory recommended."
              </p>
              <button className="w-full py-2 px-4 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-semibold shadow-lg shadow-indigo-500/20 transition-all active:scale-95 flex items-center justify-center gap-2">
                Draft LGU Advisory <ChevronRight className="h-3 w-3" />
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
