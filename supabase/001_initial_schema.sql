-- Categories
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT '#6B7280',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed default categories
INSERT INTO categories (name, color) VALUES
  ('Food & Dining', '#EF4444'),
  ('Transportation', '#F97316'),
  ('Shopping', '#EAB308'),
  ('Entertainment', '#22C55E'),
  ('Health & Medical', '#14B8A6'),
  ('Utilities', '#3B82F6'),
  ('Housing & Rent', '#6366F1'),
  ('Insurance', '#8B5CF6'),
  ('Subscriptions', '#EC4899'),
  ('Travel', '#F43F5E'),
  ('Other', '#6B7280');

-- Documents (uploaded files)
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  file_url TEXT NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'other',
  status TEXT NOT NULL DEFAULT 'uploaded'
    CHECK (status IN ('uploaded', 'processing', 'extracted', 'posted', 'error')),
  extracted_json JSONB,
  extracted_text TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Expenses
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  month TEXT NOT NULL, -- YYYY-MM
  vendor TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  category_id UUID REFERENCES categories(id),
  payment_method TEXT,
  source_document_id UUID UNIQUE REFERENCES documents(id),
  invoice_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Merchant rules for auto-categorization
CREATE TABLE merchant_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_pattern TEXT NOT NULL UNIQUE,
  category_id UUID NOT NULL REFERENCES categories(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_expenses_month ON expenses(month);
CREATE INDEX idx_expenses_category ON expenses(category_id);
CREATE INDEX idx_documents_status ON documents(status);

-- Enable storage bucket (run manually in Supabase dashboard or via CLI)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', true);
