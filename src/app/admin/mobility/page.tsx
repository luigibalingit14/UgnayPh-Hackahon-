"use client";

import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { Loader2, MapPin, Activity, CheckCircle, AlertTriangle } from "lucide-react";
import { Map, Overlay } from "pigeon-maps";

function mapTiler(x: number, y: number, z: number) {
  return `https://cartodb-basemaps-a.global.ssl.fastly.net/light_all/${z}/${x}/${y}.png`;
}

// Helper coordinates mimicking real ones
const CITY_COORDS: Record<string, [number, number]> = {
  "manila": [14.5995, 120.9842],
  "quezon": [14.6760, 121.0437],
  "makati": [14.5547, 121.0244],
  "taguig": [14.5204, 121.0538],
  "pasig": [14.5764, 121.0851],
  "cebu": [10.3157, 123.8854],
  "davao": [7.1907, 125.4553],
  "caloocan": [14.6465, 120.9733]
};

function getApproxCoords(location: string): [number, number] {
  if (!location) return [14.5995, 120.9842];
  const locLower = location.toLowerCase();
  for (const [key, coords] of Object.entries(CITY_COORDS)) {
    if (locLower.includes(key)) {
      return [coords[0] + (Math.random() - 0.5) * 0.01, coords[1] + (Math.random() - 0.5) * 0.01];
    }
  }
  return [14.5995 + (Math.random() - 0.5) * 0.1, 120.9842 + (Math.random() - 0.5) * 0.1];
}

