-- Per-user data isolation
-- Truncate pre-production data before adding NOT NULL user_id columns

TRUNCATE expenses, documents, merchant_rules;

-- Add user_id column to documents
ALTER TABLE documents
  ADD COLUMN user_id UUID NOT NULL REFERENCES auth.users(id);

-- Add user_id column to expenses
ALTER TABLE expenses
  ADD COLUMN user_id UUID NOT NULL REFERENCES auth.users(id);

-- Add user_id column to merchant_rules
ALTER TABLE merchant_rules
  ADD COLUMN user_id UUID NOT NULL REFERENCES auth.users(id);

-- Update merchant_rules unique constraint: per-user vendor patterns
ALTER TABLE merchant_rules
  DROP CONSTRAINT merchant_rules_vendor_pattern_key;
ALTER TABLE merchant_rules
  ADD CONSTRAINT merchant_rules_user_vendor_unique UNIQUE (user_id, vendor_pattern);

-- Indexes for user_id filtering
CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_expenses_user_id ON expenses(user_id);
CREATE INDEX idx_merchant_rules_user_id ON merchant_rules(user_id);
