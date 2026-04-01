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
  Car, ShieldCheck, Briefcase, Heart, Leaf, MapPin, Building2, TrendingUp, Calendar, AlertTriangle, ThumbsUp, HelpCircle, ShieldAlert,
  Phone, Mail, Vote, IdCard, Save, QrCode
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import Cropper from "react-easy-crop";

export default function DashboardPage() {
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const supabase = createClient();
  
  const [activeTab, setActiveTab] = useState<"vibecheck"|"mobility"|"governance"|"jobs"|"health"|"agri">("vibecheck");
  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Profile Edit States
  const [isEditingCity, setIsEditingCity] = useState(false);
  const [selectedCity, setSelectedCity] = useState("Manila");
  const [isShowingQR, setIsShowingQR] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    full_name: "",
    age: "",
    sex: "M",
    civil_status: "Single",
    address: "",
    barangay: "",
    province: "",
    region: "NCR",
    contact: "",
    occupation: "",
    philhealth_id: "",
    voter_status: "unregistered",
    avatar_url: "",
  });

  // Cropper States
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

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
    if (profile) {
      setProfileForm({
        full_name: profile.full_name || "",
        age: profile.age?.toString() || "",
        sex: profile.sex || "M",
        civil_status: profile.civil_status || "Single",
        address: profile.address || "",
        barangay: profile.barangay || "",
        province: profile.province || "",
        region: profile.region || "NCR",
        contact: profile.contact || "",
        occupation: profile.occupation || "",
        philhealth_id: profile.philhealth_id || "",
        voter_status: profile.voter_status || "unregistered",
        avatar_url: profile.avatar_url || "",
      });
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

  const handleProfileSave = async () => {
    if (!user) return;
    if (!profileForm.full_name || !profileForm.age || !profileForm.address || !profileForm.contact || !profileForm.barangay || !profileForm.province) {
      alert("Hindi pwede ang anonymous o kulang na profile! Pakikumpleto lahat ng required fields (*)");
      return;
    }
    try {
      const updateData: any = {
        full_name: profileForm.full_name || null,
        age: profileForm.age ? parseInt(profileForm.age) : null,
        sex: profileForm.sex || null,
        civil_status: profileForm.civil_status || null,
        address: profileForm.address || null,
        barangay: profileForm.barangay || null,
        province: profileForm.province || null,
        region: profileForm.region || null,
        contact: profileForm.contact || null,
        occupation: profileForm.occupation || null,
        philhealth_id: profileForm.philhealth_id || null,
        voter_status: profileForm.voter_status || null,
        avatar_url: profileForm.avatar_url || null,
        citizen_id: profile?.citizen_id || (user?.id ? 'UPH-' + user.id.substring(0,4).toUpperCase() + '-' + user.id.substring(9,13).toUpperCase() : 'UPH-0000-0000'),
      };
      let err: any = null;
      for (let i = 0; i < 2; i++) {
        const { error } = await supabase.from('profiles').upsert({ id: user.id, ...updateData });
        err = error;
        if (!error || !error.message?.includes('steal')) break;
        await new Promise(r => setTimeout(r, 400));
      }

      if (err && !err.message?.includes('steal')) {
        console.error("Supabase Save Error:", err);
        alert("Failed to save profile: " + err.message);
        return; // Stop here if there's a real error
      }
      
      // If success, softly close and delay reload to prevent unhandled fetch AbortErrors from browser navigation
      setIsEditingProfile(false);
      setTimeout(() => window.location.reload(), 300);
    } catch (e) { 
      console.error(e);
      alert("An unexpected error occurred.");
    }
    setIsEditingProfile(false);
  };

  const getCitizenId = () => {
    if (profile?.citizen_id) return profile.citizen_id;
    if (!user?.id) return 'UPH-0000-0000';
    return 'UPH-' + user.id.substring(0,4).toUpperCase() + '-' + user.id.substring(9,13).toUpperCase();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Pakiusap, pumili ng larawan na mas maliit sa 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageToCrop(reader.result as string);
        // Reset cropper controls
        setCrop({ x: 0, y: 0 });
        setZoom(1);
      };
      reader.readAsDataURL(file);
    }
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

  const isProfileIncomplete = !profile?.full_name || !profile?.age || !profile?.address || !profile?.contact || !profile?.barangay || !profile?.province;

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
          <div className="relative p-6 md:p-8 glass-card-strong border-0 h-full rounded-[15px]">
            
            {/* Top row: Avatar + Name + Actions */}
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6 w-full mb-6">
              {/* Avatar / Photo area */}
              <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-indigo-500/30 to-purple-500/30 border border-white/20 flex items-center justify-center shrink-0 shadow-inner relative overflow-hidden group">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/micro-carbon.png')] opacity-20 z-0" />
                {(isEditingProfile ? profileForm.avatar_url : profile?.avatar_url) ? (
                  <img src={(isEditingProfile ? profileForm.avatar_url : profile?.avatar_url) as string} alt="Profile" className="w-full h-full object-cover relative z-10" />
                ) : (
                  <User className="h-9 w-9 text-white/80 relative z-10" />
                )}
                {isEditingProfile && (
                  <label className="absolute inset-0 bg-black/50 z-20 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <Edit2 className="h-4 w-4 text-white mb-1" />
                    <span className="text-[10px] text-white/90 font-semibold tracking-wider">Upload</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                )}
              </div>
              
              <div className="text-center md:text-left flex-1">
                <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                  <Badge variant="outline" className="text-[10px] px-2 py-0 h-5 border-indigo-500/30 text-indigo-300 bg-indigo-500/10">VERIFIED CITIZEN</Badge>
                  <span className="text-white/30 text-xs font-mono flex items-center gap-1"><IdCard className="h-3 w-3" /> {getCitizenId()}</span>
                  {profile?.voter_status === "registered" && (
                    <Badge variant="outline" className="text-[10px] px-2 py-0 h-5 border-emerald-500/30 text-emerald-300 bg-emerald-500/10">✓ VOTER</Badge>
                  )}
                </div>
                <h1 className="text-2xl md:text-3xl font-display font-bold text-white tracking-tight mb-2">
                  {profile?.full_name || profile?.username || user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || "Set Your Name"}
                </h1>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-sm">
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
              <div className="flex flex-row md:flex-col gap-2 w-full md:w-auto mt-2 md:mt-0 shrink-0">
                <Button disabled={isProfileIncomplete} onClick={() => setIsShowingQR(true)} variant="outline" className={`flex-1 md:flex-none ${isProfileIncomplete ? 'opacity-50 cursor-not-allowed border-white/10 text-white/30' : 'border-indigo-500/40 text-indigo-300 hover:text-white hover:bg-indigo-500/20 bg-indigo-500/10'}`}>
                  <QrCode className="h-4 w-4 mr-2" /> View Digital ID
                </Button>
                {!isProfileIncomplete && (
                  <Button onClick={() => setIsEditingProfile(!isEditingProfile)} variant="outline" className={`flex-1 md:flex-none border-white/10 text-white/60 hover:text-white hover:bg-white/10 ${isEditingProfile ? 'bg-white/10 text-white border-indigo-500/40' : 'bg-white/05'}`}>
                    <Edit2 className="h-4 w-4 mr-2" /> {isEditingProfile ? 'Cancel' : 'Edit Profile'}
                  </Button>
                )}
                <Button asChild className="btn-primary flex-1 md:flex-none py-2 px-5 shadow-lg shadow-indigo-500/20 border-0" style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)" }}>
                  <Link href="/">Check Feed</Link>
                </Button>
                <Button onClick={signOut} variant="outline" className="flex-1 md:flex-none bg-white/05 border-white/10 text-white/60 hover:text-white hover:bg-white/10">
                  <LogIn className="h-4 w-4 mr-2 rotate-180" /> Logout
                </Button>
              </div>
            </div>

            {/* Citizen Details Grid */}
            {isEditingProfile || isProfileIncomplete ? (
              <div className="border-t border-white/10 pt-5 mt-2">
                {isProfileIncomplete && (
                  <div className="mb-4 bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 flex items-start gap-3 animate-fade-in">
                    <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0" />
                    <p className="text-xs text-rose-200"><strong>Anti-Cybercrime requirement:</strong> Bawal ang anonymous. Kailangan makumpleto muna ang iyong Citizen Profile para ma-activate at ma-verify ang iyong account. Ang optional lang ay PhilHealth at Trabaho.</p>
                  </div>
                )}
                <h3 className="text-sm font-bold text-white/70 uppercase tracking-wider mb-4 flex items-center gap-2"><Edit2 className="h-4 w-4 text-indigo-400" /> {isProfileIncomplete ? 'Complete Citizen Profile' : 'Edit Citizen Profile'}</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <ProfileInput label="Full Name *" value={profileForm.full_name} onChange={(v) => setProfileForm({...profileForm, full_name: v})} placeholder="Juan Dela Cruz" />
                  <ProfileInput label="Age *" value={profileForm.age} onChange={(v) => setProfileForm({...profileForm, age: v})} placeholder="25" type="number" />
                  <ProfileSelect label="Sex *" value={profileForm.sex} onChange={(v) => setProfileForm({...profileForm, sex: v})} options={[{v:"M",l:"Male"},{v:"F",l:"Female"}]} />
                  <ProfileSelect label="Civil Status *" value={profileForm.civil_status} onChange={(v) => setProfileForm({...profileForm, civil_status: v})} options={[{v:"Single",l:"Single"},{v:"Married",l:"Married"},{v:"Widowed",l:"Widowed"},{v:"Separated",l:"Separated"}]} />
                  <ProfileInput label="Address *" value={profileForm.address} onChange={(v) => setProfileForm({...profileForm, address: v})} placeholder="123 Rizal St." />
                  <ProfileInput label="Barangay *" value={profileForm.barangay} onChange={(v) => setProfileForm({...profileForm, barangay: v})} placeholder="Brgy. San Miguel" />
                  <ProfileInput label="Province *" value={profileForm.province} onChange={(v) => setProfileForm({...profileForm, province: v})} placeholder="Metro Manila" />
                  <ProfileSelect label="Region *" value={profileForm.region} onChange={(v) => setProfileForm({...profileForm, region: v})} options={[{v:"NCR",l:"NCR"},{v:"Region I",l:"Region I"},{v:"Region II",l:"Region II"},{v:"Region III",l:"Region III"},{v:"Region IV-A",l:"Region IV-A"},{v:"Region IV-B",l:"Region IV-B"},{v:"Region V",l:"Region V"},{v:"Region VI",l:"Region VI"},{v:"Region VII",l:"Region VII"},{v:"Region VIII",l:"Region VIII"},{v:"Region IX",l:"Region IX"},{v:"Region X",l:"Region X"},{v:"Region XI",l:"Region XI"},{v:"Region XII",l:"Region XII"},{v:"CAR",l:"CAR"},{v:"BARMM",l:"BARMM"},{v:"CARAGA",l:"CARAGA"}]} />
                  <ProfileInput label="Contact No. *" value={profileForm.contact} onChange={(v) => setProfileForm({...profileForm, contact: v})} placeholder="0917-xxx-xxxx" />
                  <ProfileInput label="Occupation" value={profileForm.occupation} onChange={(v) => setProfileForm({...profileForm, occupation: v})} placeholder="Teacher" />
                  <ProfileInput label="PhilHealth ID" value={profileForm.philhealth_id} onChange={(v) => setProfileForm({...profileForm, philhealth_id: v})} placeholder="PH-01-XXXXXXXXX-X" />
                  <ProfileSelect label="Voter Status" value={profileForm.voter_status} onChange={(v) => setProfileForm({...profileForm, voter_status: v})} options={[{v:"registered",l:"Registered"},{v:"unregistered",l:"Unregistered"}]} />
                </div>
                <div className="mt-4 flex justify-end">
                  <Button onClick={handleProfileSave} className="bg-indigo-600 hover:bg-indigo-700 text-white border-0 shadow-lg shadow-indigo-500/20">
                    <Save className="h-4 w-4 mr-2" /> Save Profile
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 border-t border-white/10 pt-5 mt-2">
                <CitizenField icon={User} label="Age / Sex" value={profile?.age && profile?.sex ? `${profile.age} yrs / ${profile.sex === 'M' ? 'Male' : 'Female'}` : '—'} />
                <CitizenField icon={MapPin} label="Address" value={profile?.address ? `${profile.barangay || ''}, ${profile.city || ''}` : profile?.city || '—'} />
                <CitizenField icon={Briefcase} label="Occupation" value={profile?.occupation || '—'} />
                <CitizenField icon={Shield} label="PhilHealth" value={profile?.philhealth_id || '—'} />
                <CitizenField icon={Phone} label="Contact" value={profile?.contact || '—'} />
                <CitizenField icon={Mail} label="Email" value={user?.email || '—'} />
                <CitizenField icon={Heart} label="Civil Status" value={profile?.civil_status || '—'} />
                <CitizenField icon={Vote} label="Region" value={profile?.region || '—'} />
              </div>
            )}

            {/* Background design elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-pink-500/10 rounded-full blur-[60px] translate-y-1/2 -translate-x-1/3 pointer-events-none" />
          </div>
        </div>

        {/* Universal Tabs */}
        {!isProfileIncomplete ? (
          <>
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
          </>
        ) : (
          <div className="glass-card p-12 text-center min-h-[400px] flex flex-col items-center justify-center border-dashed border-rose-500/30 bg-rose-500/05 mt-4">
            <ShieldAlert className="h-16 w-16 text-rose-500/50 mb-6 animate-pulse" />
            <h3 className="text-2xl font-bold text-white mb-2 font-display">Unverified Account Level 1</h3>
            <p className="text-white/60 text-sm max-w-md mx-auto">
              Please complete all required fields (*) in your Citizen Profile above to unlock the Universal Citizen Ecosystem. Bawal ang anonymous sa Bayanihan Super App.
            </p>
          </div>
        )}

        {/* Crop Modal */}
        {imageToCrop && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <div className="bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl relative flex flex-col overflow-hidden border border-white/10 animate-fade-in">
              <div className="p-4 border-b border-white/10 flex justify-between items-center bg-slate-800">
                <h3 className="text-white font-semibold">Ayusin ang Larawan</h3>
                <button onClick={() => setImageToCrop(null)} className="text-white/50 hover:text-white"><X className="h-5 w-5" /></button>
              </div>
              <div className="relative w-full h-[400px] bg-black">
                <Cropper
                  image={imageToCrop}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="round"
                  showGrid={false}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={(_, croppedPixels) => setCroppedAreaPixels(croppedPixels)}
                />
              </div>
              <div className="p-5 space-y-6 bg-slate-800">
                <div className="flex items-center gap-4">
                  <span className="text-xs text-white/50 font-bold tracking-widest uppercase">Zoom</span>
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.1}
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="w-full accent-indigo-500"
                  />
                  <span className="text-xs text-indigo-400 font-bold">{Math.round(zoom * 100)}%</span>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1 bg-white/05 border border-white/10 text-white/70 hover:text-white" onClick={() => setImageToCrop(null)}>
                    Kanselahin
                  </Button>
                  <Button className="flex-1 btn-primary border-0 bg-indigo-600 hover:bg-indigo-700 text-white" onClick={async () => {
                    if (croppedAreaPixels) {
                      const getCroppedImg = async (imageSrc: string, pixelCrop: any) => {
                        const image = await new Promise<HTMLImageElement>((resolve, reject) => {
                          const img = new Image();
                          img.onload = () => resolve(img);
                          img.onerror = (error) => reject(error);
                          img.src = imageSrc;
                        });
                        const canvas = document.createElement("canvas");
                        const ctx = canvas.getContext("2d");
                        if (!ctx) return null;
                        canvas.width = pixelCrop.width;
                        canvas.height = pixelCrop.height;
                        ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height);
                        return canvas.toDataURL("image/jpeg");
                      };
                      
                      const croppedImage = await getCroppedImg(imageToCrop, croppedAreaPixels);
                      if (croppedImage) {
                        setProfileForm(prev => ({ ...prev, avatar_url: croppedImage }));
                        setImageToCrop(null);
                      }
                    }
                  }}>
                    I-Crop
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* QR Code Modal for Mobile / Show to Officer */}
        {isShowingQR && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
             <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-[0_0_50px_rgba(99,102,241,0.2)] relative text-center pointer-events-auto border border-white/20 animate-fade-in">
               <button onClick={() => setIsShowingQR(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 bg-slate-100 rounded-full p-1"><X className="h-5 w-5" /></button>
               
               <div className="flex justify-center mb-3">
                 <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full p-2.5 shadow-lg">
                    <ShieldCheck className="h-6 w-6 text-white" />
                 </div>
               </div>
               <h3 className="text-xl font-black text-slate-800 mb-1 tracking-tight">eGovPH Digital ID</h3>
               <p className="text-[11px] font-semibold text-slate-400 mb-6 px-4 leading-relaxed">Ipakita ang secure QR code na ito sa mga awtoridad o LGU desk officers para ma-scan.</p>
               
               <div className="mx-auto bg-slate-50 p-4 rounded-2xl w-fit mb-6 border-2 border-slate-100 shadow-inner">
                 <img 
                   src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent("https://ugnay-ph-hackahon.vercel.app/verify/" + getCitizenId())}&bgcolor=ffffff&color=2e1065&margin=0`} 
                   alt="Citizen QR Code" 
                   width={200} height={200}
                   className="rounded-xl w-[200px] h-[200px] mx-auto opacity-90"
                 />
               </div>
               
               <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-[9px] font-black tracking-widest text-slate-400 mb-1 uppercase">UgnayPH Citizen ID</p>
                  <p className="text-lg font-mono font-black text-indigo-900 tracking-wider bg-slate-200/50 py-1 rounded inline-block px-3">{getCitizenId()}</p>
               </div>
             </div>
          </div>
        )}
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

// Citizen Detail Field (read-only display)
function CitizenField({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="bg-white/03 border border-white/05 rounded-xl p-3">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="h-3.5 w-3.5 text-white/30" />
        <span className="text-[10px] text-white/40 uppercase tracking-wider font-semibold">{label}</span>
      </div>
      <p className="text-sm font-semibold text-white truncate" title={value}>{value}</p>
    </div>
  );
}

// Profile Input Field (for editing)
function ProfileInput({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (v: string) => void; placeholder: string; type?: string }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] text-white/40 uppercase tracking-wider font-semibold">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all"
      />
    </div>
  );
}

// Profile Select Field (for editing)
function ProfileSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { v: string; l: string }[] }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] text-white/40 uppercase tracking-wider font-semibold">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all appearance-none cursor-pointer"
      >
        {options.map(o => (
          <option key={o.v} value={o.v} className="bg-slate-900 text-white">{o.l}</option>
        ))}
      </select>
    </div>
  );
}
