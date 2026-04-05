import { NextResponse } from "next/server";

// Cache USGS data for 2 minutes (earthquakes update frequently)
let cachedData: any = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 2 * 60 * 1000;

// Philippines bounding box
const PH_BOUNDS = {
  minLat: 4, maxLat: 22,
  minLon: 115, maxLon: 130,
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get("days") || "30");
  const minMag = parseFloat(searchParams.get("minmag") || "2.5");

  try {
    const now = Date.now();

    if (cachedData && now - cacheTimestamp < CACHE_DURATION) {
      return NextResponse.json({
        success: true,
        data: cachedData,
        cached: true,
        cacheAge: Math.round((now - cacheTimestamp) / 1000),
        source: "USGS Earthquake Hazards Program",
      });
    }

    // USGS Earthquake API — filtered to Philippines bbox
    const usgsUrl = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=NOW-${days}DAYS&minmagnitude=${minMag}&minlatitude=${PH_BOUNDS.minLat}&maxlatitude=${PH_BOUNDS.maxLat}&minlongitude=${PH_BOUNDS.minLon}&maxlongitude=${PH_BOUNDS.maxLon}&orderby=time&limit=100`;

    const res = await fetch(usgsUrl, {
      headers: { Accept: "application/json" },
      next: { revalidate: 120 },
    });

    if (!res.ok) throw new Error(`USGS API returned ${res.status}`);

    const raw = await res.json();

    const earthquakes = (raw.features || []).map((f: any) => {
      const props = f.properties || {};
      const coords = f.geometry?.coordinates || [0, 0, 0];
      const mag = props.mag || 0;

      // Determine severity level
      let severity: string;
      let color: string;
      if (mag >= 7.0) { severity = "critical"; color = "#dc2626"; }
      else if (mag >= 5.0) { severity = "high"; color = "#ef4444"; }
      else if (mag >= 4.0) { severity = "medium"; color = "#f97316"; }
      else if (mag >= 3.0) { severity = "low"; color = "#eab308"; }
      else { severity = "minor"; color = "#6b7280"; }

      // Determine alert level color
      let alertColor = "#22c55e"; // green default
      if (props.alert === "red") alertColor = "#dc2626";
      else if (props.alert === "orange") alertColor = "#f97316";
      else if (props.alert === "yellow") alertColor = "#eab308";

      return {
        id: f.id,
        title: props.title || `M ${mag} Earthquake`,
        place: props.place || "Unknown location",
        magnitude: mag,
        magType: props.magType || "ml",
        depth: coords[2] ? Math.round(coords[2]) : null,
        coordinates: [coords[0], coords[1]] as [number, number], // [lon, lat]
        date: props.time ? new Date(props.time).toISOString() : null,
        updated: props.updated ? new Date(props.updated).toISOString() : null,
        severity,
        color,
        alert: props.alert || null,
        alertColor,
        tsunami: props.tsunami === 1,
        felt: props.felt || null,
        cdi: props.cdi || null, // community reported intensity
        mmi: props.mmi || null, // modified mercalli intensity
        significance: props.sig || 0,
        url: props.url || null,
        detailUrl: props.detail || null,
        source: "USGS",
        type: "earthquake",
      };
    });

    cachedData = earthquakes;
    cacheTimestamp = now;

    return NextResponse.json({
      success: true,
      data: earthquakes,
      count: earthquakes.length,
      cached: false,
      source: "USGS Earthquake Hazards Program",
    });
  } catch (error: any) {
    console.error("USGS API Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch USGS data" },
      { status: 500 }
    );
  }
}
