-- ====================================================================
-- BAYANIHAN TRAFFIC MONITOR - SQL SETUP
-- Run this in your Supabase SQL Editor to create the traffic table.
-- ====================================================================

-- 1. Create the Traffic Nodes table
CREATE TABLE IF NOT EXISTS public.traffic_nodes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    road_name VARCHAR(255) NOT NULL,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    current_speed INT DEFAULT 60,
    status VARCHAR(50) DEFAULT 'fast', -- fast (green), medium (orange), heavy (red)
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Insert Seed Data: Major Metro Manila Routes (e.g. EDSA, C5)
-- We will scatter these nodes to represent the "Bayanihan Traffic Maps".
INSERT INTO public.traffic_nodes (name, road_name, lat, lng, current_speed, status)
VALUES
    ('EDSA - Monumento', 'EDSA', 14.6560, 120.9840, 60, 'fast'),
    ('EDSA - Balintawak', 'EDSA', 14.6567, 121.0003, 60, 'fast'),
    ('EDSA - Muñoz', 'EDSA', 14.6534, 121.0188, 55, 'fast'),
    ('EDSA - North Ave', 'EDSA', 14.6517, 121.0319, 50, 'medium'),
    ('EDSA - Quezon Ave', 'EDSA', 14.6433, 121.0381, 45, 'medium'),
    ('EDSA - Kamuning', 'EDSA', 14.6300, 121.0440, 60, 'fast'),
    ('EDSA - Cubao (Farmers)', 'EDSA', 14.6186, 121.0526, 60, 'fast'),
    ('EDSA - Santolan', 'EDSA', 14.6074, 121.0549, 60, 'fast'),
    ('EDSA - Ortigas', 'EDSA', 14.5878, 121.0569, 50, 'fast'),
    ('EDSA - Shaw Blvd', 'EDSA', 14.5786, 121.0526, 45, 'medium'),
    ('EDSA - Boni Ave', 'EDSA', 14.5727, 121.0475, 40, 'medium'),
    ('EDSA - Guadalupe', 'EDSA', 14.5663, 121.0456, 60, 'fast'),
    ('EDSA - Buendia', 'EDSA', 14.5518, 121.0366, 60, 'fast'),
    ('EDSA - Ayala', 'EDSA', 14.5428, 121.0268, 60, 'fast'),
    ('EDSA - Magallanes', 'EDSA', 14.5323, 121.0154, 60, 'fast'),
    ('EDSA - Taft', 'EDSA', 14.5385, 120.9996, 60, 'fast'),

    ('C5 - Libis', 'C5', 14.6063, 121.0805, 55, 'fast'),
    ('C5 - Bagong Ilog', 'C5', 14.5683, 121.0664, 50, 'medium'),
    ('C5 - Market Market', 'C5', 14.5492, 121.0574, 45, 'medium'),
    ('C5 - McKinley', 'C5', 14.5348, 121.0519, 60, 'fast');

-- 3. Set RLS (Row Level Security) - allow public read, and update (for demo hackathon brevity)
ALTER TABLE public.traffic_nodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read of traffic_nodes" 
ON public.traffic_nodes FOR SELECT USING (true);

CREATE POLICY "Allow update of traffic_nodes for demo" 
ON public.traffic_nodes FOR UPDATE USING (true);
