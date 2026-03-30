import { NextRequest, NextResponse } from "next/server";

// ===== DEMO CITIZEN DATABASE =====
// In production this would be Supabase, but for hackathon demo we use in-memory data
// so it works instantly without needing to run SQL migrations

export interface Citizen {
  id: string;
  citizen_id: string;
  full_name: string;
  age: number;
  sex: "M" | "F";
  civil_status: string;
  address: string;
  barangay: string;
  city: string;
  province: string;
  region: string;
  contact: string;
  email: string;
  occupation: string;
  philhealth_id: string;
  voter_status: "registered" | "unregistered";
  lat: number;
  lng: number;
  created_at: string;
}

const DEMO_CITIZENS: Citizen[] = [
  {
    id: "c1", citizen_id: "NCR-MNL-2024-00001",
    full_name: "Maria Clara Santos", age: 34, sex: "F", civil_status: "Married",
    address: "123 Rizal St., Brgy. San Miguel", barangay: "San Miguel", city: "Manila", province: "Metro Manila", region: "NCR",
    contact: "0917-123-4567", email: "maria.santos@email.com", occupation: "Public School Teacher",
    philhealth_id: "PH-01-234567890-1", voter_status: "registered",
    lat: 14.5995, lng: 120.9842, created_at: "2024-06-15T08:00:00Z"
  },
  {
    id: "c2", citizen_id: "NCR-QC-2024-00002",
    full_name: "Jose Andres Reyes Jr.", age: 42, sex: "M", civil_status: "Married",
    address: "45 Mabini Ave., Brgy. Commonwealth", barangay: "Commonwealth", city: "Quezon City", province: "Metro Manila", region: "NCR",
    contact: "0918-234-5678", email: "jose.reyes@email.com", occupation: "Tricycle Driver",
    philhealth_id: "PH-01-345678901-2", voter_status: "registered",
    lat: 14.6760, lng: 121.0437, created_at: "2024-03-20T10:00:00Z"
  },
  {
    id: "c3", citizen_id: "NCR-MKT-2024-00003",
    full_name: "Rosario Lim Garcia", age: 28, sex: "F", civil_status: "Single",
    address: "Unit 5B, Palm Tower, Ayala Ave.", barangay: "Bel-Air", city: "Makati", province: "Metro Manila", region: "NCR",
    contact: "0919-345-6789", email: "rosario.garcia@email.com", occupation: "Software Developer",
    philhealth_id: "PH-01-456789012-3", voter_status: "registered",
    lat: 14.5547, lng: 121.0244, created_at: "2024-01-10T09:00:00Z"
  },
  {
    id: "c4", citizen_id: "NCR-TGG-2024-00004",
    full_name: "Roberto Cruz Mendoza", age: 55, sex: "M", civil_status: "Widowed",
    address: "Block 7, Lot 12, Signal Village", barangay: "Signal Village", city: "Taguig", province: "Metro Manila", region: "NCR",
    contact: "0920-456-7890", email: "roberto.mendoza@email.com", occupation: "Security Guard",
    philhealth_id: "PH-01-567890123-4", voter_status: "registered",
    lat: 14.5204, lng: 121.0538, created_at: "2023-11-05T14:00:00Z"
  },
  {
    id: "c5", citizen_id: "NCR-PSG-2024-00005",
    full_name: "Ana Patricia Villanueva", age: 31, sex: "F", civil_status: "Single",
    address: "88 Shaw Blvd., Brgy. Wack-Wack", barangay: "Wack-Wack", city: "Pasig", province: "Metro Manila", region: "NCR",
    contact: "0921-567-8901", email: "ana.villanueva@email.com", occupation: "Registered Nurse",
    philhealth_id: "PH-01-678901234-5", voter_status: "registered",
    lat: 14.5764, lng: 121.0851, created_at: "2024-02-14T11:00:00Z"
  },
  {
    id: "c6", citizen_id: "NCR-CLN-2024-00006",
    full_name: "Fernando Aquino Tan", age: 47, sex: "M", civil_status: "Married",
    address: "15 10th Ave., Brgy. 123", barangay: "Brgy. 123", city: "Caloocan", province: "Metro Manila", region: "NCR",
    contact: "0922-678-9012", email: "fernando.tan@email.com", occupation: "Jeepney Operator",
    philhealth_id: "PH-01-789012345-6", voter_status: "registered",
    lat: 14.6465, lng: 120.9733, created_at: "2024-04-22T15:00:00Z"
  },
  {
    id: "c7", citizen_id: "NCR-MNL-2024-00007",
    full_name: "Lourdes Rivera Bautista", age: 63, sex: "F", civil_status: "Married",
    address: "200 Tondo, Brgy. 15", barangay: "Brgy. 15", city: "Manila", province: "Metro Manila", region: "NCR",
    contact: "0923-789-0123", email: "lourdes.bautista@email.com", occupation: "Retired Government Employee",
    philhealth_id: "PH-01-890123456-7", voter_status: "registered",
    lat: 14.6136, lng: 120.9747, created_at: "2023-08-01T08:30:00Z"
  },
  {
    id: "c8", citizen_id: "NCR-PSY-2024-00008",
    full_name: "Mark Anthony Dela Rosa", age: 25, sex: "M", civil_status: "Single",
    address: "32 EDSA Extension, Brgy. Baclaran", barangay: "Baclaran", city: "Pasay", province: "Metro Manila", region: "NCR",
    contact: "0924-890-1234", email: "mark.delarosa@email.com", occupation: "Grab Food Rider",
    philhealth_id: "PH-01-901234567-8", voter_status: "unregistered",
    lat: 14.5243, lng: 121.0012, created_at: "2025-01-08T16:00:00Z"
  },
  {
    id: "c9", citizen_id: "NCR-MND-2024-00009",
    full_name: "Angelica Mae Gonzales", age: 22, sex: "F", civil_status: "Single",
    address: "Unit 3, Greenfield Residences, Shaw Blvd.", barangay: "Barangka", city: "Mandaluyong", province: "Metro Manila", region: "NCR",
    contact: "0925-901-2345", email: "angelica.gonzales@email.com", occupation: "College Student / Part-time Barista",
    philhealth_id: "PH-01-012345678-9", voter_status: "registered",
    lat: 14.5794, lng: 121.0359, created_at: "2025-06-20T09:30:00Z"
  },
  {
    id: "c10", citizen_id: "NCR-QC-2024-00010",
    full_name: "Eduardo Santiago Ramos", age: 38, sex: "M", civil_status: "Married",
    address: "17 Visayas Ave., Brgy. Vasra", barangay: "Vasra", city: "Quezon City", province: "Metro Manila", region: "NCR",
    contact: "0926-012-3456", email: "eduardo.ramos@email.com", occupation: "OFW - Seaman",
    philhealth_id: "PH-01-123456789-0", voter_status: "registered",
    lat: 14.6580, lng: 121.0390, created_at: "2024-09-12T07:00:00Z"
  },
  {
    id: "c11", citizen_id: "NCR-MKT-2024-00011",
    full_name: "Carmen Soriano Lopez", age: 50, sex: "F", civil_status: "Separated",
    address: "789 JP Rizal St., Brgy. Poblacion", barangay: "Poblacion", city: "Makati", province: "Metro Manila", region: "NCR",
    contact: "0927-123-4567", email: "carmen.lopez@email.com", occupation: "Market Vendor",
    philhealth_id: "PH-01-234567891-1", voter_status: "registered",
    lat: 14.5636, lng: 121.0300, created_at: "2024-05-18T13:00:00Z"
  },
  {
    id: "c12", citizen_id: "NCR-TGG-2024-00012",
    full_name: "Paolo Miguel Fernandez", age: 29, sex: "M", civil_status: "Single",
    address: "Tower C, One Serendra, BGC", barangay: "Fort Bonifacio", city: "Taguig", province: "Metro Manila", region: "NCR",
    contact: "0928-234-5678", email: "paolo.fernandez@email.com", occupation: "Digital Marketing Manager",
    philhealth_id: "PH-01-345678902-2", voter_status: "registered",
    lat: 14.5503, lng: 121.0475, created_at: "2025-02-28T10:00:00Z"
  },
  {
    id: "c13", citizen_id: "R4A-BTG-2024-00013",
    full_name: "Gregoria Magsaysay Dimaculangan", age: 67, sex: "F", civil_status: "Widowed",
    address: "Purok 3, Brgy. Kumintang Ibaba", barangay: "Kumintang Ibaba", city: "Batangas City", province: "Batangas", region: "Region IV-A",
    contact: "0929-345-6789", email: "gregoria.dimaculangan@email.com", occupation: "Sari-sari Store Owner",
    philhealth_id: "PH-04-456789013-3", voter_status: "registered",
    lat: 13.7565, lng: 121.0582, created_at: "2023-07-04T08:00:00Z"
  },
  {
    id: "c14", citizen_id: "R7-CEB-2024-00014",
    full_name: "Ricardo Enrique Osmeña", age: 44, sex: "M", civil_status: "Married",
    address: "56 Colon St., Brgy. Sto. Niño", barangay: "Sto. Niño", city: "Cebu City", province: "Cebu", region: "Region VII",
    contact: "0930-456-7890", email: "ricardo.osmena@email.com", occupation: "Restaurant Owner",
    philhealth_id: "PH-07-567890124-4", voter_status: "registered",
    lat: 10.3157, lng: 123.8854, created_at: "2024-08-10T12:00:00Z"
  },
  {
    id: "c15", citizen_id: "R11-DVO-2024-00015",
    full_name: "Fatima Zahra Maranao", age: 30, sex: "F", civil_status: "Married",
    address: "Block 4, NHA, Brgy. Buhangin", barangay: "Buhangin", city: "Davao City", province: "Davao del Sur", region: "Region XI",
    contact: "0931-567-8901", email: "fatima.maranao@email.com", occupation: "Community Health Worker",
    philhealth_id: "PH-11-678901235-5", voter_status: "registered",
    lat: 7.1907, lng: 125.4553, created_at: "2025-03-15T09:00:00Z"
  },
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim().toLowerCase();
    const id = searchParams.get("id")?.trim();

    // Return specific citizen by id
    if (id) {
      const citizen = DEMO_CITIZENS.find(c => c.id === id || c.citizen_id === id);
      if (citizen) {
        return NextResponse.json({ success: true, citizen });
      }
      return NextResponse.json({ success: false, error: "Citizen not found" }, { status: 404 });
    }

    // Search citizens
    if (!q || q.length < 1) {
      // Return all citizens if no query
      return NextResponse.json({ success: true, citizens: DEMO_CITIZENS, total: DEMO_CITIZENS.length });
    }

    const results = DEMO_CITIZENS.filter(c =>
      c.full_name.toLowerCase().includes(q) ||
      c.citizen_id.toLowerCase().includes(q) ||
      c.city.toLowerCase().includes(q) ||
      c.barangay.toLowerCase().includes(q) ||
      c.occupation.toLowerCase().includes(q) ||
      c.contact.includes(q)
    );

    return NextResponse.json({ success: true, citizens: results, total: results.length });
  } catch (error) {
    console.error("Citizens API Error:", error);
    return NextResponse.json({ success: false, error: "Failed to search citizens" }, { status: 500 });
  }
}
