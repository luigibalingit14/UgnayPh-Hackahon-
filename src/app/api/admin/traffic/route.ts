import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: trafficNodes, error } = await supabase
      .from("traffic_nodes")
      .select("*")
      .order("last_updated", { ascending: false });

    // If table doesn't exist yet, return empty array safely instead of crashing
    if (error && error.code === '42P01') {
       return NextResponse.json({ success: true, data: [] });
    }
    if (error) throw error;

    return NextResponse.json({ success: true, data: trafficNodes });
  } catch (err: any) {
    console.error("Traffic API Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
