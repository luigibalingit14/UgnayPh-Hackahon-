import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const supabase = await createClient();
    
    // Fetch all current nodes
    const { data: nodes, error: fetchErr } = await supabase.from("traffic_nodes").select("*");
    
    if (fetchErr || !nodes || nodes.length === 0) {
      return NextResponse.json({ success: false, error: "No nodes found or table not created." });
    }

    // Simulate new traffic speeds
    const updates = nodes.map(node => {
      let newSpeed = node.current_speed + (Math.floor(Math.random() * 21) - 10);
      
      // 15% chance of sudden heavy traffic jam
      if (Math.random() < 0.15) newSpeed = Math.floor(Math.random() * 15) + 5; 
      
      // Boundaries
      if (newSpeed < 5) newSpeed = 5;
      if (newSpeed > 65) newSpeed = 65;

      let status = "fast";
      if (newSpeed <= 20) status = "heavy";
      else if (newSpeed <= 45) status = "medium";

      return {
        id: node.id,
        name: node.name,
        road_name: node.road_name,
        lat: node.lat,
        lng: node.lng,
        current_speed: newSpeed,
        status,
        last_updated: new Date().toISOString()
      };
    });

    // Supabase upsert requires the primary key in the payload, which we included (id)
    const { error: updateErr } = await supabase.from("traffic_nodes").upsert(updates, { onConflict: 'id' });
    
    if (updateErr) throw updateErr;

    return NextResponse.json({ success: true, count: updates.length });

  } catch (err: any) {
    console.error("Traffic Simulate Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
