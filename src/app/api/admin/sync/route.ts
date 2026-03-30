import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    // Fire all queries simultaneously in a single Promise.all connection pool
    const [
      { data: vibechecks },
      { data: mobility },
      { data: governance },
      { data: jobs },
      { data: health },
      { data: agri }
    ] = await Promise.all([
      supabase.from("vibecheck_results").select("id, created_at, content, score, label_tagalog").order("created_at", { ascending: false }).limit(30),
      supabase.from("mobility_reports").select("id, created_at, location, city, incident_type, severity, description, is_resolved").order("created_at", { ascending: false }).limit(30),
      supabase.from("governance_complaints").select("id, created_at, title, description, category, status").order("created_at", { ascending: false }).limit(30),
      supabase.from("job_listings").select("id, created_at, title, company, location, is_active").order("created_at", { ascending: false }).limit(30),
      supabase.from("health_appointments").select("id, created_at, concern, status, preferred_date").order("created_at", { ascending: false }).limit(30),
      supabase.from("agri_prices").select("id, created_at, crop, price_per_kg, location, is_available").order("created_at", { ascending: false }).limit(30)
    ]);

    return NextResponse.json({
      success: true,
      data: {
        vibecheck: vibechecks || [],
        mobility: mobility || [],
        governance: governance || [],
        jobs: jobs || [],
        health: health || [],
        agri: agri || []
      }
    });

  } catch (error) {
    console.error("Unified Admin Sync Error:", error);
    return NextResponse.json({ success: false, error: "Failed to sync LGU dashboard" }, { status: 500 });
  }
}
