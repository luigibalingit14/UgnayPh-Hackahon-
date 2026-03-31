import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

// Helper to generate a deterministic pseudo-random number between min and max based on a string seed (like UUID)
function getDeterministicRandom(seedStr: string, min: number, max: number) {
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = seedStr.charCodeAt(i) + ((hash << 5) - hash);
  }
  const random = Math.abs(Math.sin(hash)) * 10000;
  const normalized = random - Math.floor(random);
  return min + normalized * (max - min);
}

// Generate a plausible Philippine coordinate purely for the demo dashboard map
function getMapCoordinates(profile: any) {
  // Center roughly around Metro Manila
  const lat = getDeterministicRandom(profile.id, 14.5000, 14.7000);
  const lng = getDeterministicRandom(profile.id + "lng", 120.9500, 121.1000);
  return { lat, lng };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim().toLowerCase();
    const id = searchParams.get("id")?.trim();

    const supabase = await createClient();

    // Return specific citizen by id
    if (id) {
      const { data: citizen, error } = await supabase
        .from("profiles")
        .select("*")
        .or(`id.eq.${id},citizen_id.eq.${id}`)
        .single();
        
      if (citizen) {
        return NextResponse.json({ success: true, citizen: { ...citizen, ...getMapCoordinates(citizen) } });
      }
      return NextResponse.json({ success: false, error: "Citizen not found" }, { status: 404 });
    }

    let query = supabase.from("profiles").select("*");

    // Search citizens
    if (q && q.length >= 1) {
      const pattern = `%${q}%`;
      query = query.or(`full_name.ilike.${pattern},citizen_id.ilike.${pattern},city.ilike.${pattern},barangay.ilike.${pattern},occupation.ilike.${pattern},contact.ilike.${pattern},philhealth_id.ilike.${pattern}`);
    }

    // Limit to 50 for performance
    const { data: citizens, error } = await query.limit(50);
    
    if (error) throw error;
    
    // Add fake coordinates and ensure fallback values so UI doesn't crash on newly registered users without full profile
    const results = (citizens || []).map(c => ({
      ...c,
      full_name: c.full_name || c.username || "Unknown Citizen",
      citizen_id: c.citizen_id || "Unverified",
      city: c.city || "Unknown City",
      barangay: c.barangay || "Unknown Brgy",
      occupation: c.occupation || "Unspecified",
      ...getMapCoordinates(c)
    }));

    return NextResponse.json({ success: true, citizens: results, total: results.length });
  } catch (error) {
    console.error("Citizens API Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch citizens from Supabase" }, { status: 500 });
  }
}
