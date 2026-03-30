"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Search, Loader2, MapPin, User, Phone, Mail, Briefcase, Shield, ChevronRight, X, Users, FileText, Vote } from "lucide-react";
import { Map, Overlay } from "pigeon-maps";

function mapTiler(x: number, y: number, z: number) {
  return `https://cartodb-basemaps-a.global.ssl.fastly.net/light_all/${z}/${x}/${y}.png`;
}

interface Citizen {
  id: string;
  citizen_id: string;
  full_name: string;
  age: number;
  sex: "M" | "F";
  civil_status: string;
  address: string;
  barangay: string;
  city: string;
  province: string;
  region: string;
  contact: string;
  email: string;
  occupation: string;
  philhealth_id: string;
  voter_status: "registered" | "unregistered";
  lat: number;
  lng: number;
  created_at: string;
}

export default function CitizenRecordsPage() {
  const [citizens, setCitizens] = useState<Citizen[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCitizen, setSelectedCitizen] = useState<Citizen | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([14.5995, 120.9842]);
  const [mapZoom, setMapZoom] = useState(11);
  const searchParams = useSearchParams();
  const highlightId = searchParams.get("highlight");

  const fetchCitizens = useCallback(async (query?: string) => {
    setLoading(true);
    try {
      const url = query && query.length >= 1
        ? `/api/admin/citizens?q=${encodeURIComponent(query)}`
        : "/api/admin/citizens";
      const res = await fetch(url).then(r => r.json());
      if (res.success) {
        setCitizens(res.citizens || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCitizens();
  }, [fetchCitizens]);

  // Auto-select citizen from search highlight
  useEffect(() => {
    if (highlightId && citizens.length > 0 && !selectedCitizen) {
      const found = citizens.find(c => c.citizen_id === highlightId || c.id === highlightId);
      if (found) {
        handleSelectCitizen(found);
      }
    }
  }, [highlightId, citizens]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCitizens(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, fetchCitizens]);

  const handleSelectCitizen = (citizen: Citizen) => {
    setSelectedCitizen(citizen);
    setMapCenter([citizen.lat, citizen.lng]);
    setMapZoom(14);
  };

  const handleCloseDetail = () => {
    setSelectedCitizen(null);
    setMapZoom(11);
    setMapCenter([14.5995, 120.9842]);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 h-[calc(100vh-8rem)]">

      {/* Left Panel: Citizen List */}
      <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">

        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-white shrink-0">
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-800">Citizen Records</h2>
            <span className="ml-auto text-xs font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{citizens.length} records</span>
          </div>

          {/* Search */}
          <div className="flex items-center bg-slate-100 px-3 py-2 rounded-lg border border-slate-200 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
            <Search className="h-4 w-4 text-slate-400 mr-2 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Name, Citizen ID, City..."
              className="bg-transparent border-none text-sm w-full focus:outline-none text-slate-700 placeholder:text-slate-400"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")}>
                <X className="h-4 w-4 text-slate-400 hover:text-slate-600" />
              </button>
            )}
          </div>
        </div>

        {/* Citizen List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8">
              <Loader2 className="h-7 w-7 animate-spin mb-3 text-blue-500" />
              <p className="text-sm">Loading citizen records...</p>
            </div>
          ) : citizens.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8">
              <Users className="h-10 w-10 mb-3 opacity-40" />
              <p className="text-sm font-medium">No records found</p>
              <p className="text-xs mt-1">Try a different search term</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {citizens.map(citizen => (
                <button
                  key={citizen.id}
                  onClick={() => handleSelectCitizen(citizen)}
                  className={`w-full text-left p-4 hover:bg-blue-50/70 transition-all flex items-center gap-3 group ${selectedCitizen?.id === citizen.id ? "bg-blue-50 border-l-4 border-blue-500" : "border-l-4 border-transparent"}`}
                >
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${selectedCitizen?.id === citizen.id ? "bg-blue-500 text-white" : "bg-slate-200 text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-600"} transition-colors`}>
                    {citizen.full_name.split(" ").map(n => n[0]).slice(0, 2).join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{citizen.full_name}</p>
                    <p className="text-[11px] text-slate-400 font-mono truncate">{citizen.citizen_id}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-slate-500 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />{citizen.city}
                      </span>
                      <span className="text-[10px] text-slate-500 flex items-center gap-1">
                        <Briefcase className="h-3 w-3" />{citizen.occupation}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel: Map + Detail */}
      <div className="lg:col-span-3 flex flex-col gap-4 h-full">

        {/* Citizen Detail Card (appears when selected) */}
        {selectedCitizen && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 shrink-0 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-lg font-bold shadow-lg shadow-blue-200">
                  {selectedCitizen.full_name.split(" ").map(n => n[0]).slice(0, 2).join("")}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">{selectedCitizen.full_name}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{selectedCitizen.citizen_id}</span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${selectedCitizen.voter_status === "registered" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                      {selectedCitizen.voter_status === "registered" ? "✓ Voter" : "Unregistered"}
                    </span>
                  </div>
                </div>
              </div>
              <button onClick={handleCloseDetail} className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-lg transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <InfoChip icon={User} label="Age / Sex" value={`${selectedCitizen.age || '—'} yrs / ${selectedCitizen.sex || '—'}`} />
              <InfoChip icon={MapPin} label="Address" value={selectedCitizen.address ? `${selectedCitizen.barangay || ''}, ${selectedCitizen.city || ''}` : selectedCitizen.city || '—'} />
              <InfoChip icon={Briefcase} label="Occupation" value={selectedCitizen.occupation || '—'} />
              <InfoChip icon={Shield} label="PhilHealth" value={selectedCitizen.philhealth_id || '—'} />
              <InfoChip icon={Phone} label="Contact" value={selectedCitizen.contact || '—'} />
              <InfoChip icon={Mail} label="Email" value={selectedCitizen.email || '—'} />
              <InfoChip icon={FileText} label="Civil Status" value={selectedCitizen.civil_status || '—'} />
              <InfoChip icon={Vote} label="Region" value={selectedCitizen.region || '—'} />
            </div>
          </div>
        )}

        {/* Map */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative flex-1 min-h-[300px]">
          <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl shadow-lg border border-slate-100 flex gap-4 text-xs font-bold text-slate-700 pointer-events-none">
            <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-blue-500" /> Citizen Location</div>
            {selectedCitizen && (
              <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-rose-500 animate-pulse" /> Selected</div>
            )}
          </div>

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
            {citizens.map(citizen => (
              <Overlay key={citizen.id} anchor={[citizen.lat, citizen.lng]} offset={[16, 32]}>
                <div
                  className="relative group/pin cursor-pointer transform hover:scale-110 transition-transform origin-bottom"
                  onClick={() => handleSelectCitizen(citizen)}
                >
                  <svg width="32" height="32" viewBox="0 0 24 24" fill={selectedCitizen?.id === citizen.id ? "#ef4444" : "#3b82f6"} xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9C9.5 7.62 10.62 6.5 12 6.5C13.38 6.5 14.5 7.62 14.5 9C14.5 10.38 13.38 11.5 12 11.5Z" />
                  </svg>

                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-900 text-white text-[10px] px-3 py-2 rounded-lg shadow-xl opacity-0 scale-90 group-hover/pin:opacity-100 group-hover/pin:scale-100 transition-all pointer-events-none whitespace-nowrap z-50">
                    <p className="font-bold text-blue-300">{citizen.full_name}</p>
                    <p className="opacity-80">{citizen.citizen_id}</p>
                    <p className="opacity-60">{citizen.city}</p>
                  </div>
                </div>
              </Overlay>
            ))}
          </Map>
        </div>
      </div>
    </div>
  );
}

function InfoChip({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="h-3 w-3 text-slate-400" />
        <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">{label}</span>
      </div>
      <p className="text-xs font-semibold text-slate-700 truncate" title={value}>{value}</p>
    </div>
  );
}
