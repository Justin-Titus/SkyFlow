-- Atomic seat reservation to prevent double-booking
CREATE OR REPLACE FUNCTION reserve_seat(
  p_user_id UUID,
  p_flight_id UUID,
  p_seat_id UUID,
  p_passenger_name TEXT,
  p_passport_no TEXT,
  p_nationality TEXT,
  p_dob DATE,
  p_total_price DECIMAL
) RETURNS JSON AS $$
DECLARE
  v_pnr TEXT;
  v_booking_id UUID;
  v_seat_available BOOLEAN;
BEGIN
  -- Lock the seat row to prevent race conditions
  SELECT is_available INTO v_seat_available
  FROM seats WHERE id = p_seat_id AND flight_id = p_flight_id
  FOR UPDATE;
  
  -- Verify that p_user_id matches the authenticated user (authorization check)
  IF p_user_id::text <> auth.uid()::text THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized: user ID mismatch');
  END IF;

  -- Check if seat was found and is available (handle NULL case)
  IF NOT FOUND OR v_seat_available IS NULL OR v_seat_available = FALSE THEN
    RETURN json_build_object('success', false, 'error', 'Seat is no longer available');
  END IF;
  
  -- Generate PNR (6 random uppercase alphanumeric characters)
  v_pnr := upper(substring(md5(random()::text) from 1 for 6));
  
  -- Mark seat as occupied
  UPDATE seats SET is_available = FALSE WHERE id = p_seat_id;
  
  -- Create booking
  INSERT INTO bookings (user_id, flight_id, seat_id, total_price, pnr_code)
  VALUES (p_user_id, p_flight_id, p_seat_id, p_total_price, v_pnr)
  RETURNING id INTO v_booking_id;
  
  -- Create passenger record
  INSERT INTO passengers (booking_id, full_name, passport_no, nationality, dob)
  VALUES (v_booking_id, p_passenger_name, p_passport_no, p_nationality, p_dob);
  
  RETURN json_build_object(
    'success', true, 
    'booking_id', v_booking_id, 
    'pnr_code', v_pnr
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Revoke default public execution and restrict to authenticated and service_role
REVOKE EXECUTE ON FUNCTION reserve_seat(UUID, UUID, UUID, TEXT, TEXT, TEXT, DATE, DECIMAL) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION reserve_seat(UUID, UUID, UUID, TEXT, TEXT, TEXT, DATE, DECIMAL) TO authenticated;
GRANT EXECUTE ON FUNCTION reserve_seat(UUID, UUID, UUID, TEXT, TEXT, TEXT, DATE, DECIMAL) TO service_role;

-- Atomic booking cancellation
CREATE OR REPLACE FUNCTION cancel_booking(p_booking_id UUID, p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  v_flight_id UUID;
  v_seat_id UUID;
  v_departs_at TIMESTAMPTZ;
  v_status VARCHAR;
BEGIN
  -- Get booking and flight details, locking the booking row
  SELECT b.flight_id, b.seat_id, b.status, f.departs_at 
  INTO v_flight_id, v_seat_id, v_status, v_departs_at
  FROM bookings b
  JOIN flights f ON f.id = b.flight_id
  WHERE b.id = p_booking_id AND b.user_id = p_user_id
  FOR UPDATE OF b;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Booking not found or unauthorized');
  END IF;

  IF v_status = 'cancelled' THEN
    RETURN json_build_object('success', false, 'error', 'Booking is already cancelled');
  END IF;

  -- Enforce 2-hour rule (also enforced by trigger, but checked here for friendly error)
  IF v_departs_at < (NOW() + interval '2 hours') THEN
    RETURN json_build_object('success', false, 'error', 'Cannot cancel within 2 hours of departure');
  END IF;

  -- Update booking status
  UPDATE bookings SET status = 'cancelled' WHERE id = p_booking_id;
  
  -- Free the seat
  UPDATE seats SET is_available = TRUE WHERE id = v_seat_id;

  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Revoke default public execution and restrict to authenticated and service_role
REVOKE EXECUTE ON FUNCTION cancel_booking(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION cancel_booking(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION cancel_booking(UUID, UUID) TO service_role;

-- Atomic booking reschedule
CREATE OR REPLACE FUNCTION reschedule_booking(p_booking_id UUID, p_user_id UUID, p_new_flight_id UUID)
RETURNS JSON AS $$
DECLARE
  v_old_flight_id UUID;
  v_old_seat_id UUID;
  v_old_class VARCHAR;
  v_old_departs_at TIMESTAMPTZ;
  v_status VARCHAR;
  
  v_new_seat_id UUID;
  v_new_departs_at TIMESTAMPTZ;
  v_old_price DECIMAL;
  v_new_price DECIMAL;
  v_fee DECIMAL := 0;
BEGIN
  -- Get booking details
  SELECT b.flight_id, b.seat_id, b.status, f.departs_at, s.class, b.total_price
  INTO v_old_flight_id, v_old_seat_id, v_status, v_old_departs_at, v_old_class, v_old_price
  FROM bookings b
  JOIN flights f ON f.id = b.flight_id
  JOIN seats s ON s.id = b.seat_id
  WHERE b.id = p_booking_id AND b.user_id = p_user_id
  FOR UPDATE OF b;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Booking not found or unauthorized');
  END IF;

  IF v_status = 'cancelled' THEN
    RETURN json_build_object('success', false, 'error', 'Cannot reschedule a cancelled booking');
  END IF;

  IF v_old_departs_at < (NOW() + interval '2 hours') THEN
    RETURN json_build_object('success', false, 'error', 'Cannot reschedule within 2 hours of departure');
  END IF;

  -- Get new flight details
  SELECT departs_at, base_price INTO v_new_departs_at, v_new_price
  FROM flights WHERE id = p_new_flight_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'New flight not found');
  END IF;

  IF v_new_departs_at < NOW() THEN
    RETURN json_build_object('success', false, 'error', 'Cannot reschedule to a past flight');
  END IF;

  -- Find a seat on the new flight
  SELECT id INTO v_new_seat_id
  FROM seats 
  WHERE flight_id = p_new_flight_id AND class = v_old_class AND is_available = TRUE
  FOR UPDATE SKIP LOCKED
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'No seats available in your class on the new flight');
  END IF;

  -- Calculate fee
  IF v_new_price > v_old_price THEN
    v_fee := v_new_price - v_old_price;
  END IF;

  -- Free old seat
  UPDATE seats SET is_available = TRUE WHERE id = v_old_seat_id;
  
  -- Occupy new seat
  UPDATE seats SET is_available = FALSE WHERE id = v_new_seat_id;

  -- Update booking
  UPDATE bookings 
  SET flight_id = p_new_flight_id, 
      seat_id = v_new_seat_id,
      status = 'rescheduled',
      total_price = total_price + v_fee
  WHERE id = p_booking_id;

  -- Log reschedule
  INSERT INTO reschedules (booking_id, old_flight_id, new_flight_id, fee_charged)
  VALUES (p_booking_id, v_old_flight_id, p_new_flight_id, v_fee);

  RETURN json_build_object('success', true, 'fee', v_fee);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION reschedule_booking(UUID, UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION reschedule_booking(UUID, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION reschedule_booking(UUID, UUID, UUID) TO service_role;
