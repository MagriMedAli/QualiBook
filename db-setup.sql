CREATE DATABASE agency;

-- Connect to the agency database before running the table statement below.

CREATE TABLE IF NOT EXISTS leads (
    id SERIAL PRIMARY KEY,
    contact_id TEXT UNIQUE NOT NULL,
    name TEXT,
    budget TEXT,
    area TEXT,
    intent TEXT,
    timeline TEXT,
    stage TEXT DEFAULT 'new',
    qualified BOOLEAN DEFAULT NULL,
    meeting_time TIMESTAMP,
    last_message TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_stage ON leads(stage);
CREATE INDEX IF NOT EXISTS idx_leads_updated_at ON leads(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_meeting_time ON leads(meeting_time);
