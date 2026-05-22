DO $$
DECLARE
  v_flight_id UUID;
  v_row INT;
  v_col CHAR;
  v_class VARCHAR;
  v_extra_fee DECIMAL;
BEGIN
  -- Insert 8 flights across 4 routes inside India
  -- Route 1: DEL to BOM
  INSERT INTO flights (flight_no, origin, destination, departs_at, arrives_at, aircraft_type, base_price)
  VALUES 
    ('FL101', 'DEL', 'BOM', NOW() + interval '10 days', NOW() + interval '10 days 2 hours 10 minutes', 'Boeing 737 MAX', 4999.00),
    ('FL102', 'DEL', 'BOM', NOW() + interval '12 days', NOW() + interval '12 days 2 hours 15 minutes', 'Airbus A321neo', 5499.00)
  ON CONFLICT (flight_no) DO NOTHING;
     
  -- Route 2: BLR to DEL
  INSERT INTO flights (flight_no, origin, destination, departs_at, arrives_at, aircraft_type, base_price)
  VALUES 
    ('FL201', 'BLR', 'DEL', NOW() + interval '5 days', NOW() + interval '5 days 2 hours 40 minutes', 'Boeing 737-800', 5899.00),
    ('FL202', 'BLR', 'DEL', NOW() + interval '7 days', NOW() + interval '7 days 2 hours 45 minutes', 'Airbus A320', 6199.00)
  ON CONFLICT (flight_no) DO NOTHING;

  -- Route 3: BOM to MAA
  INSERT INTO flights (flight_no, origin, destination, departs_at, arrives_at, aircraft_type, base_price)
  VALUES 
    ('FL301', 'BOM', 'MAA', NOW() + interval '2 days', NOW() + interval '2 days 1 hour 50 minutes', 'Airbus A319', 3499.00),
    ('FL302', 'BOM', 'MAA', NOW() + interval '3 days', NOW() + interval '3 days 1 hour 50 minutes', 'Airbus A319', 3699.00)
  ON CONFLICT (flight_no) DO NOTHING;

  -- Route 4: CCU to HYD
  INSERT INTO flights (flight_no, origin, destination, departs_at, arrives_at, aircraft_type, base_price)
  VALUES 
    ('FL401', 'CCU', 'HYD', NOW() + interval '20 days', NOW() + interval '20 days 2 hours 5 minutes', 'Boeing 737 MAX 8', 4799.00),
    ('FL402', 'CCU', 'HYD', NOW() + interval '25 days', NOW() + interval '25 days 2 hours 5 minutes', 'Boeing 737 MAX 8', 4999.00)
  ON CONFLICT (flight_no) DO NOTHING;

  -- Generate Seat Maps for all flights
  FOR v_flight_id IN SELECT id FROM flights LOOP
    -- Total rows: 1 to 10. (Row 1 First, Rows 2-3 Business, Rows 4-10 Economy)
    -- Total cols: A, B, C, D, E, F
    FOR v_row IN 1..10 LOOP
      IF v_row = 1 THEN
        v_class := 'first';
        v_extra_fee := 4000.00;
      ELSIF v_row <= 3 THEN
        v_class := 'business';
        v_extra_fee := 2000.00;
      ELSE
        v_class := 'economy';
        v_extra_fee := 0.00;
      END IF;
      
      -- For First/Business, maybe fewer seats, but let's keep A-F for simplicity or A, C, D, F
      FOREACH v_col IN ARRAY ARRAY['A', 'B', 'C', 'D', 'E', 'F'] LOOP
        -- Skip B and E for First class to simulate wider seats (1A, 1C, 1D, 1F)
        IF v_class = 'first' AND (v_col = 'B' OR v_col = 'E') THEN
          CONTINUE;
        END IF;

        INSERT INTO seats (flight_id, seat_number, class, extra_fee)
        VALUES (v_flight_id, v_row || v_col, v_class, v_extra_fee)
        ON CONFLICT (flight_id, seat_number) DO NOTHING;
      END LOOP;
    END LOOP;
  END LOOP;
END $$;

-- Insert a test user account
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, 
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
)
VALUES (
  '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'test@skyflow.com', 
  crypt('password123', gen_salt('bf')), NOW(), 
  '{"provider": "email", "providers": ["email"]}', '{}', NOW(), NOW(), '', '', '', ''
) ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000000',
  '{"sub": "00000000-0000-0000-0000-000000000000", "email": "test@skyflow.com", "email_verified": true, "phone_verified": false}'::jsonb,
  'email',
  '00000000-0000-0000-0000-000000000000',
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;
