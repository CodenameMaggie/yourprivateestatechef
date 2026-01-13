-- ============================================================================
-- YPEC PODCAST BOOKINGS TABLE
-- Purpose: Track Foodie Fridays podcast guest bookings via Calendly
-- Only books on Fridays
-- ============================================================================

CREATE TABLE IF NOT EXISTS ypec_podcast_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Calendly Integration
    calendly_event_uri VARCHAR(255) UNIQUE,
    calendly_invitee_uri VARCHAR(255) UNIQUE,
    
    -- Guest Information
    guest_name VARCHAR(255) NOT NULL,
    guest_email VARCHAR(255) NOT NULL,
    guest_phone VARCHAR(50),
    
    -- Scheduling
    scheduled_date DATE NOT NULL,
    scheduled_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    day_of_week VARCHAR(20) NOT NULL CHECK (day_of_week = 'Friday'),
    timezone VARCHAR(100),
    
    -- Guest Details
    expertise TEXT, -- Chef specialty, cuisine type, etc.
    topic TEXT, -- What they want to discuss
    background TEXT, -- Professional background
    
    -- Booking Status
    status VARCHAR(50) DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'completed', 'canceled', 'no_show', 'rescheduled')),
    booking_created_at TIMESTAMPTZ,
    canceled_at TIMESTAMPTZ,
    cancellation_reason TEXT,
    
    -- Recording Details
    zoom_link VARCHAR(500),
    recording_url VARCHAR(500),
    episode_number INTEGER,
    published_date DATE,
    
    -- Notes
    notes TEXT,
    internal_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_podcast_scheduled_date ON ypec_podcast_bookings(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_podcast_guest_email ON ypec_podcast_bookings(guest_email);
CREATE INDEX IF NOT EXISTS idx_podcast_status ON ypec_podcast_bookings(status);
CREATE INDEX IF NOT EXISTS idx_podcast_day ON ypec_podcast_bookings(day_of_week);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_podcast_booking_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_podcast_booking_timestamp
    BEFORE UPDATE ON ypec_podcast_bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_podcast_booking_timestamp();

-- Sample query to get upcoming Fridays
-- SELECT * FROM ypec_podcast_bookings
-- WHERE scheduled_date >= CURRENT_DATE
--   AND status = 'confirmed'
-- ORDER BY scheduled_date;
