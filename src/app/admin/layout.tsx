"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ShieldCheck, Truck, BarChart3, LockKeyhole, Search, LogOut, ChevronRight, Activity, Radio, X, Users } from "lucide-react";
import { usePathname } from "next/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const pathname = usePathname();

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Close search dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/admin/search?q=${encodeURIComponent(searchQuery)}`).then(r => r.json());
        if (res.success) {
          setSearchResults(res.results || []);
          setShowResults(true);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  }, [searchQuery]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === "1234") {
      setIsAuthenticated(true);
      setError("");
    } else {
      setError("Invalid Administrative PIN Code");
      setPin("");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center font-sans p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-slate-950 pointer-events-none">
          <div className="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px]" />
        </div>
        
        <div className="relative z-10 w-full max-w-md bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-800">
          <div className="p-8">
            <div className="flex justify-center mb-6">
              <div className="h-16 w-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 border border-blue-400/20">
                <LockKeyhole className="h-8 w-8 text-white" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-center text-white mb-2">UgnayPH Admin</h2>
            <p className="text-center text-slate-400 text-sm mb-8">
              Authorized Government Personnel Only
            </p>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Access PIN
                </label>
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950/50 border border-slate-700/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono tracking-[0.5em] text-center text-xl text-white placeholder-slate-600"
                  placeholder="****"
                  maxLength={4}
                  autoFocus
                />
              </div>
              
              {error && <p className="text-sm text-red-400 text-center font-medium">{error}</p>}
              
              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 border border-blue-400/20 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                Authenticate <ChevronRight className="h-4 w-4" />
              </button>
            </form>
          </div>
          <div className="bg-slate-950/50 px-8 py-4 border-t border-slate-800/50 text-xs text-center text-slate-500">
            UgnayPH LGU Enterprise Portal
          </div>
        </div>
      </div>
    );
  }

  // Validated Admin View
  return (
    <div className="min-h-screen bg-slate-950 flex font-sans text-slate-200 antialiased selection:bg-blue-500/30">
      
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 relative z-20 shadow-2xl">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-8 w-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">UgnayPH</h1>
          </div>
          <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">LGU Enterprise Portal</p>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <Link 
            href="/admin/citizens" 
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${pathname.includes('/admin/citizens') ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
          >
            <Users className="h-5 w-5" />
            <span className="font-semibold text-sm">Citizen Records</span>
          </Link>
          <Link 
            href="/admin/governance" 
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${pathname.includes('/admin/governance') ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
          >
            <BarChart3 className="h-5 w-5" />
            <span className="font-semibold text-sm">Governance Desk</span>
          </Link>
          <Link 
            href="/admin/mobility" 
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${pathname.includes('/admin/mobility') ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
          >
            <Truck className="h-5 w-5" />
            <span className="font-semibold text-sm">Mobility Dispatch</span>
          </Link>
          <Link 
            href="/admin/command-center" 
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${pathname.includes('/admin/command-center') ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
          >
            <Radio className="h-5 w-5" />
            <span className="font-semibold text-sm">Radar Monitor</span>
          </Link>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={() => setIsAuthenticated(false)}
            className="flex items-center gap-2 w-full px-4 py-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors text-sm font-semibold"
          >
            <LogOut className="h-4 w-4" />
            <span>Terminate Session</span>
          </button>
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Topbar Ribbon */}
        <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-8 shrink-0 relative z-10 shadow-sm">
          {/* Search Bar */}
          <div className="relative w-96" ref={searchRef}>
            <div className="flex items-center bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 focus-within:border-blue-500/50 transition-all">
              <Search className={`h-4 w-4 mr-2 ${isSearching ? "text-blue-500 animate-pulse" : "text-slate-500"}`} />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchResults.length > 0 && setShowResults(true)}
                placeholder="Search Citizen Records or IDs..." 
                className="bg-transparent border-none text-sm w-full focus:outline-none text-slate-200 placeholder:text-slate-600"
              />
              {searchQuery && (
                <button onClick={() => { setSearchQuery(""); setSearchResults([]); setShowResults(false); }}>
                  <X className="h-4 w-4 text-slate-500 hover:text-slate-300" />
                </button>
              )}
            </div>

            {/* Search Results Dropdown */}
            {showResults && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 rounded-xl shadow-2xl border border-slate-800 overflow-hidden z-50 max-h-80 overflow-y-auto">
                <div className="px-4 py-2 bg-slate-950 border-b border-slate-800 text-[10px] uppercase tracking-wider font-bold text-slate-500">
                  {searchResults.length} record(s) found
                </div>
                {searchResults.map((r: any, i: number) => (
                  <div 
                    key={`${r._module}-${r.id}-${i}`} 
                    className="px-4 py-3 hover:bg-slate-800 border-b border-slate-800/50 transition-colors cursor-pointer"
                    onClick={() => {
                      if (r._module === "citizen") window.location.href = `/admin/citizens?highlight=${r.citizen_id || r.id}`;
                      else if (r._module === "mobility") window.location.href = "/admin/mobility";
                      else if (r._module === "governance") window.location.href = "/admin/governance";
                      else setShowResults(false);
                    }}
                  >
                    <p className="text-sm font-semibold text-slate-200">{r._label}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        r._module === "citizen" ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" :
                        r._module === "mobility" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                        r._module === "governance" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
                        r._module === "health" ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" :
                        r._module === "jobs" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                        "bg-lime-500/10 text-lime-400 border border-lime-500/20"
                      }`}>{r._module}</span>
                      {r.status && <span className="text-[10px] text-slate-500">Status: {r.status}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="h-8 w-8 rounded-full border border-blue-500/30 overflow-hidden bg-blue-500/10 flex items-center justify-center">
              <ShieldCheck className="h-4 w-4 text-blue-400" />
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-slate-200 leading-tight">LGU Administrator</p>
              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold" suppressHydrationWarning>{new Date().toLocaleDateString('en-PH')}</p>
            </div>
          </div>
        </header>
        
        {/* Page Content */}
        <div className="flex-1 overflow-y-auto bg-slate-950 p-8 custom-scrollbar relative">
           {/* Subtle background glow */}
           <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />
           {children}
        </div>
      </main>
    </div>
  );
}