export default function MobilityAdminPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [trafficNodes, setTrafficNodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isAutoSimulating, setIsAutoSimulating] = useState(false);

  const fetchData = async () => {
    try {
      // Fetch incidents
      const res = await fetch("/api/admin/sync").then(r => r.json());
      if (res.success && res.data) {
        const mdata = (res.data.mobility || []).map((m: any) => ({
          ...m,
          latlng: getApproxCoords(m.city || m.location)
        }));
        setReports(mdata);
      }

      // Fetch literal traffic nodes
      const tRes = await fetch("/api/admin/traffic").then(r => r.json());
      if (tRes.success) {
         setTrafficNodes(tRes.data);
      }
    } catch(err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Background polling for normal state
    const fetchInterval = setInterval(() => {
        if (!isAutoSimulating) {
           fetch("/api/admin/traffic").then(r => r.json()).then(res => { if(res.success) setTrafficNodes(res.data); }).catch(() => {});
        }
    }, 10000);
    return () => clearInterval(fetchInterval);
  }, [isAutoSimulating]);

  // The Magic Hackathon Auto-Simulator Frame Loop
  useEffect(() => {
    let simInterval: NodeJS.Timeout;
    if (isAutoSimulating) {
      simInterval = setInterval(async () => {
         try {
           setIsSimulating(true);
           const p1 = fetch('/api/admin/traffic/simulate', { method: "POST" });
           const p2 = fetch("/api/admin/traffic").then(r => r.json());
           await p1;
           const newTraffic = await p2;
           if(newTraffic.success) setTrafficNodes(newTraffic.data);
         } catch(e) {} finally {
           setIsSimulating(false);
         }
      }, 3000); // Pulse every 3 seconds!
    }
    return () => clearInterval(simInterval);
  }, [isAutoSimulating]);

  const handleToggleAutoSimulate = () => {
    setIsAutoSimulating(!isAutoSimulating);
  };

  const handleToggleResolve = async (id: string, currentStatus: boolean) => {
    setReports(prev => prev.map(r => r.id === id ? { ...r, is_resolved: !currentStatus } : r));
    try {
      await fetch('/api/admin/resolve', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table: "mobility_reports", id, updatePayload: { is_resolved: !currentStatus } })
      });
    } catch (e) {
      fetchData();
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-8rem)]">
      
      {/* Left List Pane */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
        <div className="p-6 border-b border-slate-200 bg-white shrink-0">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Activity className="h-5 w-5 text-amber-500" />
            Active Dispatch Items
          </h2>
          <p className="text-sm text-slate-500">Route DPWH teams to clear road hazards</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50 custom-scrollbar">
          {loading ? (
             <div className="h-full flex items-center justify-center flex-col text-slate-400">
               <Loader2 className="h-8 w-8 animate-spin mb-4 text-amber-500" />
               <p>Loading hazard maps...</p>
             </div>
          ) : reports.length === 0 ? (
             <div className="p-8 text-center text-slate-400">No active reports</div>
          ) : reports.map(report => (
             <div key={report.id} className={`p-4 rounded-xl border transition-all ${report.is_resolved ? "bg-emerald-50 border-emerald-100 opacity-60" : "bg-white border-slate-200 shadow-sm hover:shadow-md"}`}>
               <div className="flex justify-between items-start mb-2">
                 <div className="flex items-center gap-2">
                   <div className={`px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase ${report.severity === 'high' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                     {report.severity || "NORMAL"}
                   </div>
                   <span className="text-xs text-slate-400 font-semibold">{formatDistanceToNow(new Date(report.created_at || Date.now()), { addSuffix: true })}</span>
                 </div>
                 
                 <button
                    onClick={() => handleToggleResolve(report.id, report.is_resolved)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors border shadow-sm
                      ${report.is_resolved 
                        ? 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50' 
                        : 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-500 hover:text-white'
                      }`}
                  >
                   {report.is_resolved ? "Reopen Case" : "Clear Hazard"}
                 </button>
               </div>
               
               <h3 className="text-sm font-bold text-slate-800 mb-1 capitalize">{report.incident_type?.replace('_', ' ')}</h3>
               <p className="text-xs text-slate-600 mb-3">{report.description}</p>
               
               <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium">
                 <MapPin className="h-3.5 w-3.5" />
                 {report.location}, <span className="uppercase">{report.city || 'NCR'}</span>
               </div>
             </div>
          ))}
        </div>
      </div>

      {/* Right Map Pane */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative min-h-[400px]">
        {/* Top Controls Float */}
        <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 pointer-events-none">
           {/* Legend Box */}
           <div className="bg-white/90 backdrop-blur-md px-4 py-3 rounded-xl shadow-lg border border-slate-100 flex gap-4 text-xs font-bold text-slate-700 pointer-events-auto">
             <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)] animate-pulse" /> Heavy Traffic</div>
             <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]" /> Moderate</div>
             <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" /> Light / Fast</div>
           </div>
        </div>

        <div className="absolute top-4 right-4 z-10 pointer-events-auto flex flex-col items-end gap-2">
           {isAutoSimulating && (
             <div className="bg-rose-500/10 border border-rose-500/20 text-rose-600 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider flex items-center gap-1.5 animate-pulse backdrop-blur-sm shadow-sm">
               <div className="h-1.5 w-1.5 bg-rose-500 rounded-full animate-ping" />
               AI LIVE FEED ACTIVE
             </div>
           )}
           <button 
             onClick={handleToggleAutoSimulate}
             className={`px-4 py-2.5 rounded-xl shadow-lg border text-xs font-bold flex items-center gap-2 transition-all active:scale-95
               ${isAutoSimulating 
                 ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200' 
                 : 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-800'
               }`}
           >
             {isSimulating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Activity className={`h-4 w-4 ${isAutoSimulating ? 'text-rose-600 animate-pulse' : ''}`} />}
             {isAutoSimulating ? "Stop AI Feed" : "Simulate AI Live Traffic"}
           </button>
        </div>

        <Map 
          provider={mapTiler} 
          defaultCenter={[14.6060, 121.0350]} // Center around Metro Manila Traffic Hub
          defaultZoom={12}
          metaWheelZoom={true}
        >
          {/* Traffic Nodes (Google Maps/Waze style speed trackers) */}
          {trafficNodes.map((node) => {
            const isHeavy = node.status === 'heavy';
            const isMedium = node.status === 'medium';
            const colorClass = isHeavy ? 'bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.8)]' : 
                               isMedium ? 'bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.8)]' : 
                               'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]';
            
            return (
              <Overlay key={`traffic-${node.id}`} anchor={[node.lat, node.lng]} offset={[10, 10]}>
                 <div className="relative group/traffic cursor-pointer origin-center">
                    {/* Pulsing Core */}
                    <div className={`w-5 h-5 rounded-full ${colorClass} ${isHeavy ? 'animate-pulse' : ''} border-2 border-white`} />
                    
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-900 border border-slate-700 text-white text-[10px] px-3 py-2 rounded-lg shadow-xl opacity-0 scale-90 group-hover/traffic:opacity-100 group-hover/traffic:scale-100 transition-all pointer-events-none whitespace-nowrap z-40">
                      <div className="flex justify-between items-center gap-4 mb-1 border-b border-slate-700 pb-1">
                        <p className="font-bold opacity-80">{node.road_name}</p>
                        <p className={`font-black tracking-wider ${isHeavy ? 'text-rose-400' : isMedium ? 'text-amber-400' : 'text-emerald-400'}`}>{node.current_speed} km/h</p>
                      </div>
                      <p className="text-[9px] text-slate-400">Node: {node.name}</p>
                      <p className="text-[8px] text-slate-500">Updated: {formatDistanceToNow(new Date(node.last_updated), { addSuffix: true })}</p>
                    </div>
                 </div>
              </Overlay>
            );
          })}

          {/* Incident Reports (Waze style Pins) */}
          {reports.map((m, i) => (
            <Overlay key={`map-${m.id}`} anchor={m.latlng} offset={[16, 32]}>
              <div className="relative group/pin cursor-pointer transform hover:scale-110 transition-transform origin-bottom">
                 {/* Map Pin Icon */}
                 <svg width="32" height="32" viewBox="0 0 24 24" fill={m.is_resolved ? "#10b981" : "#f43f5e"} xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9C9.5 7.62 10.62 6.5 12 6.5C13.38 6.5 14.5 7.62 14.5 9C14.5 10.38 13.38 11.5 12 11.5Z" />
                 </svg>
                 
                 {/* Tooltip */}
                 <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-900 text-white text-[10px] px-3 py-2 rounded-lg shadow-xl opacity-0 scale-90 group-hover/pin:opacity-100 group-hover/pin:scale-100 transition-all pointer-events-none whitespace-nowrap z-50">
                   <p className="font-bold mb-1 uppercase text-emerald-400">{m.incident_type?.replace('_', ' ')}</p>
                   <p className="opacity-80 break-words max-w-[200px] whitespace-normal">{m.location}</p>
                 </div>
              </div>
            </Overlay>
          ))}
        </Map>
      </div>
      
    </div>
  );
}
