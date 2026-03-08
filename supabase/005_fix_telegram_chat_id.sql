-- Make telegram_chat_id nullable (not known at link creation time)
ALTER TABLE telegram_links ALTER COLUMN telegram_chat_id DROP NOT NULL;
ALTER TABLE telegram_links ALTER COLUMN telegram_chat_id SET DEFAULT NULL;

-- Clean up the placeholder 0 value
UPDATE telegram_links SET telegram_chat_id = NULL WHERE telegram_chat_id = 0;
