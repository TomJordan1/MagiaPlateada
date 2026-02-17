-- Add membership_type column to experts table
ALTER TABLE experts ADD COLUMN IF NOT EXISTS membership_type TEXT NOT NULL DEFAULT 'free' CHECK (membership_type IN ('free', 'premium'));

-- Update the is_featured column to sync with premium membership
-- (premium experts are automatically featured)
UPDATE experts SET is_featured = true WHERE membership_type = 'premium';
