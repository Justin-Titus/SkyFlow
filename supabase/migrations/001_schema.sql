-- flights table
CREATE TABLE flights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  flight_no VARCHAR(10) NOT NULL UNIQUE,
  origin VARCHAR(3) NOT NULL,
  destination VARCHAR(3) NOT NULL,
  departs_at TIMESTAMPTZ NOT NULL,
  arrives_at TIMESTAMPTZ NOT NULL,
  aircraft_type VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled','boarding','departed','arrived','cancelled')),
  base_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- seats table  
CREATE TABLE seats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  flight_id UUID REFERENCES flights(id) ON DELETE CASCADE,
  seat_number VARCHAR(4) NOT NULL,
  class VARCHAR(10) NOT NULL CHECK (class IN ('economy','business','first')),
  is_available BOOLEAN DEFAULT TRUE,
  extra_fee DECIMAL(10,2) DEFAULT 0,
  UNIQUE(flight_id, seat_number)
);

-- bookings table
CREATE TABLE bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  flight_id UUID REFERENCES flights(id) NOT NULL,
  seat_id UUID REFERENCES seats(id) NOT NULL,
  status VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('confirmed','rescheduled','cancelled')),
  booked_at TIMESTAMPTZ DEFAULT NOW(),
  total_price DECIMAL(10,2) NOT NULL,
  pnr_code VARCHAR(6) NOT NULL UNIQUE
);

-- passengers table
CREATE TABLE passengers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  full_name VARCHAR(100) NOT NULL,
  passport_no VARCHAR(20) NOT NULL,
  nationality VARCHAR(50) NOT NULL,
  dob DATE NOT NULL CHECK (dob < CURRENT_DATE AND dob > CURRENT_DATE - INTERVAL '150 years')
);

-- reschedules table
CREATE TABLE reschedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,
  old_flight_id UUID REFERENCES flights(id) ON DELETE SET NULL,
  new_flight_id UUID REFERENCES flights(id) ON DELETE SET NULL,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  fee_charged DECIMAL(10,2) DEFAULT 0
);

-- Indexes for performance
-- Flights table indexes
CREATE INDEX idx_flights_departs_at ON flights(departs_at);
CREATE INDEX idx_flights_origin ON flights(origin);
CREATE INDEX idx_flights_destination ON flights(destination);
CREATE INDEX idx_flights_origin_destination_departs_at ON flights(origin, destination, departs_at);

-- Bookings table indexes
CREATE INDEX idx_bookings_user_id ON bookings(user_id);

-- Seats table indexes (partial index for available seats)
CREATE INDEX idx_seats_flight_class_available ON seats(flight_id, class) WHERE is_available = TRUE;

-- Foreign key ON DELETE behavior
ALTER TABLE bookings DROP CONSTRAINT bookings_user_id_fkey;
ALTER TABLE bookings ADD CONSTRAINT bookings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE bookings DROP CONSTRAINT bookings_flight_id_fkey;
ALTER TABLE bookings ADD CONSTRAINT bookings_flight_id_fkey FOREIGN KEY (flight_id) REFERENCES flights(id) ON DELETE RESTRICT;

ALTER TABLE bookings DROP CONSTRAINT bookings_seat_id_fkey;
ALTER TABLE bookings ADD CONSTRAINT bookings_seat_id_fkey FOREIGN KEY (seat_id) REFERENCES seats(id) ON DELETE RESTRICT;

ALTER TABLE seats DROP CONSTRAINT seats_flight_id_fkey;
ALTER TABLE seats ADD CONSTRAINT seats_flight_id_fkey FOREIGN KEY (flight_id) REFERENCES flights(id) ON DELETE CASCADE;
-- Enable Realtime for seats table
ALTER PUBLICATION supabase_realtime ADD TABLE seats;
