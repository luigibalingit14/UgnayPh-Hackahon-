"use client";

import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { Search, Loader2, CheckCircle2, Clock, AlertCircle } from "lucide-react";

export default function GovernanceAdminPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const fetchData = async () => {
    try {
      const res = await fetch("/api/admin/sync").then(r => r.json());
      if (res.success && res.data) {
        setReports(res.data.governance || []);
      }
    } catch(err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStatusChange = async (id: string, newStatus: string) => {
    // Optimistic update
    setReports(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
    
    // API request
    try {
      await fetch('/api/admin/resolve', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table: "governance_reports", id, updatePayload: { status: newStatus } })
      });
    } catch (e) {
      // Revert on failure
      fetchData();
    }
  };

  const filteredReports = reports.filter(r => {
    if (filter === "all") return true;
    return r.status === filter;
  });

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white shrink-0">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Governance & Citizen Complaints</h2>
          <p className="text-sm text-slate-500">Manage, review, and resolve cases filed by citizens</p>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button 
            onClick={() => setFilter("all")} 
            className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${filter === "all" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >All</button>
          <button 
            onClick={() => setFilter("pending")} 
            className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${filter === "pending" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >Pending</button>
          <button 
            onClick={() => setFilter("resolved")} 
            className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${filter === "resolved" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >Resolved</button>
        </div>
      </div>

      {/* Table Data */}
      <div className="flex-1 overflow-auto bg-slate-50/50">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin mb-4 text-blue-500" />
            <p>Loading records...</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-500 text-xs uppercase tracking-wider sticky top-0 z-10 shadow-sm">
                <th className="p-4 font-semibold w-[15%]">Date Filed</th>
                <th className="p-4 font-semibold w-[20%]">Category</th>
                <th className="p-4 font-semibold w-[45%]">Complaint Details</th>
                <th className="p-4 font-semibold w-[20%] text-center">Status Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-400">
                    No records found matching the criteria.
                  </td>
                </tr>
              ) : filteredReports.map(report => (
                <tr key={report.id} className="hover:bg-blue-50/50 transition-colors group">
                  <td className="p-4 text-sm text-slate-500">
                    {formatDistanceToNow(new Date(report.created_at || Date.now()), { addSuffix: true })}
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                      {report.category}
                    </span>
                  </td>
                  <td className="p-4">
                    <p className="text-sm font-bold text-slate-800 mb-1">{report.title}</p>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{report.description}</p>
                  </td>
                  <td className="p-4 flex justify-center">
                    <select
                      value={report.status || "pending"}
                      onChange={(e) => handleStatusChange(report.id, e.target.value)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg border appearance-none text-center cursor-pointer transition-colors shadow-sm
                        ${report.status === "resolved" ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100" : 
                          report.status === "in_progress" ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100" :
                          "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                        }
                      `}
                    >
                      <option value="pending">⚠️ Pending</option>
                      <option value="in_progress">⏱️ In Progress</option>
                      <option value="resolved">✅ Resolved</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
