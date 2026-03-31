import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  return R * c; // Distance in km
}

export async function POST(req: NextRequest) {
  try {
    const { lat, lng, speed } = await req.json();
    if (!lat || !lng || speed === undefined) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const supabase = await createClient();
    
    // 1. Fetch all nodes
    const { data: nodes, error: fetchErr } = await supabase.from("traffic_nodes").select("id, name, lat, lng, current_speed");
    if (fetchErr || !nodes) throw fetchErr;

    // 2. Find closest node
    let closestNode = null;
    let minDistance = Infinity;

    for (const node of nodes) {
      const dist = getDistance(lat, lng, node.lat, node.lng);
      if (dist < minDistance) {
        minDistance = dist;
        closestNode = node;
      }
    }

    // If no node is within 10 km, we consider the user "off-grid" for our radar limits
    if (!closestNode || minDistance > 10) {
       return NextResponse.json({ success: true, message: "User is outside tracked metro areas." });
    }

    // 3. Update the node (Weighted average or hard replace since it's an MVP)
    // Hackathon Logic: Let the new ping heavily influence current speed.
    // E.g. (current * 0.3) + (new * 0.7) for dramatic effect in demo.
    let newSpeed = Math.floor((closestNode.current_speed * 0.3) + (speed * 0.7));
    if (newSpeed < 0) newSpeed = 0;
    if (newSpeed > 100) newSpeed = 60; // Max speed allowed

    let status = "fast";
    if (newSpeed <= 25) status = "heavy";
    else if (newSpeed <= 45) status = "medium";

    const { error: updateErr } = await supabase
      .from("traffic_nodes")
      .update({ current_speed: newSpeed, status, last_updated: new Date().toISOString() })
      .eq("id", closestNode.id);

    if (updateErr) throw updateErr;

    return NextResponse.json({ 
        success: true, 
        updatedNode: { id: closestNode.id, name: closestNode.name, old_speed: closestNode.current_speed, new_speed: newSpeed, distance_km: minDistance } 
    });

  } catch (err: any) {
    console.error("Traffic Ping Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
