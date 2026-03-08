-- Patch: add missing columns, indexes, and cascade rules for TG integration

-- 1. Add timezone column to telegram_links
ALTER TABLE telegram_links
  ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Asia/Taipei';

-- 2. Add missing indexes
CREATE INDEX IF NOT EXISTS idx_telegram_links_token ON telegram_links(link_token);
CREATE INDEX IF NOT EXISTS idx_payment_reminders_user ON payment_reminders(user_id);

-- 3. Upgrade FK to CASCADE on delete (drop + re-add)
ALTER TABLE telegram_links
  DROP CONSTRAINT IF EXISTS telegram_links_user_id_fkey,
  ADD CONSTRAINT telegram_links_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE payment_reminders
  DROP CONSTRAINT IF EXISTS payment_reminders_user_id_fkey,
  ADD CONSTRAINT payment_reminders_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
