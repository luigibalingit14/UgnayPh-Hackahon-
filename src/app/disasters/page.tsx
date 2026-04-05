"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import {
  AlertTriangle, CloudLightning, Flame, Droplets, Mountain,
  Wind, Thermometer, Waves, Satellite, RefreshCcw, ExternalLink,
  MapPin, Filter, Globe, ChevronRight, X, Info
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

interface EONETEvent {
  id: string;
  title: string;
  description: string | null;
  link: string;
  categoryId: string;
  categoryTitle: string;
  color: string;
  icon: string;
  severity: string;
  coordinates: [number, number];
  isInPhilippines: boolean;
  date: string | null;
  magnitude: number | null;
  magnitudeUnit: string | null;
  sources: { id: string; url: string }[];
  track: { coordinates: [number, number]; date: string; magnitude: number | null; magnitudeUnit: string | null }[];
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  severeStorms: <CloudLightning className="h-4 w-4" />,
  earthquakes: <Mountain className="h-4 w-4" />,
  volcanoes: <Flame className="h-4 w-4" />,
  wildfires: <Flame className="h-4 w-4" />,
  floods: <Droplets className="h-4 w-4" />,
  landslides: <Mountain className="h-4 w-4" />,
  drought: <Thermometer className="h-4 w-4" />,
  tempExtremes: <Thermometer className="h-4 w-4" />,
  dustHaze: <Wind className="h-4 w-4" />,
  snow: <Waves className="h-4 w-4" />,
  seaLakeIce: <Waves className="h-4 w-4" />,
  waterColor: <Waves className="h-4 w-4" />,
  manmade: <AlertTriangle className="h-4 w-4" />,
};

const ALL_CATEGORIES = [
  { id: "severeStorms", label: "Severe Storms", color: "#ef4444" },
  { id: "earthquakes", label: "Earthquakes", color: "#dc2626" },
  { id: "volcanoes", label: "Volcanoes", color: "#f97316" },
  { id: "wildfires", label: "Wildfires", color: "#f97316" },
  { id: "floods", label: "Floods", color: "#3b82f6" },
  { id: "landslides", label: "Landslides", color: "#6366f1" },
  { id: "drought", label: "Drought", color: "#eab308" },
  { id: "tempExtremes", label: "Temp Extremes", color: "#eab308" },
  { id: "dustHaze", label: "Dust & Haze", color: "#a3a3a3" },
  { id: "snow", label: "Snow", color: "#93c5fd" },
  { id: "seaLakeIce", label: "Sea & Lake Ice", color: "#67e8f9" },
  { id: "waterColor", label: "Water Color", color: "#2dd4bf" },
  { id: "manmade", label: "Manmade", color: "#a855f7" },
];

