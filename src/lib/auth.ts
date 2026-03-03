import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function requireAuth(): Promise<
  { userId: string } | { error: NextResponse }
> {
  const supabase = createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      error: NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      ),
    };
  }

  return { userId: user.id };
}
