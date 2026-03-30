import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Seed realistic demo data across all 6 modules for hackathon presentation
export async function POST() {
  try {
    const supabase = await createClient();

    // 1. Mobility Reports
    const mobilityData = [
      { location: "EDSA corner Shaw Blvd", city: "Mandaluyong", incident_type: "pothole", severity: "high", description: "Malaking butas sa kalsada, halos 2 feet ang lalim. Delikado sa motor at sasakyan.", is_resolved: false },
      { location: "Commonwealth Ave near Litex", city: "Quezon City", incident_type: "flooding", severity: "high", description: "Baha tuwing malakas ang ulan, hindi gumagana ang drainage system.", is_resolved: false },
      { location: "Taft Ave near LRT Vito Cruz", city: "Manila", incident_type: "traffic_jam", severity: "medium", description: "Matinding traffic dahil sa road construction na walang traffic enforcer.", is_resolved: false },
      { location: "C5 Road near BGC", city: "Taguig", incident_type: "road_obstruction", severity: "medium", description: "Mga construction materials nakakalat sa kalsada, wala pang barricade.", is_resolved: false },
      { location: "Marcos Highway near SM Marikina", city: "Marikina", incident_type: "pothole", severity: "high", description: "Series of potholes na nagka-cause na ng 3 accidents this week.", is_resolved: false },
      { location: "Quirino Highway", city: "Caloocan", incident_type: "broken_traffic_light", severity: "high", description: "Traffic light sa intersection na sira na dalawang linggo na. Nangyayari ang road rage.", is_resolved: false },
      { location: "Roxas Blvd near CCP", city: "Pasay", incident_type: "flooding", severity: "medium", description: "Bumabaha kapag high tide, apektado ang mga commuter.", is_resolved: true },
      { location: "Ortigas Ave near Megamall", city: "Pasig", incident_type: "traffic_jam", severity: "high", description: "Grabe ang traffic sa harap ng mall, walang pedestrian overpass.", is_resolved: false },
    ];

    // 2. Governance Reports
    const governanceData = [
      { title: "Barangay Health Center walang gamot", description: "Ang health center sa Brgy. 176 ay walang supply ng basic medicines tulad ng paracetamol at amoxicillin na dalawang buwan na.", category: "health", status: "pending" },
      { title: "Delayed issuance ng Barangay Clearance", description: "Mahigit isang linggo na akong naghihintay ng barangay clearance. Sinasabi nila na wala raw sistema nila.", category: "bureaucracy", status: "pending" },
      { title: "Illegal gambling sa kanto", description: "Halos gabi-gabi may sugalan sa kanto ng Purok 3. Mga bata nakakakita. Hindi gumagawa ng aksyon ang barangay.", category: "peace_and_order", status: "in_progress" },
      { title: "Corruption sa public market stall allocation", description: "May nagbebenta ng market stall slots sa mas mataas na presyo. Hindi patas ang allocation system.", category: "corruption", status: "pending" },
      { title: "Abandoned government vehicle", description: "May lumang government vehicle na nakapark sa harap ng school sa 3 buwan na. Nagiging tirahan ng mga taong grasa.", category: "infrastructure", status: "pending" },
      { title: "Walang streetlights sa Purok 7", description: "Madilim ang aming purok sa gabi. Tatlong beses nang may holdap incident. Request po ng streetlights.", category: "infrastructure", status: "in_progress" },
    ];

    // 3. Health Appointments
    const healthData = [
      { patient_name: "Maria Santos", contact_number: "09171234567", concern: "Lagnat at ubo na hindi gumagaling sa loob ng isang linggo. Takot na baka COVID o Dengue.", status: "pending", preferred_date: "2026-04-02" },
      { patient_name: "Pedro Reyes", contact_number: "09189876543", concern: "Sumasakit ang ngipin ko ng dalawang araw na. Need ng dental checkup ASAP.", status: "pending", preferred_date: "2026-04-01" },
      { patient_name: "Ana Dela Cruz", contact_number: "09201112233", concern: "Prenatal checkup. 6 months na pregnant. First baby po.", status: "confirmed", preferred_date: "2026-04-03" },
      { patient_name: "Jose Ramos", contact_number: "09334455667", concern: "Blood sugar monitoring. Diabetic po ako Type 2.", status: "pending", preferred_date: "2026-04-04" },
      { patient_name: "Elena Bautista", contact_number: "09557788990", concern: "Pamamaga ng paa at kamay. Baka po kidney problem.", status: "pending", preferred_date: "2026-04-01" },
    ];

    // 4. Jobs
    const jobsData = [
      { title: "Barangay Health Worker", company: "LGU Quezon City", location: "Quezon City", job_type: "full_time", salary_min: 12000, salary_max: 15000, description: "Assist in community health programs, vaccination drives, and patient monitoring.", skills: ["Healthcare", "Community"], region: "NCR", is_active: true },
      { title: "Traffic Enforcer Aide", company: "MMDA", location: "Manila", job_type: "full_time", salary_min: 14000, salary_max: 18000, description: "Support traffic management operations along major thoroughfares.", skills: ["Traffic", "Communication"], region: "NCR", is_active: true },
      { title: "Agricultural Extension Worker", company: "DA Region IV", location: "Laguna", job_type: "full_time", salary_min: 18000, salary_max: 22000, description: "Provide technical assistance to farmers in crop management and marketing.", skills: ["Agriculture", "Research"], region: "Region IV-A", is_active: true },
      { title: "Call Center Agent (Filipino)", company: "Accenture PH", location: "Makati", job_type: "full_time", salary_min: 18000, salary_max: 25000, description: "Handle inbound customer service calls. Training provided.", skills: ["English", "Customer Service"], region: "NCR", is_active: true },
      { title: "Grab Driver Partner", company: "Grab Philippines", location: "Metro Manila", job_type: "freelance", salary_min: 20000, salary_max: 50000, description: "Be your own boss. Flexible schedule. Must have own vehicle.", skills: ["Driving", "Navigation"], region: "NCR", is_active: true },
    ];

    // 5. Agri Prices
    const agriData = [
      { crop: "Palay (Irrigated)", price_per_kg: 21.50, location: "Nueva Ecija", is_available: true },
      { crop: "Mais (Yellow Corn)", price_per_kg: 14.80, location: "Isabela", is_available: true },
      { crop: "Kamatis", price_per_kg: 45.00, location: "Benguet", is_available: true },
      { crop: "Sibuyas (Red Onion)", price_per_kg: 120.00, location: "Nueva Ecija", is_available: true },
      { crop: "Bawang (Garlic)", price_per_kg: 180.00, location: "Ilocos Sur", is_available: false },
      { crop: "Saging (Lakatan)", price_per_kg: 35.00, location: "Davao", is_available: true },
      { crop: "Mangga (Carabao)", price_per_kg: 65.00, location: "Cebu", is_available: true },
    ];

    // Insert all data in parallel
    const results = await Promise.all([
      supabase.from("mobility_reports").insert(mobilityData),
      supabase.from("governance_complaints").insert(governanceData),
      supabase.from("health_appointments").insert(healthData),
      supabase.from("job_listings").insert(jobsData),
      supabase.from("agri_prices").insert(agriData),
    ]);

    const errors = results.filter(r => r.error).map(r => r.error?.message);

    return NextResponse.json({ 
      success: errors.length === 0, 
      seeded: {
        mobility: mobilityData.length,
        governance: governanceData.length,
        health: healthData.length,
        jobs: jobsData.length,
        agri: agriData.length,
      },
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error("Seed Error:", error);
    return NextResponse.json({ success: false, error: "Seeding failed" }, { status: 500 });
  }
}
