"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type UploadResult =
  | { success: true; url: string }
  | { success: false; error: string };

const BUCKET = "campaign-images";
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

async function assertAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  const role = (profile?.role as string) ?? "user";
  if (role !== "admin" && role !== "super_admin") throw new Error("Forbidden");
}

export async function uploadCampaignImage(
  formData: FormData,
): Promise<UploadResult> {
  await assertAdmin();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { success: false, error: "Λείπει το αρχείο" };
  }
  if (!file.type.startsWith("image/")) {
    return { success: false, error: "Μόνο εικόνες (jpg/png/webp/gif)" };
  }
  if (file.size > MAX_SIZE) {
    return { success: false, error: "Μέγιστο μέγεθος 5MB" };
  }

  const ext =
    file.name
      .split(".")
      .pop()
      ?.toLowerCase()
      .replace(/[^a-z0-9]/g, "") ||
    (file.type.split("/")[1] ?? "jpg");
  const path = `${crypto.randomUUID()}.${ext}`;

  const supabase = createAdminClient();
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) return { success: false, error: error.message };

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { success: true, url: data.publicUrl };
}
