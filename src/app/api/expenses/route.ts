import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const month = request.nextUrl.searchParams.get("month");

  let query = supabase
    .from("expenses")
    .select("*, category:categories(*)")
    .order("date", { ascending: false });

  if (month) {
    query = query.eq("month", month);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
