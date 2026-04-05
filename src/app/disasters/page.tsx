"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import {
  AlertTriangle, CloudLightning, Flame, Droplets, Mountain,
  Wind, Thermometer, Waves, Satellite, RefreshCcw, ExternalLink,
  MapPin, Filter, Globe, ChevronRight, X, Info, Radio,
  Activity, Zap, Shield
} from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Map, Overlay } from "pigeon-maps";
import { formatDistanceToNow } from "date-fns";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP);
}

function mapTiler(x: number, y: number, z: number) {
  return `https://cartodb-basemaps-a.global.ssl.fastly.net/dark_all/${z}/${x}/${y}.png`;
}

// Unified event type after merging all sources
interface UnifiedEvent {
  id: string;
  title: string;
  description: string | null;
  coordinates: [number, number]; // [lon, lat]
  date: string | null;
  severity: string;
  color: string;
  category: string;
  magnitude: number | null;
  magnitudeUnit: string | null;
  magnitudeText: string | null;
  source: string; // "NASA EONET" | "USGS" | "GDACS"
  sourceUrl: string | null;
  alertLevel: string | null;
  isInPhilippines: boolean;
  extra: Record<string, any>;
}

// Source badge colors
const SOURCE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  "USGS":       { bg: "bg-orange-500/15", text: "text-orange-400", border: "border-orange-500/30" },
  "GDACS":      { bg: "bg-red-500/15",    text: "text-red-400",    border: "border-red-500/30" },
  "NASA EONET": { bg: "bg-blue-500/15",   text: "text-blue-400",   border: "border-blue-500/30" },
};

// Source tabs
const DATA_SOURCES = [
  { id: "all", label: "All Sources", icon: Globe },
  { id: "USGS", label: "USGS Earthquakes", icon: Mountain },
  { id: "GDACS", label: "GDACS Alerts", icon: Shield },
  { id: "NASA EONET", label: "NASA EONET", icon: Satellite },
];

