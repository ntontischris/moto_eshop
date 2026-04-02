"use client";

import { useState, useTransition } from "react";
import { z } from "zod/v4";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { RiderTypeSelector } from "@/components/account/rider-type-selector";
import { AuthErrorMessage } from "@/components/auth/auth-error-message";
import { createClient } from "@/lib/supabase/client";

const profileSchema = z.object({
  first_name: z.string().min(1, "Απαιτείται όνομα").max(50),
  last_name: z.string().min(1, "Απαιτείται επώνυμο").max(50),
  phone: z
    .string()
    .regex(/^\+?[0-9\s\-()]{7,20}$/, "Μη έγκυρος αριθμός τηλεφώνου")
    .optional()
    .or(z.literal("")),
  rider_type: z
    .enum(["beginner", "intermediate", "advanced", "professional"])
    .nullable(),
  experience_level: z.enum(["beginner", "intermediate", "expert"]).nullable(),
  height_cm: z.coerce.number().int().min(100).max(250).nullable().optional(),
  weight_kg: z.coerce.number().int().min(30).max(300).nullable().optional(),
});

type ProfileData = z.infer<typeof profileSchema>;

interface ProfileFormProps {
  userId: string;
  email: string;
  initialData: Partial<ProfileData>;
}

const EXPERIENCE_LEVELS = [
  { value: "beginner", label: "Αρχάριος" },
  { value: "intermediate", label: "Ενδιάμεσος" },
  { value: "expert", label: "Έμπειρος" },
] as const;

export function ProfileForm({ userId, email, initialData }: ProfileFormProps) {
  const [formData, setFormData] = useState<Partial<ProfileData>>(initialData);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const updateField = <K extends keyof ProfileData>(
    field: K,
    value: ProfileData[K],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsSuccess(false);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSuccess(false);

    const parsed = profileSchema.safeParse(formData);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Σφάλμα επικύρωσης");
      return;
    }

    startTransition(async () => {
      const supabase = createClient();
      const { error: dbError } = await supabase
        .from("user_profiles")
        .update(parsed.data)
        .eq("id", userId);

      if (dbError) {
        setError("Αποτυχία αποθήκευσης. Δοκιμάστε ξανά.");
        return;
      }

      setIsSuccess(true);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <AuthErrorMessage message={error} />

      {isSuccess && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          Το προφίλ σας αποθηκεύτηκε επιτυχώς.
        </div>
      )}

      <Card>
        <CardContent className="space-y-4 pt-6">
          <h2 className="text-base font-semibold">Προσωπικά στοιχεία</h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor="first_name" className="text-sm font-medium">
                Όνομα
              </label>
              <Input
                id="first_name"
                value={formData.first_name ?? ""}
                onChange={(e) => updateField("first_name", e.target.value)}
                placeholder="Γιώργης"
                disabled={isPending}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="last_name" className="text-sm font-medium">
                Επώνυμο
              </label>
              <Input
                id="last_name"
                value={formData.last_name ?? ""}
                onChange={(e) => updateField("last_name", e.target.value)}
                placeholder="Παπαδόπουλος"
                disabled={isPending}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-muted-foreground">
              Email
            </label>
            <Input value={email} disabled className="text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              Το email δεν μπορεί να αλλαχθεί από εδώ.
            </p>
          </div>

          <div className="space-y-1">
            <label htmlFor="phone" className="text-sm font-medium">
              Τηλέφωνο
            </label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone ?? ""}
              onChange={(e) => updateField("phone", e.target.value)}
              placeholder="+30 69x xxx xxxx"
              disabled={isPending}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-6 pt-6">
          <h2 className="text-base font-semibold">Προφίλ αναβάτη</h2>

          <div className="space-y-2">
            <label className="text-sm font-medium">Τύπος αναβάτη</label>
            <RiderTypeSelector
              value={
                (formData.rider_type as
                  | "beginner"
                  | "intermediate"
                  | "advanced"
                  | "professional") ?? null
              }
              onChange={(value) => updateField("rider_type", value)}
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Επίπεδο εμπειρίας</label>
            <div className="flex flex-wrap gap-3">
              {EXPERIENCE_LEVELS.map((level) => (
                <button
                  key={level.value}
                  type="button"
                  disabled={isPending}
                  onClick={() => updateField("experience_level", level.value)}
                  className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                    formData.experience_level === level.value
                      ? "border-foreground bg-foreground text-background"
                      : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
                  }`}
                >
                  {level.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="height_cm" className="text-sm font-medium">
                Ύψος (cm)
              </label>
              <Input
                id="height_cm"
                type="number"
                min={100}
                max={250}
                value={formData.height_cm ?? ""}
                onChange={(e) =>
                  updateField(
                    "height_cm",
                    e.target.value ? Number(e.target.value) : null,
                  )
                }
                placeholder="175"
                disabled={isPending}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="weight_kg" className="text-sm font-medium">
                Βάρος (kg)
              </label>
              <Input
                id="weight_kg"
                type="number"
                min={30}
                max={300}
                value={formData.weight_kg ?? ""}
                onChange={(e) =>
                  updateField(
                    "weight_kg",
                    e.target.value ? Number(e.target.value) : null,
                  )
                }
                placeholder="80"
                disabled={isPending}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending} className="min-w-32">
          {isPending ? "Αποθήκευση..." : "Αποθήκευση"}
        </Button>
      </div>
    </form>
  );
}
