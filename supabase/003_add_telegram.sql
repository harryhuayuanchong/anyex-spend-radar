-- Telegram bot integration: user linking + payment reminders

-- User TG binding
CREATE TABLE telegram_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  telegram_chat_id BIGINT NOT NULL,
  telegram_username TEXT,
  link_token TEXT UNIQUE,
  linked_at TIMESTAMPTZ,
  timezone TEXT DEFAULT 'Asia/Taipei',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id),
  UNIQUE(telegram_chat_id)
);

-- Payment reminders
CREATE TABLE payment_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vendor TEXT NOT NULL,
  category_id UUID REFERENCES categories(id),
  due_day INT NOT NULL CHECK (due_day BETWEEN 1 AND 31),
  amount NUMERIC(12,2),
  currency TEXT DEFAULT 'USD',
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_telegram_links_chat_id ON telegram_links(telegram_chat_id);
CREATE INDEX idx_telegram_links_token ON telegram_links(link_token);
CREATE INDEX idx_payment_reminders_user ON payment_reminders(user_id);
CREATE INDEX idx_payment_reminders_due_day ON payment_reminders(due_day);
