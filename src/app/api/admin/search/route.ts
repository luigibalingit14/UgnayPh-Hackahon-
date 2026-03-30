import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Demo citizen data for search (same source as /api/admin/citizens)
const DEMO_CITIZENS = [
  { id: "c1", citizen_id: "NCR-MNL-2024-00001", full_name: "Maria Clara Santos", city: "Manila", barangay: "San Miguel", occupation: "Public School Teacher", contact: "0917-123-4567" },
  { id: "c2", citizen_id: "NCR-QC-2024-00002", full_name: "Jose Andres Reyes Jr.", city: "Quezon City", barangay: "Commonwealth", occupation: "Tricycle Driver", contact: "0918-234-5678" },
  { id: "c3", citizen_id: "NCR-MKT-2024-00003", full_name: "Rosario Lim Garcia", city: "Makati", barangay: "Bel-Air", occupation: "Software Developer", contact: "0919-345-6789" },
  { id: "c4", citizen_id: "NCR-TGG-2024-00004", full_name: "Roberto Cruz Mendoza", city: "Taguig", barangay: "Signal Village", occupation: "Security Guard", contact: "0920-456-7890" },
  { id: "c5", citizen_id: "NCR-PSG-2024-00005", full_name: "Ana Patricia Villanueva", city: "Pasig", barangay: "Wack-Wack", occupation: "Registered Nurse", contact: "0921-567-8901" },
  { id: "c6", citizen_id: "NCR-CLN-2024-00006", full_name: "Fernando Aquino Tan", city: "Caloocan", barangay: "Brgy. 123", occupation: "Jeepney Operator", contact: "0922-678-9012" },
  { id: "c7", citizen_id: "NCR-MNL-2024-00007", full_name: "Lourdes Rivera Bautista", city: "Manila", barangay: "Brgy. 15", occupation: "Retired Government Employee", contact: "0923-789-0123" },
  { id: "c8", citizen_id: "NCR-PSY-2024-00008", full_name: "Mark Anthony Dela Rosa", city: "Pasay", barangay: "Baclaran", occupation: "Grab Food Rider", contact: "0924-890-1234" },
  { id: "c9", citizen_id: "NCR-MND-2024-00009", full_name: "Angelica Mae Gonzales", city: "Mandaluyong", barangay: "Barangka", occupation: "College Student / Part-time Barista", contact: "0925-901-2345" },
  { id: "c10", citizen_id: "NCR-QC-2024-00010", full_name: "Eduardo Santiago Ramos", city: "Quezon City", barangay: "Vasra", occupation: "OFW - Seaman", contact: "0926-012-3456" },
  { id: "c11", citizen_id: "NCR-MKT-2024-00011", full_name: "Carmen Soriano Lopez", city: "Makati", barangay: "Poblacion", occupation: "Market Vendor", contact: "0927-123-4567" },
  { id: "c12", citizen_id: "NCR-TGG-2024-00012", full_name: "Paolo Miguel Fernandez", city: "Taguig", barangay: "Fort Bonifacio", occupation: "Digital Marketing Manager", contact: "0928-234-5678" },
  { id: "c13", citizen_id: "R4A-BTG-2024-00013", full_name: "Gregoria Magsaysay Dimaculangan", city: "Batangas City", barangay: "Kumintang Ibaba", occupation: "Sari-sari Store Owner", contact: "0929-345-6789" },
  { id: "c14", citizen_id: "R7-CEB-2024-00014", full_name: "Ricardo Enrique Osmeña", city: "Cebu City", barangay: "Sto. Niño", occupation: "Restaurant Owner", contact: "0930-456-7890" },
  { id: "c15", citizen_id: "R11-DVO-2024-00015", full_name: "Fatima Zahra Maranao", city: "Davao City", barangay: "Buhangin", occupation: "Community Health Worker", contact: "0931-567-8901" },
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();

    if (!q || q.length < 2) {
      return NextResponse.json({ success: true, results: [] });
    }

    const qLower = q.toLowerCase();

    // Search citizens first (top priority)
    const citizenResults = DEMO_CITIZENS.filter(c =>
      c.full_name.toLowerCase().includes(qLower) ||
      c.citizen_id.toLowerCase().includes(qLower) ||
      c.city.toLowerCase().includes(qLower) ||
      c.barangay.toLowerCase().includes(qLower) ||
      c.contact.includes(qLower)
    ).slice(0, 5).map(c => ({
      ...c,
      _module: "citizen",
      _label: `👤 ${c.full_name} — ${c.citizen_id}`,
      status: c.city,
    }));

    const supabase = await createClient();
    const pattern = `%${q}%`;

    // Search across all relevant tables in parallel
    const [
      { data: mobility },
      { data: governance },
      { data: health },
      { data: jobs },
      { data: agri }
    ] = await Promise.all([
      supabase.from("mobility_reports").select("id, created_at, location, city, incident_type, description, is_resolved").ilike("description", pattern).limit(5),
      supabase.from("governance_complaints").select("id, created_at, title, description, category, status").or(`title.ilike.${pattern},description.ilike.${pattern}`).limit(5),
      supabase.from("health_appointments").select("id, created_at, concern, status").ilike("concern", pattern).limit(5),
      supabase.from("job_listings").select("id, created_at, title, company, location").or(`title.ilike.${pattern},company.ilike.${pattern}`).limit(5),
      supabase.from("agri_prices").select("id, created_at, crop, location").ilike("crop", pattern).limit(5),
    ]);

    const results = [
      // Citizens first
      ...citizenResults,
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
