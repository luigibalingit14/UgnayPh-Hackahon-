import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Connected directly to Supabase profiles now
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();

    if (!q || q.length < 2) {
      return NextResponse.json({ success: true, results: [] });
    }

    const supabase = await createClient();
    const pattern = `%${q}%`;

    // Search across all relevant tables in parallel
    const [
      { data: citizens },
      { data: mobility },
      { data: governance },
      { data: health },
      { data: jobs },
      { data: agri }
    ] = await Promise.all([
      supabase.from("profiles").select("id, full_name, username, citizen_id, city, barangay, contact, occupation, philhealth_id").or(`full_name.ilike.${pattern},citizen_id.ilike.${pattern},city.ilike.${pattern},barangay.ilike.${pattern},contact.ilike.${pattern},philhealth_id.ilike.${pattern}`).limit(5),
      supabase.from("mobility_reports").select("id, created_at, location, city, incident_type, description, is_resolved").ilike("description", pattern).limit(5),
      supabase.from("governance_complaints").select("id, created_at, title, description, category, status").or(`title.ilike.${pattern},description.ilike.${pattern}`).limit(5),
      supabase.from("health_appointments").select("id, created_at, concern, status").ilike("concern", pattern).limit(5),
      supabase.from("job_listings").select("id, created_at, title, company, location").or(`title.ilike.${pattern},company.ilike.${pattern}`).limit(5),
      supabase.from("agri_prices").select("id, created_at, crop, location").ilike("crop", pattern).limit(5),
    ]);

    const results = [
      // Citizens first
      ...(citizens || []).map((c: any) => ({
        ...c,
        _module: "citizen",
        _label: `👤 ${c.full_name || c.username || "Unknown Citizen"} — ${c.citizen_id || "Unverified ID"}`,
        status: c.city || "Unknown City",
      })),
      // Then other modules
      ...(mobility || []).map((r: any) => ({ ...r, _module: "mobility", _label: `🚗 ${r.incident_type}: ${r.location}` })),
      ...(governance || []).map((r: any) => ({ ...r, _module: "governance", _label: `🏛 ${r.title}` })),
      ...(health || []).map((r: any) => ({ ...r, _module: "health", _label: `❤ ${r.concern?.substring(0, 50)}` })),
      ...(jobs || []).map((r: any) => ({ ...r, _module: "jobs", _label: `💼 ${r.title} @ ${r.company}` })),
      ...(agri || []).map((r: any) => ({ ...r, _module: "agri", _label: `🌿 ${r.crop} - ${r.location}` })),
    ];

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error("Admin Search Error:", error);
    return NextResponse.json({ success: false, results: [] });
  }
}
