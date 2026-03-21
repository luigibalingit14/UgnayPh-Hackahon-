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
    const category = searchParams.get("category");

    let query = supabase
      .from("governance_complaints")
      .select("*")
      .order("upvotes", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(50);

    if (category) query = query.eq("category", category);

    const { data, error } = await query;
    if (error || !data || data.length === 0) {
      console.log("governance GET: Returning demo data (DB empty or error)");
      const demoComplaints = [
        { id: "1", title: "Potholes on Main Ave", description: "Deep potholes causing traffic and damage to vehicles near the public market.", category: "infrastructure", location: "Main Ave, Brgy. 1", agency: "DPWH", status: "under_review", upvotes: 124, created_at: new Date().toISOString() },
        { id: "2", title: "Delayed Garbage Collection", description: "Garbage hasn't been collected for two weeks in our subdivision.", category: "environment", location: "Phase 2, Sunshine Subd.", agency: "LGU Solid Waste", status: "pending", upvotes: 89, created_at: new Date().toISOString() },
        { id: "3", title: "Broken Streetlights", description: "Streetlights along the highway are busted, making it dangerous at night.", category: "infrastructure", location: "Natl Highway km 23", agency: "MERALCO/LGU", status: "resolved", upvotes: 45, created_at: new Date().toISOString() }
      ];
      return NextResponse.json({ success: true, complaints: demoComplaints });
    }
    return NextResponse.json({ success: true, complaints: data });
  } catch (err) {
    console.error("governance GET error:", err);
    return NextResponse.json({ success: true, complaints: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Upvote
    if (body.upvote && body.complaint_id) {
      const supabase = await createClient();
      const { data: current } = await supabase
        .from("governance_complaints")
        .select("upvotes")
        .eq("id", body.complaint_id)
        .single();
      await supabase
        .from("governance_complaints")
        .update({ upvotes: (current?.upvotes || 0) + 1 })
        .eq("id", body.complaint_id);
      return NextResponse.json({ success: true });
    }

    // AI Draft
    if (body.ai_draft) {
      const prompt = `You are a civic engagement assistant helping Filipino citizens file formal complaints to government agencies.
Write a clear, professional, and polite complaint letter body (3 paragraphs, in English) about the following issue:
Category: ${body.category || "infrastructure"}
Issue title: ${body.title}
The complaint should be formal yet accessible, cite the citizen's right to good governance under Philippine law, and request specific action. Keep it under 200 words.`;
      const draft = await callGroq(prompt);
      return NextResponse.json({ success: true, ai_draft: draft });
    }

    // Submit complaint
    const { title, description, category, location, agency, is_anonymous } = body;
    if (!title?.trim() || !description?.trim()) {
      return NextResponse.json({ success: false, error: "Title and description are required" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("governance_complaints")
      .insert({ title, description, category: category || "other", location: location || null, agency: agency || null, is_anonymous: is_anonymous || false, user_id: user?.id || null })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, complaint: data });
  } catch (err) {
    console.error("governance POST error:", err);
    return NextResponse.json({ success: false, error: "Failed to submit complaint" }, { status: 500 });
  }
}
