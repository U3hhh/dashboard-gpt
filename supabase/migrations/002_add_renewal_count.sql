-- Add renewal_count column to subscriptions table
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS renewal_count INTEGER DEFAULT 1;

-- Update existing subscriptions to have a renewal_count of 1
UPDATE subscriptions SET renewal_count = 1 WHERE renewal_count IS NULL;