export default function DisasterMonitorPage() {
  const container = useRef<HTMLDivElement>(null);
  const [events, setEvents] = useState<UnifiedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<string[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<UnifiedEvent | null>(null);
  const [activeSource, setActiveSource] = useState("all");
  const [mapCenter, setMapCenter] = useState<[number, number]>([12.5, 122.0]);
  const [mapZoom, setMapZoom] = useState(6);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [counts, setCounts] = useState({ usgs: 0, gdacs: 0, eonet: 0, total: 0 });

  // Fetch and merge all 3 sources
  const fetchAllSources = useCallback(async () => {
    setLoading(true);
    const errs: string[] = [];
    const allEvents: UnifiedEvent[] = [];

    // 1) USGS Earthquakes (PH only)
    try {
      const res = await fetch("/api/usgs?days=30&minmag=2.5");
      const json = await res.json();
      if (json.success && json.data) {
        json.data.forEach((eq: any) => {
          allEvents.push({
            id: `usgs-${eq.id}`,
            title: eq.title,
            description: eq.place,
            coordinates: eq.coordinates,
            date: eq.date,
            severity: eq.severity,
            color: eq.color,
            category: "Earthquake",
            magnitude: eq.magnitude,
            magnitudeUnit: eq.magType?.toUpperCase(),
            magnitudeText: eq.depth ? `Depth: ${eq.depth} km` : null,
            source: "USGS",
            sourceUrl: eq.url,
            alertLevel: eq.alert,
            isInPhilippines: true,
            extra: { depth: eq.depth, tsunami: eq.tsunami, felt: eq.felt, significance: eq.significance, mmi: eq.mmi },
          });
        });
      }
    } catch (e: any) { errs.push(`USGS: ${e.message}`); }

    // 2) GDACS (PH filtered by server)
    try {
      const res = await fetch("/api/gdacs");
      const json = await res.json();
      if (json.success && json.data) {
        json.data.forEach((ev: any) => {
          allEvents.push({
            id: ev.id,
            title: ev.title,
            description: ev.description,
            coordinates: ev.coordinates,
            date: ev.date,
            severity: ev.severity,
            color: ev.color,
            category: ev.eventTypeLabel,
            magnitude: ev.magnitude,
            magnitudeUnit: ev.magnitudeUnit,
            magnitudeText: ev.magnitudeText,
            source: "GDACS",
            sourceUrl: ev.reportUrl,
            alertLevel: ev.alertLevel,
            isInPhilippines: true,
            extra: { eventName: ev.eventName, affectedCountries: ev.affectedCountries, glide: ev.glide, endDate: ev.endDate },
          });
        });
      }
    } catch (e: any) { errs.push(`GDACS: ${e.message}`); }

    // 3) NASA EONET (global, flagged for PH)
    try {
      const res = await fetch("/api/eonet");
      const json = await res.json();
      if (json.success && json.data) {
        json.data.forEach((ev: any) => {
          allEvents.push({
            id: `eonet-${ev.id}`,
            title: ev.title,
            description: ev.description,
            coordinates: ev.coordinates,
            date: ev.date,
            severity: ev.severity,
            color: ev.color,
            category: ev.categoryTitle,
            magnitude: ev.magnitude,
            magnitudeUnit: ev.magnitudeUnit,
            magnitudeText: null,
            source: "NASA EONET",
            sourceUrl: ev.link,
            alertLevel: null,
            isInPhilippines: ev.isInPhilippines,
            extra: { track: ev.track, sources: ev.sources },
          });
        });
      }
    } catch (e: any) { errs.push(`EONET: ${e.message}`); }

    // Sort by severity then date
    const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3, minor: 4 };
    allEvents.sort((a, b) => {
      // PH first
      if (a.isInPhilippines !== b.isInPhilippines) return a.isInPhilippines ? -1 : 1;
      const sa = severityOrder[a.severity] ?? 4;
      const sb = severityOrder[b.severity] ?? 4;
      if (sa !== sb) return sa - sb;
      return new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime();
    });

    setEvents(allEvents);
    setErrors(errs);
    setCounts({
      usgs: allEvents.filter(e => e.source === "USGS").length,
      gdacs: allEvents.filter(e => e.source === "GDACS").length,
      eonet: allEvents.filter(e => e.source === "NASA EONET").length,
      total: allEvents.length,
    });
    setLastRefresh(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAllSources();
    const interval = setInterval(fetchAllSources, 2 * 60 * 1000); // 2 min auto-refresh
    return () => clearInterval(interval);
  }, [fetchAllSources]);

  const filteredEvents = activeSource === "all"
    ? events
    : events.filter(e => e.source === activeSource);

  const phEvents = filteredEvents.filter(e => e.isInPhilippines);
  const globalEvents = filteredEvents.filter(e => !e.isInPhilippines);

  const focusEvent = (event: UnifiedEvent) => {
    setSelectedEvent(event);
    if (event.coordinates[0] !== 0 && event.coordinates[1] !== 0) {
      setMapCenter([event.coordinates[1], event.coordinates[0]]);
      setMapZoom(9);
    }
  };

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    tl.fromTo(".dw-header", { y: -40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8 });
    tl.fromTo(".dw-stats", { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, stagger: 0.1 }, "-=0.4");
    tl.fromTo(".dw-map", { scale: 0.96, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.8 }, "-=0.3");
    tl.fromTo(".dw-sidebar", { x: 40, opacity: 0 }, { x: 0, opacity: 1, duration: 0.8 }, "-=0.4");
  }, { scope: container });

  return (
    <div className="min-h-screen" ref={container}>
      {/* ── HEADER ── */}
      <section className="dw-header relative pt-8 pb-4 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-red-900/10 via-transparent to-transparent pointer-events-none" />
        <div className="container mx-auto relative z-10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative h-14 w-14 flex items-center justify-center rounded-2xl bg-red-500/20 border border-red-500/30">
                <Satellite className="h-7 w-7 text-red-400" />
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                </span>
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight text-white">
                  Disaster<span className="text-red-400">Watch</span> <span className="text-white/30 text-lg font-normal">PH</span>
                </h1>
                <p className="text-sm text-white/50 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Real-time Multi-Source Disaster Monitoring • 3 Satellite Feeds
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1 bg-white/5 rounded-full px-3 py-2 border border-white/10 text-xs font-mono text-white/50">
                <RefreshCcw className={`h-3 w-3 ${loading ? "animate-spin text-emerald-400" : "text-white/30"}`} />
                Auto-refresh: 2min
              </div>
              <button
                onClick={fetchAllSources}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-red-500/20 border border-red-500/30 text-red-300 hover:bg-red-500/30 transition-all disabled:opacity-50"
              >
                <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ROW ── */}
      <section className="px-4 pb-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {/* Total */}
            <div className="dw-stats glass-card p-4 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-red-500/20 border border-red-500/30">
                <Activity className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{counts.total}</p>
                <p className="text-[10px] text-white/40 uppercase tracking-wider">Total Events</p>
              </div>
            </div>
            {/* PH */}
            <div className="dw-stats glass-card p-4 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-yellow-500/20 border border-yellow-500/30">
                <MapPin className="h-5 w-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{phEvents.length}</p>
                <p className="text-[10px] text-white/40 uppercase tracking-wider">🇵🇭 Philippines</p>
              </div>
            </div>
            {/* USGS */}
            <div className="dw-stats glass-card p-4 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-orange-500/20 border border-orange-500/30">
                <Mountain className="h-5 w-5 text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{counts.usgs}</p>
                <p className="text-[10px] text-white/40 uppercase tracking-wider">USGS Quakes</p>
              </div>
            </div>
            {/* GDACS */}
            <div className="dw-stats glass-card p-4 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-red-500/20 border border-red-500/30">
                <Shield className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{counts.gdacs}</p>
                <p className="text-[10px] text-white/40 uppercase tracking-wider">GDACS Alerts</p>
              </div>
            </div>
            {/* EONET */}
            <div className="dw-stats glass-card p-4 flex items-center gap-3 col-span-2 md:col-span-1">
              <div className="p-2 rounded-xl bg-blue-500/20 border border-blue-500/30">
                <Satellite className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{counts.eonet}</p>
                <p className="text-[10px] text-white/40 uppercase tracking-wider">NASA EONET</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SOURCE TABS ── */}
      <section className="px-4 pb-4">
        <div className="container mx-auto">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {DATA_SOURCES.map((src) => {
              const isActive = activeSource === src.id;
              return (
                <button
                  key={src.id}
                  onClick={() => setActiveSource(src.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all border ${
                    isActive
                      ? "bg-white/10 border-white/20 text-white"
                      : "bg-white/5 border-white/10 text-white/50 hover:text-white/80 hover:border-white/20"
                  }`}
                >
                  <src.icon className="h-4 w-4" />
                  {src.label}
                  {src.id !== "all" && (
                    <span className="text-xs opacity-60">
                      ({src.id === "USGS" ? counts.usgs : src.id === "GDACS" ? counts.gdacs : counts.eonet})
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── MAIN CONTENT: MAP + SIDEBAR ── */}
      <section className="px-4 pb-12">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* MAP */}
            <div className="dw-map lg:col-span-8">
              <div className="rounded-2xl overflow-hidden border border-white/10 bg-[#080c1d]/60 backdrop-blur-xl relative">
                {/* Map header */}
                <div className="p-3 border-b border-white/10 flex justify-between items-center bg-black/30">
                  <h2 className="text-sm font-semibold flex items-center gap-2 text-white">
                    <Radio className="h-4 w-4 text-red-400 animate-pulse" />
                    Philippines Disaster Map
                    <span className="text-white/40 font-normal ml-2">
                      {filteredEvents.length} active event{filteredEvents.length !== 1 && "s"}
                    </span>
                  </h2>
                  <div className="hidden md:flex items-center gap-2 text-[9px] font-mono">
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-red-500/20 text-red-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> USGS
                    </span>
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-rose-500/20 text-rose-300">
                      ◆ GDACS
                    </span>
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-blue-500/20 text-blue-300">
                      ◆ EONET
                    </span>
                  </div>
                </div>

                {/* Map */}
                <div className="relative" style={{ height: "550px" }}>
                  <Map
                    provider={mapTiler}
                    center={mapCenter}
                    zoom={mapZoom}
                    onBoundsChanged={({ center, zoom }) => {
                      setMapCenter(center);
                      setMapZoom(zoom);
                    }}
                    metaWheelZoom={true}
                  >
                    {filteredEvents.map((event, i) => {
                      if (!event.coordinates[0] && !event.coordinates[1]) return null;
                      const isSelected = selectedEvent?.id === event.id;
                      const isPH = event.isInPhilippines;
                      const isUSGS = event.source === "USGS";

                      return (
                        <Overlay
                          key={event.id}
                          anchor={[event.coordinates[1], event.coordinates[0]]}
                          offset={[8, 8]}
                        >
                          <div
                            className="relative group/marker cursor-pointer"
                            onClick={() => focusEvent(event)}
                          >
                            {/* Ping for critical or PH events */}
                            {(event.severity === "critical" || event.severity === "high" || isPH) && (
                              <span
                                className={`absolute inset-[-4px] ${isUSGS ? "rounded-full" : "rounded-sm rotate-45"} opacity-40 animate-ping`}
                                style={{
                                  background: event.color,
                                  animationDuration: event.severity === "critical" ? "1.5s" : "2.5s",
                                  animationDelay: `${(i % 10) * 200}ms`,
                                }}
                              />
                            )}

                            {/* Marker shape: USGS = circle, others = diamond */}
                            {isUSGS ? (
                              <div
                                className={`relative w-4 h-4 rounded-full border-2 transition-all z-10 ${
                                  isSelected ? "scale-[2]" : "hover:scale-150"
                                }`}
                                style={{
                                  background: event.color,
                                  borderColor: isSelected ? "#fff" : event.color,
                                  boxShadow: `0 0 ${isSelected ? "20" : "12"}px ${event.color}80`,
                                }}
                              />
                            ) : (
                              <div
                                className={`relative w-4 h-4 transform rotate-45 border-2 transition-all z-10 ${
                                  isSelected ? "scale-[2] rotate-0 rounded-md" : "hover:scale-150"
                                }`}
                                style={{
                                  background: event.color,
                                  borderColor: isSelected ? "#fff" : event.color,
                                  boxShadow: `0 0 ${isSelected ? "20" : "12"}px ${event.color}80`,
                                }}
                              />
                            )}

                            {/* PH flag */}
                            {isPH && !isSelected && (
                              <span className="absolute -top-2 -right-3 text-[8px] z-20">🇵🇭</span>
                            )}

                            {/* Tooltip */}
                            <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-black/95 px-4 py-3 rounded-xl text-[11px] border border-white/20 text-white shadow-2xl opacity-0 scale-90 group-hover/marker:opacity-100 group-hover/marker:scale-100 transition-all z-30 pointer-events-none min-w-[220px] max-w-[280px]">
                              <div className="flex items-center gap-2 mb-1.5">
                                <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border ${SOURCE_COLORS[event.source]?.bg} ${SOURCE_COLORS[event.source]?.text} ${SOURCE_COLORS[event.source]?.border}`}>
                                  {event.source}
                                </span>
                                <span className="text-[9px] font-bold uppercase" style={{ color: event.color }}>
                                  {event.category}
                                </span>
                              </div>
                              <p className="text-white/90 font-semibold leading-tight">{event.title}</p>
                              {event.magnitude != null && (
                                <p className="text-white/60 mt-1">
                                  {event.source === "USGS" ? `M ${event.magnitude}` : `${event.magnitude} ${event.magnitudeUnit || ""}`}
                                  {event.magnitudeText && ` · ${event.magnitudeText}`}
                                </p>
                              )}
                              {event.date && (
                                <p className="text-white/40 mt-1 text-[10px]">
                                  {formatDistanceToNow(new Date(event.date), { addSuffix: true })}
                                </p>
                              )}
                              {event.alertLevel && (
                                <span className="inline-block mt-2 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border" style={{ background: `${event.color}20`, color: event.color, borderColor: `${event.color}40` }}>
                                  {event.alertLevel} Alert
                                </span>
                              )}
                            </div>
                          </div>
                        </Overlay>
                      );
                    })}
                  </Map>

                  {/* Loading overlay */}
                  {loading && events.length === 0 && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-20">
                      <div className="flex flex-col items-center gap-3">
                        <Satellite className="h-8 w-8 text-red-400 animate-pulse" />
                        <p className="text-sm text-white/70">Fetching from 3 satellite feeds...</p>
                        <div className="flex gap-2 text-[10px]">
                          <span className="px-2 py-1 rounded bg-orange-500/20 text-orange-300 animate-pulse">USGS</span>
                          <span className="px-2 py-1 rounded bg-red-500/20 text-red-300 animate-pulse">GDACS</span>
                          <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-300 animate-pulse">NASA</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Attribution */}
              <div className="mt-3 flex flex-wrap items-center gap-3 justify-end text-[10px] text-white/30">
                <span className="flex items-center gap-1"><Mountain className="h-3 w-3" /> USGS Earthquake Hazards</span>
                <span>•</span>
                <span className="flex items-center gap-1"><Shield className="h-3 w-3" /> UN GDACS</span>
                <span>•</span>
                <span className="flex items-center gap-1"><Satellite className="h-3 w-3" /> NASA EONET</span>
              </div>
            </div>

            {/* SIDEBAR */}
            <div className="dw-sidebar lg:col-span-4 flex flex-col gap-4">
              {/* Selected Event Detail */}
              {selectedEvent && (
                <div
                  className="rounded-2xl p-5 border backdrop-blur-md relative overflow-hidden animate-slide-up"
                  style={{
                    background: `linear-gradient(135deg, ${selectedEvent.color}15, transparent)`,
                    borderColor: `${selectedEvent.color}30`,
                  }}
                >
                  <button
                    onClick={() => setSelectedEvent(null)}
                    className="absolute top-3 right-3 p-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    <X className="h-4 w-4 text-white/60" />
                  </button>

                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${SOURCE_COLORS[selectedEvent.source]?.bg} ${SOURCE_COLORS[selectedEvent.source]?.text} ${SOURCE_COLORS[selectedEvent.source]?.border}`}>
                      {selectedEvent.source}
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                      style={{ background: `${selectedEvent.color}20`, color: selectedEvent.color, border: `1px solid ${selectedEvent.color}30` }}>
                      {selectedEvent.category}
                    </span>
                    {selectedEvent.alertLevel && (
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border"
                        style={{ background: `${selectedEvent.color}15`, color: selectedEvent.color, borderColor: `${selectedEvent.color}30` }}>
                        {selectedEvent.alertLevel} Alert
                      </span>
                    )}
                    {selectedEvent.isInPhilippines && (
                      <span className="text-xs bg-red-500/20 text-red-300 border border-red-500/30 px-2 py-0.5 rounded-full font-bold">🇵🇭 PH</span>
                    )}
                  </div>

                  <h3 className="text-lg font-display font-bold text-white mb-2 leading-tight">{selectedEvent.title}</h3>

                  {selectedEvent.description && (
                    <p className="text-sm text-white/60 mb-3 leading-relaxed" dangerouslySetInnerHTML={{ __html: selectedEvent.description }} />
                  )}

                  <div className="space-y-2 text-sm">
                    {selectedEvent.magnitude != null && (
                      <div className="flex items-center gap-2 text-white/70">
                        <Zap className="h-3.5 w-3.5 text-white/40" />
                        <span>
                          {selectedEvent.source === "USGS"
                            ? <>Magnitude: <strong className="text-white">M {selectedEvent.magnitude}</strong></>
                            : <>Severity: <strong className="text-white">{selectedEvent.magnitude} {selectedEvent.magnitudeUnit}</strong></>}
                        </span>
                      </div>
                    )}
                    {selectedEvent.magnitudeText && (
                      <div className="flex items-center gap-2 text-white/70">
                        <Info className="h-3.5 w-3.5 text-white/40" />
                        <span>{selectedEvent.magnitudeText}</span>
                      </div>
                    )}
                    {selectedEvent.extra?.depth && (
                      <div className="flex items-center gap-2 text-white/70">
                        <Info className="h-3.5 w-3.5 text-white/40" />
                        <span>Depth: <strong className="text-white">{selectedEvent.extra.depth} km</strong></span>
                      </div>
                    )}
                    {selectedEvent.extra?.tsunami && (
                      <div className="flex items-center gap-2 text-yellow-400 font-bold">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        <span>⚠️ Tsunami Warning Active</span>
                      </div>
                    )}
                    {selectedEvent.extra?.felt && (
                      <div className="flex items-center gap-2 text-white/70">
                        <Info className="h-3.5 w-3.5 text-white/40" />
                        <span>{selectedEvent.extra.felt} people felt it</span>
                      </div>
                    )}
                    {selectedEvent.date && (
                      <div className="flex items-center gap-2 text-white/70">
                        <Info className="h-3.5 w-3.5 text-white/40" />
                        <span>Reported: <strong className="text-white">{formatDistanceToNow(new Date(selectedEvent.date), { addSuffix: true })}</strong></span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-white/70">
                      <MapPin className="h-3.5 w-3.5 text-white/40" />
                      <span>{selectedEvent.coordinates[1].toFixed(3)}°N, {selectedEvent.coordinates[0].toFixed(3)}°E</span>
                    </div>
                    {selectedEvent.extra?.affectedCountries && (
                      <div className="flex items-center gap-2 text-white/70">
                        <Globe className="h-3.5 w-3.5 text-white/40" />
                        <span className="text-xs">{selectedEvent.extra.affectedCountries}</span>
                      </div>
                    )}
                  </div>

                  {selectedEvent.sourceUrl && (
                    <a
                      href={selectedEvent.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      <ExternalLink className="h-3 w-3" />
                      View full report on {selectedEvent.source}
                    </a>
                  )}
                </div>
              )}

              {/* Event Feed */}
              <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md flex flex-col overflow-hidden flex-1" style={{ maxHeight: selectedEvent ? "380px" : "580px" }}>
                <div className="p-3 border-b border-white/10 bg-black/20 shrink-0 flex items-center justify-between">
                  <h3 className="text-sm font-semibold flex items-center gap-2 text-white">
                    <AlertTriangle className="h-4 w-4 text-red-400" />
                    {activeSource === "all" ? "All Active Events" : `${activeSource} Events`}
                    <span className="text-white/40 font-normal">({filteredEvents.length})</span>
                  </h3>
                  {phEvents.length > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/20">
                      🇵🇭 {phEvents.length} in PH
                    </span>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar">
                  {loading && filteredEvents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-3">
                      <RefreshCcw className="h-6 w-6 text-white/30 animate-spin" />
                      <p className="text-xs text-white/40">Fetching multi-source data...</p>
                    </div>
                  ) : filteredEvents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-3">
                      <Globe className="h-8 w-8 text-white/20" />
                      <p className="text-xs text-white/40">No events from this source</p>
                    </div>
                  ) : (
                    filteredEvents.map((event) => {
                      const isActive = selectedEvent?.id === event.id;
                      const srcColor = SOURCE_COLORS[event.source];
                      const isUSGS = event.source === "USGS";
                      return (
                        <button
                          key={event.id}
                          onClick={() => focusEvent(event)}
                          className={`w-full text-left p-3 rounded-xl border transition-all group/event ${
                            isActive
                              ? "border-white/20 bg-white/10"
                              : "border-transparent hover:border-white/10 hover:bg-white/5"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {/* Marker shape indicator */}
                            <div
                              className={`mt-1 w-3 h-3 shrink-0 border ${isUSGS ? "rounded-full" : "rounded-sm rotate-45"}`}
                              style={{
                                background: event.color,
                                borderColor: event.color,
                                boxShadow: `0 0 8px ${event.color}50`,
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                                <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border ${srcColor?.bg} ${srcColor?.text} ${srcColor?.border}`}>
                                  {event.source}
                                </span>
                                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                                  style={{ background: `${event.color}20`, color: event.color }}>
                                  {event.category}
                                </span>
                                {event.isInPhilippines && <span className="text-[9px]">🇵🇭</span>}
                                {event.severity === "critical" && (
                                  <span className="text-[8px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full font-bold uppercase animate-pulse">
                                    Critical
                                  </span>
                                )}
                                {event.extra?.tsunami && (
                                  <span className="text-[8px] bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded-full font-bold uppercase">
                                    Tsunami
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-white/90 font-medium leading-tight truncate group-hover/event:text-white">
                                {event.title}
                              </p>
                              <div className="flex items-center gap-3 mt-1 text-[10px] text-white/40">
                                {event.date && <span>{formatDistanceToNow(new Date(event.date), { addSuffix: true })}</span>}
                                {event.magnitude != null && (
                                  <span className="font-semibold" style={{ color: event.color }}>
                                    {event.source === "USGS" ? `M ${event.magnitude}` : `${event.magnitude} ${event.magnitudeUnit || ""}`}
                                  </span>
                                )}
                                {event.alertLevel && (
                                  <span style={{ color: event.color }}>{event.alertLevel}</span>
                                )}
                              </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-white/20 group-hover/event:text-white/50 shrink-0 mt-1" />
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Error display */}
              {errors.length > 0 && (
                <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3">
                  <p className="text-xs text-red-400 font-semibold mb-1">⚠️ Some feeds failed:</p>
                  {errors.map((err, i) => (
                    <p key={i} className="text-[10px] text-red-300/70">{err}</p>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