export default function DisasterMonitorPage() {
  const container = useRef<HTMLDivElement>(null);
  const [events, setEvents] = useState<EONETEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [phOnly, setPhOnly] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EONETEvent | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([14.5995, 121.0]);
  const [mapZoom, setMapZoom] = useState(5);
  const [stats, setStats] = useState({ total: 0, phCount: 0 });

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (phOnly) params.set("ph", "true");
      if (selectedCategories.length > 0) params.set("category", selectedCategories.join(","));

      const res = await fetch(`/api/eonet?${params.toString()}`);
      const json = await res.json();

      if (!json.success) throw new Error(json.error);

      setEvents(json.data || []);
      setStats({ total: json.total || json.data?.length || 0, phCount: json.phCount || 0 });
    } catch (err: any) {
      setError(err.message || "Failed to fetch events");
    } finally {
      setLoading(false);
    }
  }, [phOnly, selectedCategories]);

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, 5 * 60 * 1000); // refresh every 5 minutes
    return () => clearInterval(interval);
  }, [fetchEvents]);

  const toggleCategory = (catId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(catId) ? prev.filter((c) => c !== catId) : [...prev, catId]
    );
  };

  const focusEvent = (event: EONETEvent) => {
    setSelectedEvent(event);
    if (event.coordinates[0] !== 0 && event.coordinates[1] !== 0) {
      setMapCenter([event.coordinates[1], event.coordinates[0]]);
      setMapZoom(8);
    }
  };

  const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  const sortedEvents = [...events].sort((a, b) => {
    const sa = severityOrder[a.severity] ?? 3;
    const sb = severityOrder[b.severity] ?? 3;
    if (sa !== sb) return sa - sb;
    return new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime();
  });

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    tl.fromTo(".disaster-header", { y: -40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8 });
    tl.fromTo(".disaster-map-container", { scale: 0.95, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.8 }, "-=0.4");
    tl.fromTo(".disaster-sidebar", { x: 40, opacity: 0 }, { x: 0, opacity: 1, duration: 0.8 }, "-=0.4");
  }, { scope: container });

  return (
    <div className="min-h-screen" ref={container}>
      {/* Header */}
      <section className="disaster-header relative pt-8 pb-6 px-4 overflow-hidden">
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
                  Disaster<span className="text-red-400">Watch</span>
                </h1>
                <p className="text-sm text-white/50 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Powered by NASA EONET • Real-time Natural Event Tracking
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Stats pills */}
              <div className="flex items-center gap-2 bg-white/5 rounded-full px-4 py-2 border border-white/10 text-sm">
                <Globe className="h-4 w-4 text-blue-400" />
                <span className="text-white/70 font-mono">{stats.total} Global</span>
                <span className="text-white/30">|</span>
                <MapPin className="h-4 w-4 text-red-400" />
                <span className="text-red-300 font-mono">{stats.phCount} PH</span>
              </div>

              {/* PH Toggle */}
              <button
                onClick={() => {
                  setPhOnly(!phOnly);
                  if (!phOnly) {
                    setMapCenter([12.8, 122.0]);
                    setMapZoom(6);
                  } else {
                    setMapCenter([14.5995, 121.0]);
                    setMapZoom(5);
                  }
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all border ${
                  phOnly
                    ? "bg-red-500/20 border-red-500/40 text-red-300"
                    : "bg-white/5 border-white/10 text-white/60 hover:text-white hover:border-white/20"
                }`}
              >
                🇵🇭 {phOnly ? "PH Only" : "Show PH Only"}
              </button>

              {/* Filter toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all border ${
                  showFilters
                    ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-300"
                    : "bg-white/5 border-white/10 text-white/60 hover:text-white hover:border-white/20"
                }`}
              >
                <Filter className="h-4 w-4" /> Categories
              </button>

              {/* Refresh */}
              <button
                onClick={fetchEvents}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-white/5 border border-white/10 text-white/60 hover:text-white hover:border-white/20 transition-all disabled:opacity-50"
              >
                <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* Category Filter Bar */}
          {showFilters && (
            <div className="mt-4 flex flex-wrap gap-2 p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md animate-slide-up">
              {ALL_CATEGORIES.map((cat) => {
                const active = selectedCategories.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    onClick={() => toggleCategory(cat.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                      active
                        ? "border-white/30 text-white"
                        : "border-white/10 text-white/50 hover:text-white/80 hover:border-white/20"
                    }`}
                    style={active ? { background: `${cat.color}25`, borderColor: `${cat.color}50` } : {}}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ background: cat.color }} />
                    {cat.label}
                    {active && <X className="h-3 w-3 ml-1" />}
                  </button>
                );
              })}
              {selectedCategories.length > 0 && (
                <button
                  onClick={() => setSelectedCategories([])}
                  className="text-xs text-white/40 hover:text-white/70 transition-colors underline underline-offset-2 ml-2"
                >
                  Clear all
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Main Content */}
      <section className="px-4 pb-12">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Map */}
            <div className="disaster-map-container lg:col-span-8">
              <div className="rounded-2xl overflow-hidden border border-white/10 bg-[#080c1d]/60 backdrop-blur-xl relative" style={{ minHeight: "600px" }}>
                {/* Map header */}
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/30">
                  <h2 className="text-sm font-semibold flex items-center gap-2 text-white">
                    <Satellite className="h-4 w-4 text-red-400" />
                    Global Event Map
                    <span className="text-white/40 font-normal ml-2">
                      {events.length} active event{events.length !== 1 && "s"}
                    </span>
                  </h2>
                  <div className="flex items-center gap-2 text-[10px] font-mono">
                    <span className="flex items-center gap-1 px-2 py-1 rounded bg-red-500/20 text-red-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Critical
                    </span>
                    <span className="flex items-center gap-1 px-2 py-1 rounded bg-orange-500/20 text-orange-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-500" /> High
                    </span>
                    <span className="flex items-center gap-1 px-2 py-1 rounded bg-yellow-500/20 text-yellow-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" /> Medium
                    </span>
                    <span className="flex items-center gap-1 px-2 py-1 rounded bg-blue-500/20 text-blue-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Low
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
                    {sortedEvents.map((event, i) => {
                      if (!event.coordinates[0] && !event.coordinates[1]) return null;
                      const isSelected = selectedEvent?.id === event.id;
                      const isPH = event.isInPhilippines;

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
                            {/* Outer ping for critical/PH events */}
                            {(event.severity === "critical" || isPH) && (
                              <span
                                className="absolute inset-[-4px] rounded-full opacity-50 animate-ping"
                                style={{
                                  background: event.color,
                                  animationDuration: "2s",
                                  animationDelay: `${i * 200}ms`,
                                }}
                              />
                            )}

                            {/* Diamond marker */}
                            <div
                              className={`relative w-4 h-4 transform rotate-45 border-2 transition-all z-10 ${
                                isSelected ? "scale-[2] rotate-0 rounded-md" : "hover:scale-150"
                              }`}
                              style={{
                                background: event.color,
                                borderColor: isSelected ? "#fff" : `${event.color}`,
                                boxShadow: `0 0 ${isSelected ? "20" : "12"}px ${event.color}80`,
                              }}
                            />

                            {/* PH flag badge */}
                            {isPH && !isSelected && (
                              <span className="absolute -top-2 -right-3 text-[8px]">🇵🇭</span>
                            )}

                            {/* Tooltip */}
                            <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-black/95 px-4 py-3 rounded-xl text-[11px] border border-white/20 text-white shadow-2xl opacity-0 scale-90 group-hover/marker:opacity-100 group-hover/marker:scale-100 transition-all z-30 pointer-events-none min-w-[200px] max-w-[260px]">
                              <p className="font-bold text-xs mb-1" style={{ color: event.color }}>
                                {event.categoryTitle}
                              </p>
                              <p className="text-white/90 font-semibold leading-tight">{event.title}</p>
                              {event.magnitude && (
                                <p className="text-white/60 mt-1">
                                  Magnitude: {event.magnitude} {event.magnitudeUnit}
                                </p>
                              )}
                              {event.date && (
                                <p className="text-white/40 mt-1">
                                  {formatDistanceToNow(new Date(event.date), { addSuffix: true })}
                                </p>
                              )}
                              {isPH && (
                                <span className="inline-block mt-2 px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 text-[9px] font-bold uppercase">
                                  🇵🇭 Philippines Region
                                </span>
                              )}
                            </div>
                          </div>
                        </Overlay>
                      );
                    })}
                  </Map>

                  {/* Loading overlay */}
                  {loading && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-20">
                      <div className="flex flex-col items-center gap-3">
                        <Satellite className="h-8 w-8 text-red-400 animate-pulse" />
                        <p className="text-sm text-white/70">Fetching NASA satellite data...</p>
                      </div>
                    </div>
                  )}

                  {/* Error overlay */}
                  {error && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
                      <div className="text-center space-y-3">
                        <AlertTriangle className="h-10 w-10 text-red-400 mx-auto" />
                        <p className="text-sm text-red-300">{error}</p>
                        <button onClick={fetchEvents} className="text-xs text-white/60 hover:text-white underline">
                          Try again
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* NASA Attribution */}
              <div className="mt-3 flex items-center gap-2 justify-end">
                <span className="text-[10px] text-white/30 flex items-center gap-1">
                  <Satellite className="h-3 w-3" />
                  Data powered by NASA EONET (Earth Observatory Natural Event Tracker) · eonet.gsfc.nasa.gov
                </span>
              </div>
            </div>

            {/* Event List Sidebar */}
            <div className="disaster-sidebar lg:col-span-4 flex flex-col gap-4">
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

                  <div className="flex items-center gap-2 mb-3">
                    <div
                      className="p-2 rounded-lg"
                      style={{ background: `${selectedEvent.color}20`, border: `1px solid ${selectedEvent.color}30` }}
                    >
                      {CATEGORY_ICONS[selectedEvent.categoryId] || <AlertTriangle className="h-4 w-4" />}
                    </div>
                    <span
                      className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                      style={{
                        background: `${selectedEvent.color}20`,
                        color: selectedEvent.color,
                        border: `1px solid ${selectedEvent.color}30`,
                      }}
                    >
                      {selectedEvent.categoryTitle}
                    </span>
                    {selectedEvent.isInPhilippines && (
                      <span className="text-xs bg-red-500/20 text-red-300 border border-red-500/30 px-2 py-0.5 rounded-full font-bold">
                        🇵🇭 PH
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-display font-bold text-white mb-2 leading-tight">
                    {selectedEvent.title}
                  </h3>

                  {selectedEvent.description && (
                    <p className="text-sm text-white/60 mb-3">{selectedEvent.description}</p>
                  )}

                  <div className="space-y-2 text-sm">
                    {selectedEvent.magnitude && (
                      <div className="flex items-center gap-2 text-white/70">
                        <Info className="h-3.5 w-3.5 text-white/40" />
                        <span>
                          Magnitude: <strong className="text-white">{selectedEvent.magnitude} {selectedEvent.magnitudeUnit}</strong>
                        </span>
                      </div>
                    )}
                    {selectedEvent.date && (
                      <div className="flex items-center gap-2 text-white/70">
                        <Info className="h-3.5 w-3.5 text-white/40" />
                        <span>
                          Last update: <strong className="text-white">{formatDistanceToNow(new Date(selectedEvent.date), { addSuffix: true })}</strong>
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-white/70">
                      <MapPin className="h-3.5 w-3.5 text-white/40" />
                      <span>
                        {selectedEvent.coordinates[1].toFixed(3)}°, {selectedEvent.coordinates[0].toFixed(3)}°
                      </span>
                    </div>
                    {selectedEvent.track.length > 1 && (
                      <div className="flex items-center gap-2 text-white/70">
                        <Info className="h-3.5 w-3.5 text-white/40" />
                        <span>{selectedEvent.track.length} tracking points</span>
                      </div>
                    )}
                  </div>

                  {selectedEvent.sources.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-white/10">
                      {selectedEvent.sources.map((src) => (
                        <a
                          key={src.id}
                          href={src.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Source: {src.id}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Event Feed */}
              <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md flex flex-col overflow-hidden flex-1" style={{ maxHeight: selectedEvent ? "400px" : "600px" }}>
                <div className="p-4 border-b border-white/10 bg-black/20 shrink-0 flex items-center justify-between">
                  <h3 className="text-sm font-semibold flex items-center gap-2 text-white">
                    <AlertTriangle className="h-4 w-4 text-red-400" />
                    Active Events
                    <span className="text-white/40 font-normal">({sortedEvents.length})</span>
                  </h3>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                  {loading && sortedEvents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-3">
                      <RefreshCcw className="h-6 w-6 text-white/30 animate-spin" />
                      <p className="text-xs text-white/40">Loading NASA data...</p>
                    </div>
                  ) : sortedEvents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-3">
                      <Globe className="h-8 w-8 text-white/20" />
                      <p className="text-xs text-white/40">No events match your filters</p>
                    </div>
                  ) : (
                    sortedEvents.map((event) => {
                      const isActive = selectedEvent?.id === event.id;
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
                            <div
                              className="mt-0.5 w-3 h-3 rounded-sm rotate-45 shrink-0 border"
                              style={{
                                background: event.color,
                                borderColor: event.color,
                                boxShadow: `0 0 8px ${event.color}50`,
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span
                                  className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                                  style={{
                                    background: `${event.color}20`,
                                    color: event.color,
                                  }}
                                >
                                  {event.categoryTitle}
                                </span>
                                {event.isInPhilippines && (
                                  <span className="text-[9px]">🇵🇭</span>
                                )}
                                {event.severity === "critical" && (
                                  <span className="text-[9px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full font-bold uppercase">
                                    Critical
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-white/90 font-medium leading-tight truncate group-hover/event:text-white">
                                {event.title}
                              </p>
                              <div className="flex items-center gap-3 mt-1 text-[10px] text-white/40">
                                {event.date && (
                                  <span>{formatDistanceToNow(new Date(event.date), { addSuffix: true })}</span>
                                )}
                                {event.magnitude && (
                                  <span>
                                    {event.magnitude} {event.magnitudeUnit}
                                  </span>
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
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
