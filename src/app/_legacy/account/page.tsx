import { requireAuth } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { ProfileCompletionPrompt } from "@/components/account/profile-completion-prompt";
import { ShoppingBag, Star, User } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}

function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 pt-6">
        <div className="rounded-full bg-accent p-2">{icon}</div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default async function AccountPage() {
  const user = await requireAuth();
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("first_name, last_name, rider_type, experience_level")
    .eq("id", user.id)
    .single();

  const { count: ordersCount } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  // Sum loyalty points (positive = earned, negative = spent)
  const { data: pointsData } = await supabase
    .from("loyalty_points")
    .select("points")
    .eq("user_id", user.id);

  const totalPoints = (pointsData ?? []).reduce(
    (sum, row) => sum + row.points,
    0,
  );

  const displayName = profile?.first_name
    ? `${profile.first_name}${profile.last_name ? ` ${profile.last_name}` : ""}`
    : user.email;

  const isProfileIncomplete = !profile?.first_name || !profile?.rider_type;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Γεια σου, {displayName}!</h1>
        <p className="mt-1 text-muted-foreground">{user.email}</p>
      </div>

      {isProfileIncomplete && <ProfileCompletionPrompt />}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Παραγγελίες"
          value={ordersCount ?? 0}
          icon={<ShoppingBag className="h-5 w-5 text-muted-foreground" />}
        />
        <StatCard
          label="Πόντοι"
          value={totalPoints}
          icon={<Star className="h-5 w-5 text-muted-foreground" />}
        />
        <StatCard
          label="Τύπος αναβάτη"
          value={profile?.rider_type ?? "—"}
          icon={<User className="h-5 w-5 text-muted-foreground" />}
        />
      </div>
    </div>
  );
}
