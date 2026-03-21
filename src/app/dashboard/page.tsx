"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Report } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VibeMeter } from "@/components/features/vibe-meter";
import { formatDate, truncateText, getVibeLabel, cn } from "@/lib/utils";
import {
  Flame, FileText, Trophy, Loader2, Shield, LogIn, User, Edit2, Check, X,
  Car, ShieldCheck, Briefcase, Heart, Leaf, MapPin, Building2, TrendingUp, Calendar, AlertTriangle, ThumbsUp, HelpCircle, ShieldAlert
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default function DashboardPage() {
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const supabase = createClient();
  
  const [activeTab, setActiveTab] = useState<"vibecheck"|"mobility"|"governance"|"jobs"|"health"|"agri">("vibecheck");
  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Profile Edit States
  const [isEditingCity, setIsEditingCity] = useState(false);
  const [selectedCity, setSelectedCity] = useState("Manila");

  // States for all modules
  const [reports, setReports] = useState<Report[]>([]);
  const [mobility, setMobility] = useState<any[]>([]);
  const [governance, setGovernance] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [healthMsgs, setHealthMsgs] = useState<any[]>([]); // Assuming health appointments
  const [agri, setAgri] = useState<any[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      redirect("/auth/login");
    }
    if (profile?.city) {
      setSelectedCity(profile.city);
    }
  }, [user, authLoading, profile]);

  const handleCityUpdate = async () => {
    if (!user || !selectedCity) return;
    try {
      const { error } = await supabase.from('profiles').update({ city: selectedCity }).eq('id', user.id);
      if (!error) {
         window.location.reload(); 
      }
    } catch (e) { console.error(e) }
    setIsEditingCity(false);
  };

  useEffect(() => {
    const fetchAllData = async () => {
      if (!user) return;
      setLoading(true);

      const userCity = profile?.city || "Manila";

      // Fetch all data independently for true progressive rendering
      // This immediately frees up the UI while data streams in
      setLoading(false);
      setIsInitialLoad(false);

      fetch(`/api/reports?limit=10&offset=0`).then(res => res.json()).then(data => {
        if (data.success) setReports(data.reports || []);
      }).catch(console.error);

      fetch(`/api/mobility?city=${userCity}`).then(res => res.json()).then(data => {
        let localMobility: any[] = [];
        try { localMobility = JSON.parse(localStorage.getItem("demo_mobility_reports") || "[]"); } catch(e) {}
        if (data.success) setMobility([...localMobility, ...(data.reports || [])]);
        else setMobility(localMobility);
      }).catch(console.error);

      fetch(`/api/governance`).then(res => res.json()).then(data => {
        let localGov: any[] = [];
        try { localGov = JSON.parse(localStorage.getItem("demo_governance_complaints") || "[]"); } catch(e) {}
        if (data.success) setGovernance([...localGov, ...(data.complaints || [])]);
        else setGovernance(localGov);
      }).catch(console.error);

      fetch(`/api/jobs`).then(res => res.json()).then(data => {
        let localJobs: any[] = [];
        try { localJobs = JSON.parse(localStorage.getItem("demo_jobs") || "[]"); } catch(e) {}
        if (data.success) setJobs([...localJobs, ...(data.jobs || [])]);
        else setJobs(localJobs);
      }).catch(console.error);

      supabase.from("health_appointments").select("*, health_centers(name, address)").eq("user_id", user.id).order("created_at", { ascending: false })
        .then(({ data, error }) => {
          if (error) console.error(error);
          let localHealth: any[] = [];
          try { localHealth = JSON.parse(localStorage.getItem("demo_health_appointments") || "[]"); } catch(e) {}
          if (data) setHealthMsgs([...localHealth, ...data]);
          else setHealthMsgs(localHealth);
        });

      fetch(`/api/agri`).then(res => res.json()).then(data => {
        let localAgri: any[] = [];
        try { localAgri = JSON.parse(localStorage.getItem("demo_agri_prices") || "[]"); } catch(e) {}
        if (data.success) setAgri([...localAgri, ...(data.prices || [])]);
        else setAgri(localAgri);
      }).catch(console.error);
    };

    if (user && !authLoading) { // Changed from (user && profile) to prevent infinite loading if profile fails
      fetchAllData();
    } else if (!authLoading && !user) {
      setLoading(false); // Make sure dashboard stops loading if they are fully logged out/no user
      setIsInitialLoad(false);
    }
  }, [user, authLoading, profile?.city]); // Depend on profile?.city instead of full profile to prevent re-fetching loops

  if (authLoading || (loading && isInitialLoad)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white/50" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-card max-w-md w-full mx-4 text-center p-8">
          <Shield className="h-12 w-12 mx-auto mb-4 text-indigo-400" />
          <h2 className="text-xl font-display font-semibold mb-2 text-white">Login Required</h2>
          <p className="text-white/50 mb-6">
            Kailangan mag-login para makita ang Universal Citizen Dashboard mo.
          </p>
          <Button asChild className="btn-primary w-full border-0">
            <Link href="/auth/login">
              <LogIn className="h-4 w-4 mr-2" />
              Log In
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  // Calculate VC stats
  const avgScore = reports.length > 0 ? Math.round(reports.reduce((sum, r) => sum + r.score, 0) / reports.length) : 0;
  const legitChecks = reports.filter((r) => r.score <= 40).length;

  const tabs = [
    { key: "vibecheck", label: "VibeCheck", icon: Shield, count: reports.length, color: "text-indigo-400" },
    { key: "mobility", label: "Mobility", icon: Car, count: mobility.length, color: "text-amber-400" },
    { key: "governance", label: "Governance", icon: ShieldCheck, count: governance.length, color: "text-rose-400" },
    { key: "jobs", label: "Jobs", icon: Briefcase, count: jobs.length, color: "text-emerald-400" },
    { key: "health", label: "Health", icon: Heart, count: healthMsgs.length, color: "text-blue-400" },
    { key: "agri", label: "Agriculture", icon: Leaf, count: agri.length, color: "text-lime-400" },
  ];

  return (
    <div className="min-h-screen py-8 md:py-14 relative overflow-hidden">
      <div className="absolute inset-0 dot-grid opacity-30 pointer-events-none" />
      <div className="absolute top-0 right-0 w-full h-[500px] pointer-events-none" style={{ background: "radial-gradient(ellipse 60% 50% at 80% 0%, rgba(99,102,241,0.1) 0%, transparent 70%)" }} />
      
        {/* DIGITAL CITIZEN ID */}
        <div className="mb-8 relative overflow-hidden rounded-2xl p-[1px] bg-gradient-to-r from-indigo-500/50 via-purple-500/50 to-pink-500/50 shadow-2xl">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-3xl" />
          <div className="relative p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 glass-card-strong border-0 h-full rounded-[15px]">
            
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6 w-full">
              {/* Avatar / Photo area */}
              <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/20 flex items-center justify-center shrink-0 shadow-inner relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/micro-carbon.png')] opacity-20" />
                <User className="h-10 w-10 text-white/80 relative z-10" />
              </div>
              
              <div className="text-center md:text-left flex-1">
                <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                  <Badge variant="outline" className="text-[10px] px-2 py-0 h-5 border-indigo-500/30 text-indigo-300 bg-indigo-500/10">VERIFIED CITIZEN</Badge>
                  <span className="text-white/30 text-xs font-mono">ID: {user?.id.substring(0,8).toUpperCase()}</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-display font-bold text-white tracking-tight mb-2">
                  {profile?.username || user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || "Juan Dela Cruz"}
                </h1>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm">
                  {isEditingCity ? (
                    <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg border border-white/20">
                      <MapPin className="h-4 w-4 text-rose-400" />
                      <select 
                        value={selectedCity} 
                        onChange={(e) => setSelectedCity(e.target.value)}
                        className="bg-transparent text-white text-sm outline-none appearance-none cursor-pointer"
                      >
                         {["Manila", "Quezon City", "Makati", "Pasig", "Taguig", "Batangas City", "Lipa City", "Cebu City", "Davao City", "Iloilo City", "Cagayan de Oro", "Zamboanga City", "Other"].map(c => (
                            <option key={c} value={c} className="text-black">{c}</option>
                          ))}
                      </select>
                      <button onClick={handleCityUpdate} className="text-emerald-400 hover:text-emerald-300 ml-1"><Check className="h-4 w-4" /></button>
                      <button onClick={() => setIsEditingCity(false)} className="text-rose-400 hover:text-rose-300"><X className="h-4 w-4" /></button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-white/80 bg-white/05 px-3 py-1.5 rounded-lg border border-white/10 group cursor-pointer" onClick={() => setIsEditingCity(true)}>
                      <MapPin className="h-4 w-4 text-rose-400" />
                      <span className="font-medium text-white">{profile?.city || "Manila"}</span>
                      <Edit2 className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity ml-1" />
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-white/80 bg-white/05 px-3 py-1.5 rounded-lg border border-white/10">
                    <Flame className="h-4 w-4 text-orange-400" />
                    <span className="font-medium text-white">{profile?.streak_count || 0} Day Truth Streak</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-row md:flex-col gap-2 w-full md:w-auto mt-4 md:mt-0">
                <Button asChild className="btn-primary flex-1 md:flex-none py-2 px-5 shadow-lg shadow-indigo-500/20 border-0" style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)" }}>
                  <Link href="/">Check Feed</Link>
                </Button>
                <Button onClick={signOut} variant="outline" className="flex-1 md:flex-none bg-white/05 border-white/10 text-white/60 hover:text-white hover:bg-white/10">
                  <LogIn className="h-4 w-4 mr-2 rotate-180" /> Logout
                </Button>
              </div>
            </div>

            {/* Background design elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-pink-500/10 rounded-full blur-[60px] translate-y-1/2 -translate-x-1/3 pointer-events-none" />
          </div>
        </div>

        {/* Universal Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key as any)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap shrink-0 border ${
                activeTab === t.key 
                  ? "bg-white/10 border-white/20 text-white shadow-lg shadow-black/20" 
                  : "bg-white/03 border-white/05 text-white/50 hover:text-white/80 hover:bg-white/05"
              }`}
            >
              <t.icon className={`h-4 w-4 ${t.color}`} />
              {t.label}
              <Badge variant="outline" className={`ml-1 text-[10px] px-1.5 py-0 h-4 ${activeTab === t.key ? "border-white/20" : "border-white/10 text-white/40"}`}>
                {t.count}
              </Badge>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="glass-card p-6 min-h-[400px]">

          {/* VIBECHECK */}
          {activeTab === "vibecheck" && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/03 border border-white/05 p-4 rounded-xl flex items-center gap-3">
                  <Flame className="h-6 w-6 text-orange-400" />
                  <div>
                    <p className="text-2xl font-bold text-white">{profile?.streak_count || 0}</p>
                    <p className="text-xs text-white/50">Day Streak</p>
                  </div>
                </div>
                <div className="bg-white/03 border border-white/05 p-4 rounded-xl flex items-center gap-3">
                  <FileText className="h-6 w-6 text-indigo-400" />
                  <div>
                    <p className="text-2xl font-bold text-white">{profile?.total_checks || 0}</p>
                    <p className="text-xs text-white/50">Total Checks</p>
                  </div>
                </div>
                <div className="bg-white/03 border border-white/05 p-4 rounded-xl flex items-center gap-3">
                  <Trophy className="h-6 w-6 text-emerald-400" />
                  <div>
                    <p className="text-2xl font-bold text-white">{legitChecks}</p>
                    <p className="text-xs text-white/50">Legit Found</p>
                  </div>
                </div>
                <div className="bg-white/03 border border-white/05 p-4 rounded-xl flex items-center gap-3">
                  <Shield className="h-6 w-6 text-blue-400" />
                  <div>
                    <p className="text-2xl font-bold text-white">{avgScore || "-"}</p>
                    <p className="text-xs text-white/50">Avg Score</p>
                  </div>
                </div>
              </div>

              {profile && profile.streak_count > 0 && (
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-5 flex items-center gap-4">
                  <div><Flame className="h-10 w-10 text-orange-500" /></div>
                  <div>
                    <h3 className="font-display font-bold text-white">{profile.streak_count} days na walang na-scam!</h3>
                    <p className="text-sm text-white/60">Keep checking suspicious content para mapanatili ang streak mo!</p>
                  </div>
                </div>
              )}

              <h3 className="text-lg font-bold text-white flex items-center gap-2 mt-8 mb-4 border-b border-white/10 pb-2">
                <FileText className="h-5 w-5 text-indigo-400" /> My Fact Checks
              </h3>
              
              {reports.length === 0 ? (
                <EmptyState icon={Shield} msg="Wala ka pang na-check na content. Start na!" link="/vibecheck" btn="Check Content" />
              ) : (
                <div className="space-y-3">
                  {reports.map((report) => {
                    const vibeInfo = getVibeLabel(report.score);
                    const ScoreIcon = report.score <= 20 ? ShieldCheck : report.score <= 40 ? ThumbsUp : report.score <= 60 ? HelpCircle : report.score <= 80 ? AlertTriangle : ShieldAlert;
                    return (
                      <div key={report.id} className="bg-white/03 border border-white/05 hover:border-white/10 hover:bg-white/05 transition-colors rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <ScoreIcon className={cn("h-6 w-6 flex-shrink-0", vibeInfo.color)} />
                            <Badge className="bg-white/10 hover:bg-white/20 text-white border-0">Score: {report.score}</Badge>
                            <Badge variant="outline" className="border-white/10 text-white/70">{report.label_tagalog}</Badge>
                          </div>
                          <p className="text-sm text-white/60 line-clamp-2 mb-2">{truncateText(report.content, 150)}</p>
                          <p className="text-xs text-white/40">{formatDate(report.created_at)}</p>
                        </div>
                        <div className="w-full md:w-32"><VibeMeter score={report.score} size="sm" showLabel={false} animated={false} /></div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* MOBILITY */}
          {activeTab === "mobility" && (
            <div className="animate-fade-in">
              <h3 className="text-lg font-bold text-white flex items-center justify-between mb-4 border-b border-white/10 pb-2">
                <span className="flex items-center gap-2"><Car className="h-5 w-5 text-amber-400" /> Live Traffic in {profile?.city || "your city"}</span>
                <Link href="/mobility" className="text-xs text-amber-400 hover:text-amber-300">View Map →</Link>
              </h3>
              {mobility.length === 0 ? (
                <EmptyState icon={Car} msg={`Walang traffic report sa ${profile?.city || "iyong lugar"} ngayon.`} link="/mobility" btn="Report Incident" />
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {mobility.map(m => (
                    <div key={m.id} className="bg-white/03 border border-white/05 hover:border-white/10 rounded-xl p-4 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <Badge className="bg-amber-500/20 text-amber-300 border-0">{m.incident_type.replace('_', ' ')}</Badge>
                        <Badge variant="outline" className={m.is_resolved ? 'border-emerald-500/50 text-emerald-400' : 'border-rose-500/50 text-rose-400'}>
                          {m.is_resolved ? 'Resolved' : 'Active'}
                        </Badge>
                      </div>
                      <h4 className="font-semibold text-white mb-1 flex items-center gap-1"><MapPin className="h-3 w-3" /> {m.location}</h4>
                      <p className="text-sm text-white/60 mb-3">{m.description || "No description provided."}</p>
                      <p className="text-xs text-white/40">{formatDate(m.created_at)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* GOVERNANCE */}
          {activeTab === "governance" && (
            <div className="animate-fade-in">
              <h3 className="text-lg font-bold text-white flex items-center justify-between mb-4 border-b border-white/10 pb-2">
                 <span className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-rose-400" /> Public Issues Board</span>
                 <Link href="/governance" className="text-xs text-rose-400 hover:text-rose-300">File a Report →</Link>
              </h3>
              {governance.length === 0 ? (
                <EmptyState icon={Building2} msg="Walang naka-post na issue sa ngayon." link="/governance" btn="File a Complaint" />
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {governance.map(g => (
                    <div key={g.id} className="bg-white/03 border border-white/05 hover:border-white/10 rounded-xl p-4 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <Badge className="bg-rose-500/20 text-rose-300 border-0 capitalize">{g.category}</Badge>
                        <Badge variant="outline" className="border-white/10 text-white/60 capitalize">{g.status.replace('_', ' ')}</Badge>
                      </div>
                      <h4 className="font-semibold text-white mb-2">{g.title}</h4>
                      <p className="text-sm text-white/60 line-clamp-2 mb-3">{g.description}</p>
                      <div className="flex items-center justify-between text-xs text-white/40">
                        <span>{g.agency || "General"}</span>
                        <span>{formatDate(g.created_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* JOBS */}
          {activeTab === "jobs" && (
            <div className="animate-fade-in">
              <h3 className="text-lg font-bold text-white flex items-center justify-between mb-4 border-b border-white/10 pb-2">
                <span className="flex items-center gap-2"><Briefcase className="h-5 w-5 text-emerald-400" /> Local Job Opportunities</span>
                <Link href="/jobs" className="text-xs text-emerald-400 hover:text-emerald-300">Browse All →</Link>
              </h3>
              {jobs.length === 0 ? (
                <EmptyState icon={Briefcase} msg="Walang bagong job postings sa ngayon." link="/jobs" btn="Post a Job" />
              ) : (
                <div className="space-y-3">
                  {jobs.map(j => (
                    <div key={j.id} className="bg-white/03 border border-white/05 hover:border-white/10 rounded-xl p-4 transition-colors flex justify-between items-center">
                      <div>
                        <h4 className="font-semibold text-white mb-1">{j.title}</h4>
                        <div className="flex items-center gap-3 text-sm text-white/60">
                          <span className="flex items-center gap-1"><Building2 className="h-3.5 w-3.5" />{j.company}</span>
                          <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{j.location}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={j.is_active ? 'bg-emerald-500/20 text-emerald-300 border-0' : 'bg-white/10 text-white/50 border-0'}>
                          {j.is_active ? 'Active' : 'Closed'}
                        </Badge>
                        <p className="text-xs text-white/40 mt-2">{formatDate(j.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* HEALTH - KEEP AS PERSONAL DATA */}
          {activeTab === "health" && (
            <div className="animate-fade-in">
              <h3 className="text-lg font-bold text-white flex items-center justify-between mb-4 border-b border-white/10 pb-2">
                <span className="flex items-center gap-2"><Calendar className="h-5 w-5 text-blue-400" /> My Health Appointments</span>
                <Link href="/health" className="text-xs text-blue-400 hover:text-blue-300">Book New →</Link>
              </h3>
              {healthMsgs.length === 0 ? (
                <EmptyState icon={Heart} msg="Wala ka pang naka-book na appointment sa ngayon." link="/health" btn="Find Health Center" />
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {healthMsgs.map(h => (
                    <div key={h.id} className="bg-white/03 border border-white/05 hover:border-white/10 rounded-xl p-4 transition-colors">
                      <div className="flex justify-between items-start mb-3">
                        <Badge className="bg-blue-500/20 text-blue-300 border-0 capitalize">{h.status}</Badge>
                        <span className="text-sm font-semibold text-blue-300">{h.preferred_date}</span>
                      </div>
                      <h4 className="font-semibold text-white mb-1">{h.health_centers?.name || "Unknown Center"}</h4>
                      <p className="text-xs text-white/50 mb-3">{h.health_centers?.address || "No address"}</p>
                      <div className="p-3 bg-white/02 rounded-lg border border-white/05 text-sm text-white/70">
                        <span className="text-white/40 block text-xs mb-1">Concern:</span>
                        {h.concern}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* AGRI */}
          {activeTab === "agri" && (
            <div className="animate-fade-in">
              <h3 className="text-lg font-bold text-white flex items-center justify-between mb-4 border-b border-white/10 pb-2">
                <span className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-lime-400" /> Latest Crop Prices</span>
                <Link href="/agri" className="text-xs text-lime-400 hover:text-lime-300">AgriLink Board →</Link>
              </h3>
              {agri.length === 0 ? (
                <EmptyState icon={Leaf} msg="Walang bagong presyo ng gulay sa ngayon." link="/agri" btn="Post Price" />
              ) : (
                <div className="grid md:grid-cols-3 gap-4">
                  {agri.map(a => (
                    <div key={a.id} className="bg-white/03 border border-white/05 hover:border-white/10 rounded-xl p-4 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-white">{a.crop}</h4>
                        <Badge className={a.is_available ? 'bg-lime-500/20 text-lime-300 border-0' : 'bg-rose-500/20 text-rose-300 border-0'}>
                          {a.is_available ? 'Avail' : 'Sold Out'}
                        </Badge>
                      </div>
                      <p className="text-2xl font-display font-bold text-lime-400 mb-1">
                        ₱{a.price_per_kg} <span className="text-sm text-lime-400/50 font-sans">/ {a.unit}</span>
                      </p>
                      <p className="text-xs text-white/50 flex items-center gap-1 mb-2"><MapPin className="h-3 w-3" /> {a.location}</p>
                      <p className="text-xs text-white/40">{formatDate(a.created_at)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
  );
}

// Helper component for Empty States
function EmptyState({ icon: Icon, msg, link, btn }: { icon: any, msg: string, link: string, btn: string }) {
  return (
    <div className="text-center py-16 px-4">
      <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-white/05 border border-white/10 mb-4">
        <Icon className="h-8 w-8 text-white/50" />
      </div>
      <p className="text-lg text-white/70 mb-6">{msg}</p>
      <Button asChild className="opacity-90 hover:opacity-100">
        <Link href={link}>{btn}</Link>
      </Button>
    </div>
  );
}

