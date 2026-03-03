export interface Category {
  id: string;
  name: string;
  color: string;
}

export interface Document {
  id: string;
  user_id: string;
  filename: string;
  file_url: string;
  source_type: string;
  status: "uploaded" | "processing" | "extracted" | "posted" | "error";
  extracted_json: ExtractedData | null;
  extracted_text: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExtractedData {
  vendor: string;
  date: string; // YYYY-MM-DD
  amount: number;
  currency: string;
  invoice_id?: string;
  payment_method?: string;
  notes?: string;
  line_items?: LineItem[];
}

export interface LineItem {
  description: string;
  quantity?: number;
  unit_price?: number;
  amount: number;
}

export interface Expense {
  id: string;
  user_id: string;
  date: string;
  month: string;
  vendor: string;
  amount: number;
  currency: string;
  category_id: string | null;
  payment_method: string | null;
  source_document_id: string | null;
  invoice_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  category?: Category;
}

export interface MerchantRule {
  id: string;
  user_id: string;
  vendor_pattern: string;
  category_id: string;
}

export interface ReportData {
  month: string;
  total: number;
  count: number;
  by_category: CategoryBreakdown[];
  by_payment_method: PaymentMethodBreakdown[];
  top_vendors: VendorBreakdown[];
}

export interface CategoryBreakdown {
  category_id: string;
  category_name: string;
  color: string;
  total: number;
  count: number;
}

export interface PaymentMethodBreakdown {
  payment_method: string;
  total: number;
  count: number;
}

export interface VendorBreakdown {
  vendor: string;
  total: number;
  count: number;
}
