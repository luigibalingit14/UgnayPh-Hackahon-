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
import { createClient } from "@/lib/supabase/client";
import { formatDistanceToNow } from "date-fns";

function mapTiler(x: number, y: number, z: number) {
  return `https://cartodb-basemaps-a.global.ssl.fastly.net/dark_all/${z}/${x}/${y}.png`;
}

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP);
}

// Helper to convert string locations to approximate coordinates with a slight random jitter
const CITY_COORDS: Record<string, [number, number]> = {
  "manila": [14.5995, 120.9842],
  "quezon": [14.6760, 121.0437],
  "makati": [14.5547, 121.0244],
  "taguig": [14.5204, 121.0538],
  "pasig": [14.5764, 121.0851],
  "cebu": [10.3157, 123.8854],
  "davao": [7.1907, 125.4553],
  "caloocan": [14.6465, 120.9733],
  "pasay": [14.5378, 121.0014],
  "mandaluyong": [14.5794, 121.0360],
  "marikina": [14.6507, 121.1029]
};

function getApproxCoords(location: string): [number, number] {
  if (!location) return [14.5995, 120.9842]; // default manila
  const locLower = location.toLowerCase();
  for (const [key, coords] of Object.entries(CITY_COORDS)) {
    if (locLower.includes(key)) {
      // Add a tiny random jitter so overlapping markers are separated (approx 500m radius)
      return [
        coords[0] + (Math.random() - 0.5) * 0.01,
        coords[1] + (Math.random() - 0.5) * 0.01
      ];
    }
  }
  return [
    14.5995 + (Math.random() - 0.5) * 0.1, 
    120.9842 + (Math.random() - 0.5) * 0.1
  ]; // scattered around MM if unknown
}

