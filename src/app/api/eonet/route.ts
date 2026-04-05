import { NextResponse } from "next/server";

// Cache EONET data for 5 minutes to avoid spamming NASA
let cachedData: any = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Philippines bounding box (approximate)
const PH_BBOX = { minLon: 115, maxLon: 130, minLat: 4, maxLat: 22 };

function isInPhilippines(coords: [number, number]): boolean {
  const [lon, lat] = coords;
  return (
    lon >= PH_BBOX.minLon &&
    lon <= PH_BBOX.maxLon &&
    lat >= PH_BBOX.minLat &&
    lat <= PH_BBOX.maxLat
  );
}

// Category metadata for the frontend
const CATEGORY_META: Record<string, { color: string; icon: string; severity: string }> = {
  severeStorms: { color: "#ef4444", icon: "storm", severity: "critical" },
  earthquakes: { color: "#dc2626", icon: "earthquake", severity: "critical" },
  volcanoes: { color: "#f97316", icon: "volcano", severity: "high" },
  wildfires: { color: "#f97316", icon: "fire", severity: "high" },
  floods: { color: "#3b82f6", icon: "flood", severity: "high" },
  landslides: { color: "#6366f1", icon: "landslide", severity: "high" },
  drought: { color: "#eab308", icon: "drought", severity: "medium" },
  tempExtremes: { color: "#eab308", icon: "temperature", severity: "medium" },
  dustHaze: { color: "#a3a3a3", icon: "haze", severity: "low" },
  snow: { color: "#93c5fd", icon: "snow", severity: "low" },
  seaLakeIce: { color: "#67e8f9", icon: "ice", severity: "low" },
  waterColor: { color: "#2dd4bf", icon: "water", severity: "low" },
  manmade: { color: "#a855f7", icon: "manmade", severity: "medium" },
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const phOnly = searchParams.get("ph") === "true";
  const category = searchParams.get("category");
  const limit = parseInt(searchParams.get("limit") || "80");

  try {
    const now = Date.now();

    // Return cached data if fresh
    if (cachedData && now - cacheTimestamp < CACHE_DURATION) {
      const filtered = filterEvents(cachedData, phOnly, category);
      return NextResponse.json({
        success: true,
        data: filtered,
        cached: true,
        cacheAge: Math.round((now - cacheTimestamp) / 1000),
        source: "NASA EONET v3",
      });
    }

    // Fetch fresh data from NASA EONET
    const eonetUrl = `https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=${limit}`;
    const res = await fetch(eonetUrl, {
      headers: { Accept: "application/json" },
      next: { revalidate: 300 }, // ISR cache hint
    });

    if (!res.ok) {
      throw new Error(`EONET API returned ${res.status}`);
    }

    const raw = await res.json();

    // Transform events into a clean format
    const events = (raw.events || []).map((event: any) => {
      const categoryId = event.categories?.[0]?.id || "unknown";
      const meta = CATEGORY_META[categoryId] || { color: "#6b7280", icon: "unknown", severity: "low" };

      // Get the latest geometry point
      const latestGeo = event.geometry?.[event.geometry.length - 1];
      const coords: [number, number] = latestGeo?.coordinates || [0, 0];
      const inPH = isInPhilippines(coords);

      return {
        id: event.id,
        title: event.title,
        description: event.description,
        link: event.link,
        closed: event.closed,
        categoryId,
        categoryTitle: event.categories?.[0]?.title || "Unknown",
        color: meta.color,
        icon: meta.icon,
        severity: meta.severity,
        coordinates: coords,
        isInPhilippines: inPH,
        date: latestGeo?.date || null,
        magnitude: latestGeo?.magnitudeValue || null,
        magnitudeUnit: latestGeo?.magnitudeUnit || null,
        sources: (event.sources || []).map((s: any) => ({
          id: s.id,
          url: s.url,
        })),
        // Include all geometry points for tracking path (storms, etc.)
        track: event.geometry?.map((g: any) => ({
          coordinates: g.coordinates,
          date: g.date,
          magnitude: g.magnitudeValue,
          magnitudeUnit: g.magnitudeUnit,
        })) || [],
      };
    });

    // Cache the full result
    cachedData = events;
    cacheTimestamp = now;

    const filtered = filterEvents(events, phOnly, category);
    return NextResponse.json({
      success: true,
      data: filtered,
      total: events.length,
      phCount: events.filter((e: any) => e.isInPhilippines).length,
      cached: false,
      source: "NASA EONET v3",
    });
  } catch (error: any) {
    console.error("EONET API Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch EONET data" },
      { status: 500 }
    );
  }
}

function filterEvents(events: any[], phOnly: boolean, category: string | null) {
  let filtered = events;
  if (phOnly) {
    filtered = filtered.filter((e: any) => e.isInPhilippines);
  }
  if (category) {
    const cats = category.split(",");
    filtered = filtered.filter((e: any) => cats.includes(e.categoryId));
  }
  return filtered;
}
