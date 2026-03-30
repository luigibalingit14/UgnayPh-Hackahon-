-- ============================================
-- DEMO CITIZENS SEED SCRIPT
-- Run this in your Supabase Dashboard SQL Editor
-- This will insert 15 demo users into auth.users 
-- and then insert their full details into public.profiles
-- Password for all is: password123
-- ============================================

-- Ensure pgcrypto is enabled for hashing passwords
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================
-- 1. CREATE MISSING COLUMNS IN PROFILES TABLE
-- ============================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS citizen_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS age INTEGER;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS sex TEXT CHECK (sex IN ('M', 'F'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS civil_status TEXT DEFAULT 'Single';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS barangay TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS province TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS region TEXT DEFAULT 'NCR';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS contact TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS occupation TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS philhealth_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS voter_status TEXT DEFAULT 'unregistered' CHECK (voter_status IN ('registered', 'unregistered'));

-- ============================================
-- 2. SEED THE DASHBOARD DATA
-- ============================================

DO $$
DECLARE
  v_instance_id uuid := '00000000-0000-0000-0000-000000000000';
  
  -- Create predictable UUIDs for our 15 users
  v_uuid_1 uuid := '11111111-1111-1111-1111-111111111111';
  v_uuid_2 uuid := '22222222-2222-2222-2222-222222222222';
  v_uuid_3 uuid := '33333333-3333-3333-3333-333333333333';
  v_uuid_4 uuid := '44444444-4444-4444-4444-444444444444';
  v_uuid_5 uuid := '55555555-5555-5555-5555-555555555555';
  v_uuid_6 uuid := '66666666-6666-6666-6666-666666666666';
  v_uuid_7 uuid := '77777777-7777-7777-7777-777777777777';
  v_uuid_8 uuid := '88888888-8888-8888-8888-888888888888';
  v_uuid_9 uuid := '99999999-9999-9999-9999-999999999999';
  v_uuid_10 uuid := '00000000-0000-0000-0000-000000000010';
  v_uuid_11 uuid := '00000000-0000-0000-0000-000000000011';
  v_uuid_12 uuid := '00000000-0000-0000-0000-000000000012';
  v_uuid_13 uuid := '00000000-0000-0000-0000-000000000013';
  v_uuid_14 uuid := '00000000-0000-0000-0000-000000000014';
  v_uuid_15 uuid := '00000000-0000-0000-0000-000000000015';

BEGIN
  -- 1. INSERT INTO AUTH.USERS
  -- (Ignore if already exist)
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
  VALUES 
  (v_uuid_1, v_instance_id, 'authenticated', 'authenticated', 'maria.santos@email.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Maria Clara Santos"}', now(), now(), '', '', '', ''),
  (v_uuid_2, v_instance_id, 'authenticated', 'authenticated', 'jose.reyes@email.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Jose Andres Reyes Jr."}', now(), now(), '', '', '', ''),
  (v_uuid_3, v_instance_id, 'authenticated', 'authenticated', 'rosario.garcia@email.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Rosario Lim Garcia"}', now(), now(), '', '', '', ''),
  (v_uuid_4, v_instance_id, 'authenticated', 'authenticated', 'roberto.mendoza@email.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Roberto Cruz Mendoza"}', now(), now(), '', '', '', ''),
  (v_uuid_5, v_instance_id, 'authenticated', 'authenticated', 'ana.villanueva@email.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Ana Patricia Villanueva"}', now(), now(), '', '', '', ''),
  (v_uuid_6, v_instance_id, 'authenticated', 'authenticated', 'fernando.tan@email.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Fernando Aquino Tan"}', now(), now(), '', '', '', ''),
  (v_uuid_7, v_instance_id, 'authenticated', 'authenticated', 'lourdes.bautista@email.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Lourdes Rivera Bautista"}', now(), now(), '', '', '', ''),
  (v_uuid_8, v_instance_id, 'authenticated', 'authenticated', 'mark.delarosa@email.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Mark Anthony Dela Rosa"}', now(), now(), '', '', '', ''),
  (v_uuid_9, v_instance_id, 'authenticated', 'authenticated', 'angelica.gonzales@email.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Angelica Mae Gonzales"}', now(), now(), '', '', '', ''),
  (v_uuid_10, v_instance_id, 'authenticated', 'authenticated', 'eduardo.ramos@email.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Eduardo Santiago Ramos"}', now(), now(), '', '', '', ''),
  (v_uuid_11, v_instance_id, 'authenticated', 'authenticated', 'carmen.lopez@email.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Carmen Soriano Lopez"}', now(), now(), '', '', '', ''),
  (v_uuid_12, v_instance_id, 'authenticated', 'authenticated', 'paolo.fernandez@email.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Paolo Miguel Fernandez"}', now(), now(), '', '', '', ''),
  (v_uuid_13, v_instance_id, 'authenticated', 'authenticated', 'gregoria.dimaculangan@email.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Gregoria Magsaysay Dimaculangan"}', now(), now(), '', '', '', ''),
  (v_uuid_14, v_instance_id, 'authenticated', 'authenticated', 'ricardo.osmena@email.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Ricardo Enrique Osmeña"}', now(), now(), '', '', '', ''),
  (v_uuid_15, v_instance_id, 'authenticated', 'authenticated', 'fatima.maranao@email.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Fatima Zahra Maranao"}', now(), now(), '', '', '', '')
  ON CONFLICT (id) DO NOTHING;

  -- 2. INSERT/UPDATE PUBLIC.PROFILES
  -- (This overwrites existing values in case the profile trigger already ran)
  
  -- Maria
  UPDATE public.profiles SET citizen_id='NCR-MNL-2024-00001', full_name='Maria Clara Santos', age=34, sex='F', civil_status='Married', address='123 Rizal St., Brgy. San Miguel', barangay='San Miguel', city='Manila', province='Metro Manila', region='NCR', contact='0917-123-4567', occupation='Public School Teacher', philhealth_id='PH-01-234567890-1', voter_status='registered' WHERE id = v_uuid_1;
  
  -- Jose
  UPDATE public.profiles SET citizen_id='NCR-QC-2024-00002', full_name='Jose Andres Reyes Jr.', age=42, sex='M', civil_status='Married', address='45 Mabini Ave., Brgy. Commonwealth', barangay='Commonwealth', city='Quezon City', province='Metro Manila', region='NCR', contact='0918-234-5678', occupation='Tricycle Driver', philhealth_id='PH-01-345678901-2', voter_status='registered' WHERE id = v_uuid_2;
  
  -- Rosario
  UPDATE public.profiles SET citizen_id='NCR-MKT-2024-00003', full_name='Rosario Lim Garcia', age=28, sex='F', civil_status='Single', address='Unit 5B, Palm Tower, Ayala Ave.', barangay='Bel-Air', city='Makati', province='Metro Manila', region='NCR', contact='0919-345-6789', occupation='Software Developer', philhealth_id='PH-01-456789012-3', voter_status='registered' WHERE id = v_uuid_3;
  
  -- Roberto
  UPDATE public.profiles SET citizen_id='NCR-TGG-2024-00004', full_name='Roberto Cruz Mendoza', age=55, sex='M', civil_status='Widowed', address='Block 7, Lot 12, Signal Village', barangay='Signal Village', city='Taguig', province='Metro Manila', region='NCR', contact='0920-456-7890', occupation='Security Guard', philhealth_id='PH-01-567890123-4', voter_status='registered' WHERE id = v_uuid_4;
  
  -- Ana
  UPDATE public.profiles SET citizen_id='NCR-PSG-2024-00005', full_name='Ana Patricia Villanueva', age=31, sex='F', civil_status='Single', address='88 Shaw Blvd., Brgy. Wack-Wack', barangay='Wack-Wack', city='Pasig', province='Metro Manila', region='NCR', contact='0921-567-8901', occupation='Registered Nurse', philhealth_id='PH-01-678901234-5', voter_status='registered' WHERE id = v_uuid_5;
  
  -- Fernando
  UPDATE public.profiles SET citizen_id='NCR-CLN-2024-00006', full_name='Fernando Aquino Tan', age=47, sex='M', civil_status='Married', address='15 10th Ave., Brgy. 123', barangay='Brgy. 123', city='Caloocan', province='Metro Manila', region='NCR', contact='0922-678-9012', occupation='Jeepney Operator', philhealth_id='PH-01-789012345-6', voter_status='registered' WHERE id = v_uuid_6;

  -- Lourdes
  UPDATE public.profiles SET citizen_id='NCR-MNL-2024-00007', full_name='Lourdes Rivera Bautista', age=63, sex='F', civil_status='Married', address='200 Tondo, Brgy. 15', barangay='Brgy. 15', city='Manila', province='Metro Manila', region='NCR', contact='0923-789-0123', occupation='Retired Government Employee', philhealth_id='PH-01-890123456-7', voter_status='registered' WHERE id = v_uuid_7;
  
  -- Mark
  UPDATE public.profiles SET citizen_id='NCR-PSY-2024-00008', full_name='Mark Anthony Dela Rosa', age=25, sex='M', civil_status='Single', address='32 EDSA Extension, Brgy. Baclaran', barangay='Baclaran', city='Pasay', province='Metro Manila', region='NCR', contact='0924-890-1234', occupation='Grab Food Rider', philhealth_id='PH-01-901234567-8', voter_status='unregistered' WHERE id = v_uuid_8;
  
  -- Angelica
  UPDATE public.profiles SET citizen_id='NCR-MND-2024-00009', full_name='Angelica Mae Gonzales', age=22, sex='F', civil_status='Single', address='Unit 3, Greenfield Residences, Shaw Blvd.', barangay='Barangka', city='Mandaluyong', province='Metro Manila', region='NCR', contact='0925-901-2345', occupation='College Student / Part-time Barista', philhealth_id='PH-01-012345678-9', voter_status='registered' WHERE id = v_uuid_9;
  
  -- Eduardo
  UPDATE public.profiles SET citizen_id='NCR-QC-2024-00010', full_name='Eduardo Santiago Ramos', age=38, sex='M', civil_status='Married', address='17 Visayas Ave., Brgy. Vasra', barangay='Vasra', city='Quezon City', province='Metro Manila', region='NCR', contact='0926-012-3456', occupation='OFW - Seaman', philhealth_id='PH-01-123456789-0', voter_status='registered' WHERE id = v_uuid_10;
  
  -- Carmen
  UPDATE public.profiles SET citizen_id='NCR-MKT-2024-00011', full_name='Carmen Soriano Lopez', age=50, sex='F', civil_status='Separated', address='789 JP Rizal St., Brgy. Poblacion', barangay='Poblacion', city='Makati', province='Metro Manila', region='NCR', contact='0927-123-4567', occupation='Market Vendor', philhealth_id='PH-01-234567891-1', voter_status='registered' WHERE id = v_uuid_11;
  
  -- Paolo
  UPDATE public.profiles SET citizen_id='NCR-TGG-2024-00012', full_name='Paolo Miguel Fernandez', age=29, sex='M', civil_status='Single', address='Tower C, One Serendra, BGC', barangay='Fort Bonifacio', city='Taguig', province='Metro Manila', region='NCR', contact='0928-234-5678', occupation='Digital Marketing Manager', philhealth_id='PH-01-345678902-2', voter_status='registered' WHERE id = v_uuid_12;
  
  -- Gregoria
  UPDATE public.profiles SET citizen_id='R4A-BTG-2024-00013', full_name='Gregoria Magsaysay Dimaculangan', age=67, sex='F', civil_status='Widowed', address='Purok 3, Brgy. Kumintang Ibaba', barangay='Kumintang Ibaba', city='Batangas City', province='Batangas', region='Region IV-A', contact='0929-345-6789', occupation='Sari-sari Store Owner', philhealth_id='PH-04-456789013-3', voter_status='registered' WHERE id = v_uuid_13;
  
  -- Ricardo
  UPDATE public.profiles SET citizen_id='R7-CEB-2024-00014', full_name='Ricardo Enrique Osmeña', age=44, sex='M', civil_status='Married', address='56 Colon St., Brgy. Sto. Niño', barangay='Sto. Niño', city='Cebu City', province='Cebu', region='Region VII', contact='0930-456-7890', occupation='Restaurant Owner', philhealth_id='PH-07-567890124-4', voter_status='registered' WHERE id = v_uuid_14;
  
  -- Fatima
  UPDATE public.profiles SET citizen_id='R11-DVO-2024-00015', full_name='Fatima Zahra Maranao', age=30, sex='F', civil_status='Married', address='Block 4, NHA, Brgy. Buhangin', barangay='Buhangin', city='Davao City', province='Davao del Sur', region='Region XI', contact='0931-567-8901', occupation='Community Health Worker', philhealth_id='PH-11-678901235-5', voter_status='registered' WHERE id = v_uuid_15;

END $$;
