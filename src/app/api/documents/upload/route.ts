import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireAuth } from "@/lib/auth";

export async function POST(request: Request) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;
  const { userId } = auth;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const sourceType = (formData.get("source_type") as string) || "other";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const storagePath = `${userId}/${Date.now()}_${file.name}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: `Upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("documents").getPublicUrl(storagePath);

    // Insert document record
    const { data: doc, error: dbError } = await supabase
      .from("documents")
      .insert({
        user_id: userId,
        filename: file.name,
        file_url: publicUrl,
        source_type: sourceType,
        status: "uploaded",
      })
      .select()
      .single();

    if (dbError) {
      return NextResponse.json(
        { error: `DB insert failed: ${dbError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(doc, { status: 201 });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
