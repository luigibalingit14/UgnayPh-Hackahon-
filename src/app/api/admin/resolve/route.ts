import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { table, id, updatePayload } = await req.json();

    if (!table || !id || !updatePayload) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const supabase = await createClient();

    // Perform a targeted update to resolve issues across any of the 6 tables
    const { data, error } = await supabase
      .from(table)
      .update(updatePayload)
      .eq('id', id)
      .select();

    if (error) {
      console.error("Resolution update error:", error);
      throw error;
    }

    return NextResponse.json({ success: true, updated: data });
  } catch (error) {
    console.error("Admin Resolve API Error", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
