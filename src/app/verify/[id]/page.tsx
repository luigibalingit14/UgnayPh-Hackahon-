import { createClient } from "@/lib/supabase/server";
import { ShieldCheck, ShieldAlert, User, Shield, IdCard, AlertTriangle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function VerifyCitizenPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  if (!id) return notFound();

  // Validate format (e.g. UPH-ABCD-1234)
  if (!id.startsWith("UPH-") || id.length < 13) {
    return <InvalidCitizenScreen id={id} />;
  }

  const supabase = await createClient();
  
  // Find citizen profile
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("citizen_id", id)
    .single();

  if (error || !profile) {
    return <InvalidCitizenScreen id={id} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
        
        {/* Header - DICT/eGovPH Blue Theme */}
        <div className="bg-gradient-to-b from-indigo-700 to-indigo-900 text-center py-10 px-6 relative">
          <Link href="/" className="absolute top-4 left-4 text-white/60 hover:text-white p-2">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          
          <div className="mx-auto w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.3)] mb-4 animate-bounce-slow">
             <ShieldCheck className="h-10 w-10 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-widest uppercase mb-1 drop-shadow-md">Verified</h1>
          <p className="text-indigo-200 text-xs font-semibold tracking-wide uppercase">Official UgnayPH Record</p>
        </div>

        {/* Ribbon / Status Bar */}
        <div className="bg-emerald-500 text-white text-[10px] font-black tracking-widest text-center py-2 shadow-inner uppercase">
          Active Citizen Account
        </div>

        {/* Content Body */}
        <div className="p-8">
           
           <div className="flex flex-col items-center mb-6">
              <div className="w-24 h-24 rounded-2xl bg-slate-100 border-2 border-slate-200 flex items-center justify-center mb-4 shadow-sm relative overflow-hidden">
                 <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/micro-carbon.png')] opacity-10 z-0" />
                 {profile.avatar_url ? (
                   <img src={profile.avatar_url as string} alt="Profile" className="w-full h-full object-cover relative z-10" />
                 ) : (
                   <User className="h-10 w-10 text-slate-300 relative z-10" />
                 )}
              </div>
              <h2 className="text-2xl font-black text-slate-800 text-center leading-tight mb-1">{profile.full_name || profile.username || "Unnamed Citizen"}</h2>
              <p className="text-sm font-semibold text-slate-500 mb-3">{profile.city || profile.region || "Philippines"}</p>
              
              <div className="bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100 flex items-center gap-2">
                 <IdCard className="h-4 w-4 text-indigo-500" />
                 <span className="font-mono font-black text-indigo-900 tracking-wider text-sm">{profile.citizen_id}</span>
              </div>
           </div>

           <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                 <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-1">Civil Status</p>
                    <p className="text-sm font-bold text-slate-700">{profile.civil_status || "N/A"}</p>
                 </div>
                 <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-1">Sex</p>
                    <p className="text-sm font-bold text-slate-700">{profile.sex === "M" ? "Male" : profile.sex === "F" ? "Female" : "N/A"}</p>
                 </div>
              </div>
              
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex items-start gap-3">
                 <Shield className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                 <div>
                   <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-0.5">PhilHealth ID No.</p>
                   <p className="text-sm font-bold text-slate-700 font-mono tracking-wide">{profile.philhealth_id || "NOT PROVIDED"}</p>
                 </div>
              </div>

              {profile.voter_status === "registered" && (
                <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100 flex justify-center">
                   <p className="text-xs font-black text-emerald-600 tracking-widest uppercase flex items-center gap-2">
                     <ShieldCheck className="h-4 w-4" /> Registered Voter
                   </p>
                </div>
              )}
           </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 text-center">
           <p className="text-[9px] text-slate-400 font-medium">Scanned on {new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' })} (PST)</p>
           <p className="text-[9px] text-slate-400 font-medium mt-1">UgnayPH Secure Verification System © 2026</p>
        </div>
      </div>
    </div>
  );
}

// INVALID OR FAKE ID SCREEN
function InvalidCitizenScreen({ id }: { id: string }) {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden border-2 border-rose-500 relative">
        <div className="absolute top-0 left-0 w-full h-2 bg-rose-500 animate-pulse" />
        <div className="p-10 text-center">
           <div className="mx-auto w-24 h-24 bg-rose-100 rounded-full flex items-center justify-center mb-6 border-4 border-rose-200">
             <ShieldAlert className="h-12 w-12 text-rose-500" />
           </div>
           <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tighter mb-2">Invalid ID</h1>
           <p className="text-sm font-semibold text-slate-500 mb-6">This Citizen ID does not exist in the UgnayPH database.</p>
           
           <div className="bg-slate-100 px-4 py-3 rounded-xl border border-slate-200 mb-6 font-mono text-sm text-slate-600 break-all">
             {id}
           </div>

           <div className="bg-rose-50 text-rose-700 p-4 rounded-xl text-xs font-bold flex items-start gap-2 text-left">
             <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
             <p>Warning: Presenting a tampered or fake Government logic ID is a punishable offense. Please report this to the authorities.</p>
           </div>
        </div>
        
        <div className="bg-slate-50 border-t border-slate-200 p-4 text-center">
           <Link href="/" className="text-xs font-bold text-indigo-600 hover:underline">Return to Home</Link>
        </div>
      </div>
    </div>
  );
}
