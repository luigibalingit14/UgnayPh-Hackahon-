import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function callGroq(prompt: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY not set (check .env.local)");
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    }),
  });
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const region = searchParams.get("region");
    const crop = searchParams.get("crop");

    let query = supabase
      .from("agri_prices")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (region) query = query.eq("region", region);
    if (crop) query = query.ilike("crop", `%${crop}%`);

    const { data, error } = await query;
    if (error || !data || data.length === 0) {
      console.log("agri GET: Returning demo data (DB empty or error)");
      const demoPrices = [
        { id: "1", crop: "Palay (Rice)", price_per_kg: 19.50, unit: "kg", location: "Nueva Ecija", region: "Region III", farmer_name: "Mang Onyok", is_available: true, created_at: new Date().toISOString() },
        { id: "2", crop: "Kamatis (Tomato)", price_per_kg: 35.00, unit: "kg", location: "Benguet", region: "CAR", farmer_name: "Ate Lorna", is_available: true, created_at: new Date().toISOString() },
        { id: "3", crop: "Sibuyas (Onion)", price_per_kg: 120.00, unit: "kg", location: "Nueva Ecija", region: "Region III", farmer_name: "Mang Ben", is_available: true, created_at: new Date().toISOString() },
        { id: "4", crop: "Mais (Corn)", price_per_kg: 14.00, unit: "kg", location: "Isabela", region: "Region II", farmer_name: "Mang Pedro", is_available: true, created_at: new Date().toISOString() }
      ];
      return NextResponse.json({ success: true, prices: demoPrices });
    }
    return NextResponse.json({ success: true, prices: data });
  } catch (err) {
    console.error("agri GET error:", err);
    return NextResponse.json({ success: true, prices: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // AI Crop Advisory
    if (body.advisory) {
      const { crop, region } = body;
      const prompt = `You are an expert agricultural advisor specializing in Philippine farming.

Provide a comprehensive advisory for growing ${crop || "rice"} in ${region || "Region IV-A (CALABARZON)"}, Philippines.

Include:
1. 🌱 Best planting season/months for this region
2. 🌿 Soil preparation and fertilizer tips (using locally available products)
3. 🪲 Common pests/diseases and organic control methods
4. 💧 Irrigation advice
5. 🌾 Harvest tips and post-harvest handling
6. 💰 Current market opportunities and where to sell in the Philippines
7. 📱 Government programs that can help (e.g., DA programs, RCEF)

Write in Taglish, friendly and practical tone suited for Filipino farmers. Keep under 300 words. Use emojis sparingly.`;
      const advice = await callGroq(prompt);
      return NextResponse.json({ success: true, ai_advice: advice });
    }

    // Post market price
    const { crop, price_per_kg, unit, location, region, farmer_name, contact } = body;
    if (!crop?.trim() || !price_per_kg || !location?.trim()) {
      return NextResponse.json({ success: false, error: "Crop, price, and location are required" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("agri_prices")
      .insert({
        crop, price_per_kg: Number(price_per_kg),
        unit: unit || "kg", location, region: region || "Region IV-A",
        farmer_name: farmer_name || null, contact: contact || null,
        user_id: user?.id || null,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, price: data });
  } catch (err) {
    console.error("agri POST error:", err);
    return NextResponse.json({ success: false, error: "Failed to process request" }, { status: 500 });
  }
}
