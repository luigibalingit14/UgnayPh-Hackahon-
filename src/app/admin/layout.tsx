"use client";

import { useState } from "react";
import Link from "next/link";
import { ShieldCheck, Truck, BarChart3, LockKeyhole, Search, LogOut, ChevronRight, Activity } from "lucide-react";
import { usePathname } from "next/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const pathname = usePathname();

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
      <div className="min-h-screen bg-slate-100 flex items-center justify-center font-sans p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-slate-900 pointer-events-none">
          <div className="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px]" />
        </div>
        
        <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
          <div className="p-8">
            <div className="flex justify-center mb-6">
              <div className="h-16 w-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                <LockKeyhole className="h-8 w-8 text-white" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-center text-slate-800 mb-2">UgnayPH Admin</h2>
            <p className="text-center text-slate-500 text-sm mb-8">
              Authorized Government Personnel Only
            </p>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                  Access PIN (Demo: 1234)
                </label>
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono tracking-[0.5em] text-center text-xl text-slate-800"
                  placeholder="****"
                  maxLength={4}
                  autoFocus
                />
              </div>
              
              {error && <p className="text-sm text-red-500 text-center font-medium">{error}</p>}
              
              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                Authenticate <ChevronRight className="h-4 w-4" />
              </button>
            </form>
          </div>
          <div className="bg-slate-50 px-8 py-4 border-t border-slate-100 text-xs text-center text-slate-500">
            Hackathon Live Demo Environment
          </div>
        </div>
      </div>
    );
  }

  // Validated Admin View
  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-800">
      
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0">
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
          
          <div className="pt-4 mt-4 border-t border-slate-800">
            <Link 
               href="/command-center"
               target="_blank"
               className="flex items-center justify-between px-4 py-2 rounded-lg text-slate-500 hover:text-emerald-400 group transition-colors"
            >
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Radar Monitor</span>
              </div>
              <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          </div>
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
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 w-96">
            <Search className="h-4 w-4 text-slate-400 mr-2" />
            <input 
              type="text" 
              placeholder="Search Citizen Records or IDs..." 
              className="bg-transparent border-none text-sm w-full focus:outline-none text-slate-700 placeholder:text-slate-400"
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="h-8 w-8 rounded-full border-2 border-slate-200 overflow-hidden bg-slate-100">
              <img src="https://api.dicebear.com/7.x/initials/svg?seed=Admin" alt="Admin" />
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-slate-800 leading-tight">Juan Dela Cruz</p>
              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold" suppressHydrationWarning>{new Date().toLocaleDateString('en-PH')}</p>
            </div>
          </div>
        </header>
        
        {/* Page Content */}
        <div className="flex-1 overflow-y-auto bg-slate-50 p-8 custom-scrollbar relative">
           {children}
        </div>
      </main>
    </div>
  );
}
