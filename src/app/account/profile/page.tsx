import { requireAuth } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/account/profile-form";

export const metadata = { title: "Προφίλ — MotoMarket" };

export default async function ProfilePage() {
  const user = await requireAuth();

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("user_profiles")
    .select(
      "first_name, last_name, phone, rider_type, experience_level, height_cm, weight_kg",
    )
    .eq("id", user.id)
    .single();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Προφίλ</h1>
        <p className="mt-1 text-muted-foreground">
          Διαχειριστείτε τα προσωπικά σας στοιχεία και τις προτιμήσεις αναβάτη.
        </p>
      </div>

      <ProfileForm
        userId={user.id}
        email={user.email ?? ""}
        initialData={(profile as Record<string, unknown>) ?? {}}
      />
    </div>
  );
}
