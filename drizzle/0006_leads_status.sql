CREATE TYPE lead_status AS ENUM ('new', 'contacted', 'dismissed');
ALTER TABLE leads ADD COLUMN IF NOT EXISTS status lead_status NOT NULL DEFAULT 'new';
