import { NextResponse } from "next/server";

// Cache GDACS data for 5 minutes
let cachedData: any = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000;

// Event type metadata
const EVENT_TYPE_META: Record<string, { label: string; icon: string; color: string }> = {
  TC: { label: "Tropical Cyclone", icon: "cyclone", color: "#ef4444" },
  EQ: { label: "Earthquake", icon: "earthquake", color: "#f97316" },
  FL: { label: "Flood", icon: "flood", color: "#3b82f6" },
  VO: { label: "Volcano", icon: "volcano", color: "#dc2626" },
  DR: { label: "Drought", icon: "drought", color: "#eab308" },
  WF: { label: "Wildfire", icon: "fire", color: "#f97316" },
};

// Alert level colours
const ALERT_COLORS: Record<string, string> = {
  Red: "#dc2626",
  Orange: "#f97316",
  Yellow: "#eab308",
  Green: "#22c55e",
};

export async function GET() {
  try {
    const now = Date.now();

    if (cachedData && now - cacheTimestamp < CACHE_DURATION) {
      return NextResponse.json({
        success: true,
        data: cachedData,
        cached: true,
        cacheAge: Math.round((now - cacheTimestamp) / 1000),
        source: "GDACS – Global Disaster Alert and Coordination System",
      });
    }

    // GDACS API — filter by country=Philippines, event types: TC, EQ, FL, VO
    const gdacsUrl =
      "https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH?eventlist=TC;EQ;FL;VO&country=Philippines&limit=50";

    const res = await fetch(gdacsUrl, {
      headers: { Accept: "application/json" },
      next: { revalidate: 300 },
    });

    if (!res.ok) throw new Error(`GDACS API returned ${res.status}`);

    const raw = await res.json();

    const events = (raw.features || []).map((f: any) => {
      const props = f.properties || {};
      const coords = f.geometry?.coordinates || [0, 0];
      const eventType = props.eventtype || "EQ";
      const meta = EVENT_TYPE_META[eventType] || { label: eventType, icon: "unknown", color: "#6b7280" };

      // Determine severity from alertlevel
      let severity: string;
      const alert = props.alertlevel || "Green";
      if (alert === "Red") severity = "critical";
      else if (alert === "Orange") severity = "high";
      else if (alert === "Yellow") severity = "medium";
      else severity = "low";

      // Extract affected countries
      const affectedCountries = (props.affectedcountries || []).map((c: any) => c.countryname).join(", ");

      return {
        id: `gdacs-${eventType}-${props.eventid}`,
        title: props.name || props.description || `${meta.label} Event`,
        description: props.htmldescription || props.description || null,
        eventType,
        eventTypeLabel: meta.label,
        eventName: props.eventname || null,
        coordinates: coords as [number, number], // [lon, lat]
        date: props.fromdate || null,
        endDate: props.todate || null,
        severity,
        color: ALERT_COLORS[alert] || meta.color,
        categoryColor: meta.color,
        alertLevel: alert,
        alertScore: props.alertscore || 0,
        country: props.country || "Philippines",
        affectedCountries,
        magnitude: props.severitydata?.severity || null,
        magnitudeText: props.severitydata?.severitytext || null,
        magnitudeUnit: props.severitydata?.severityunit || null,
        reportUrl: props.url?.report || null,
        glide: props.glide || null,
        source: props.source || "GDACS",
        icon: meta.icon,
        type: "gdacs",
      };
    });

    cachedData = events;
    cacheTimestamp = now;

    return NextResponse.json({
      success: true,
      data: events,
      count: events.length,
      cached: false,
      source: "GDACS – Global Disaster Alert and Coordination System",
    });
  } catch (error: any) {
    console.error("GDACS API Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch GDACS data" },
      { status: 500 }
    );
  }
}