export default function CommandCenterPage() {
  const container = useRef<HTMLDivElement>(null);
  const [liveEvents, setLiveEvents] = useState<any[]>([]);
  const [mapMarkers, setMapMarkers] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(true);
  
  // Real metrics simulation
  const [metrics, setMetrics] = useState({
    vibecheck: 0, mobility: 0, health: 0, 
    governance: 0, agri: 0, jobs: 0
  });

  useEffect(() => {
    let mounted = true;
    const fetchLiveData = async () => {
      try {
        setIsSyncing(true);
        const supabase = createClient();
        
        // Fetch from the 6 endpoints (using supabase direct for health since it requires auth usually but we use general DB here for admin view)
        const [vibeRes, mobRes, govRes, jobsRes, healthRes, agriRes] = await Promise.all([
          fetch('/api/reports?limit=50').then(r=>r.json()).catch(()=>({success:true, reports:[]})),
          fetch('/api/mobility').then(r=>r.json()).catch(()=>({success:true, reports:[]})),
          fetch('/api/governance').then(r=>r.json()).catch(()=>({success:true, complaints:[]})),
          fetch('/api/jobs').then(r=>r.json()).catch(()=>({success:true, jobs:[]})),
          supabase.from("health_appointments").select("*").limit(50).order("created_at", { ascending: false }).then(d => d.data || []),
          fetch('/api/agri').then(r=>r.json()).catch(()=>({success:true, prices:[]}))
        ]);

        if (!mounted) return;

        // Parse lists safely
        const v = Array.isArray(vibeRes.reports) ? vibeRes.reports : [];
        const m = Array.isArray(mobRes.reports) ? mobRes.reports : [];
        const g = Array.isArray(govRes.complaints) ? govRes.complaints : [];
        const j = Array.isArray(jobsRes.jobs) ? jobsRes.jobs : [];
        const h = healthRes;
        const a = Array.isArray(agriRes.prices) ? agriRes.prices : [];

        // Update real counts
        setMetrics({
          vibecheck: v.length,
          mobility: m.length,
          governance: g.length,
          jobs: j.length,
          health: h.length,
          agri: a.length
        });

        // Consolidate into unified activity feed
        const unified = [
          ...v.map(item => ({ id: `v-${item.id}`, type: "vibecheck", msg: "Phishing/Scam link reported", date: new Date(item.created_at || Date.now()), latlng: getApproxCoords("manila"), severity: "amber" })),
          ...m.map(item => ({ id: `m-${item.id}`, type: "mobility", msg: `${item.incident_type?.replace('_', ' ')} at ${item.location}`, date: new Date(item.created_at || Date.now()), latlng: getApproxCoords(item.city || item.location), severity: "rose" })),
          ...g.map(item => ({ id: `g-${item.id}`, type: "governance", msg: `${item.title} - ${item.category}`, date: new Date(item.created_at || Date.now()), latlng: getApproxCoords("quezon"), severity: "amber" })),
          ...h.map(item => ({ id: `h-${item.id}`, type: "health", msg: `Health concern: ${item.concern?.substring(0, 30)}...`, date: new Date(item.created_at || Date.now()), latlng: getApproxCoords("makati"), severity: "blue" })),
          ...a.map(item => ({ id: `a-${item.id}`, type: "agri", msg: `Crop price post: ${item.crop}`, date: new Date(item.created_at || Date.now()), latlng: getApproxCoords(item.location), severity: "lime" })),
          ...j.map(item => ({ id: `j-${item.id}`, type: "jobs", msg: `New job posted: ${item.title}`, date: new Date(item.created_at || Date.now()), latlng: getApproxCoords(item.location), severity: "emerald" }))
        ];

        // Sort globally by date (newest first)
        unified.sort((a, b) => b.date.getTime() - a.date.getTime());

        // Extract visual items
        setLiveEvents(unified.slice(0, 15)); // top 15 feed
        
        // Take the 15 most urgent items for map overlay
        const mapItems = unified.filter(u => ["vibecheck", "mobility", "health"].includes(u.type)).slice(0, 12);
        setMapMarkers(mapItems);

      } catch (e) {
        console.error("Dashboard Sync Failed", e);
      } finally {
        setIsSyncing(false);
      }
    };

    fetchLiveData();
    const inv = setInterval(fetchLiveData, 15000); // 15 seconds polling
    return () => { mounted = false; clearInterval(inv); };
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

      <div className="relative z-10 p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto min-h-screen py-24 flex flex-col">
        
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
            <RefreshCcw className={`h-3 w-3 ${isSyncing ? "animate-spin text-emerald-400" : "text-white/40"}`} />
            Last Sync: {isSyncing ? "Syncing DB..." : "Real-time active"}
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
              <div className="flex-1 w-full relative bg-[#0a0f1c] overflow-hidden rounded-b-2xl min-h-[400px]">
                <div className="absolute inset-0">
                  <Map 
                    provider={mapTiler} 
                    defaultCenter={[14.5995, 120.9842]}
                    defaultZoom={11}
                    metaWheelZoom={true}
                  >
                  {/* Real Database Generated Pings */}
                  {mapMarkers.map((m, i) => {
                    // Decide color based on severity/type mapping
                    const colorMap: any = { rose: "bg-rose-500", amber: "bg-amber-400", blue: "bg-blue-500", indigo: "bg-indigo-400" };
                    const shadowMap: any = { rose: "shadow-[0_0_15px_rgba(225,29,72,0.8)] border-rose-400", amber: "shadow-[0_0_15px_rgba(251,191,36,0.8)] border-amber-300", blue: "shadow-[0_0_15px_rgba(59,130,246,0.8)] border-blue-400", indigo: "shadow-[0_0_15px_rgba(99,102,241,0.8)] border-indigo-400" };
                    const bgCircle = colorMap[m.severity] || "bg-emerald-500";
                    const borderGlow = shadowMap[m.severity] || "border-white/20";
                    
                    return (
                      <Overlay key={m.id} anchor={m.latlng} offset={[6, 6]}>
                        <div className="cc-map-ping relative flex h-3 w-3 group/ping cursor-pointer">
                          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${bgCircle} opacity-75`} style={{ animationDelay: `${i * 150}ms`}}></span>
                          <span className={`relative inline-flex rounded-full h-3 w-3 ${bgCircle} ${borderGlow} border z-10 hover:scale-150 transition-transform`}></span>
                          
                          {/* Invisible hover area strictly for tooltip */}
                          <div className="absolute inset-0 z-20" />
                          
                          {/* Tooltip */}
                          <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-black/90 px-3 py-2 rounded-lg text-[10px] border border-white/20 text-white whitespace-nowrap shadow-2xl opacity-0 scale-90 group-hover/ping:opacity-100 group-hover/ping:scale-100 transition-all pointer-events-none z-30 transform-gpu">
                            <p className="font-bold text-xs uppercase tracking-wider mb-1 opacity-90">{m.type}</p>
                            <p className="opacity-80 max-w-[200px] truncate">{m.msg}</p>
                          </div>
                        </div>
                      </Overlay>
                    );
                  })}
                </Map>
                </div>
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
                {liveEvents.length === 0 && !isSyncing ? (
                  <p className="text-white/40 text-xs italic">No activity globally right now.</p>
                ) : liveEvents.map((event) => {
                  const colors: any = { vibecheck:"text-indigo-400 bg-indigo-500", mobility:"text-amber-400 bg-amber-500", governance:"text-rose-400 bg-rose-500", health:"text-blue-400 bg-blue-500", agri:"text-lime-400 bg-lime-500", jobs:"text-emerald-400 bg-emerald-500" };
                  const colorStr = colors[event.type] || "text-white bg-white";
                  return (
                    <div key={event.id} className="group relative pl-4 pb-4 border-l border-white/10 last:border-transparent last:pb-0">
                      <div className={`absolute -left-[5px] top-0.5 h-2.5 w-2.5 rounded-full bg-current ${colorStr.split(" ")[0]} shadow-[0_0_8px_currentColor]`} />
                      <p className="text-[10px] text-white/40 mb-1">{formatDistanceToNow(event.date, { addSuffix: true })} • {event.type.toUpperCase()}</p>
                      <p className="text-sm text-white/90 leading-tight group-hover:text-white transition-colors">{event.msg}</p>
                    </div>
                  );
                })}
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
