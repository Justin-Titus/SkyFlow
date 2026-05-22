-- Trigger function to enforce the 2-hour cancellation rule at the database level
CREATE OR REPLACE FUNCTION check_cancellation_time()
RETURNS TRIGGER AS $$
DECLARE
  v_departs_at TIMESTAMPTZ;
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    SELECT departs_at INTO v_departs_at FROM flights WHERE id = NEW.flight_id;
    
    IF v_departs_at < (NOW() + interval '2 hours') THEN
      RAISE EXCEPTION 'Cannot cancel booking within 2 hours of departure';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER enforce_2hr_cancellation
BEFORE UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION check_cancellation_time();
