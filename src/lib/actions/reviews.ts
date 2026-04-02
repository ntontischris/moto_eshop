"use server";

import { z } from "zod/v4";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

type ActionResult = { success: true } | { success: false; error: string };

const CreateReviewSchema = z.object({
  productId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  title: z.string().min(3).max(120),
  body: z.string().min(10).max(2000),
  bikeMake: z.string().max(60).optional(),
  bikeModel: z.string().max(60).optional(),
  riderHeight: z.number().int().min(100).max(250).optional(),
  riderWeight: z.number().int().min(30).max(300).optional(),
  ridingExperience: z.enum(["beginner", "intermediate", "expert"]).optional(),
});

export async function createReview(
  input: z.infer<typeof CreateReviewSchema>,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Απαιτείται σύνδεση" };

  const parsed = CreateReviewSchema.safeParse(input);
  if (!parsed.success)
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Σφάλμα",
    };

  // Check verified purchase (order_items -> orders -> user_id)
  const { data: purchase } = await supabase
    .from("orders")
    .select("id, order_items!inner(product_id)")
    .eq("user_id", user.id)
    .eq("order_items.product_id", parsed.data.productId)
    .limit(1)
    .maybeSingle();

  const isVerified = !!purchase;

  const { error } = await supabase.from("reviews").insert({
    product_id: parsed.data.productId,
    user_id: user.id,
    rating: parsed.data.rating,
    title: parsed.data.title,
    body: parsed.data.body,
    bike_make: parsed.data.bikeMake ?? null,
    bike_model: parsed.data.bikeModel ?? null,
    rider_height: parsed.data.riderHeight ?? null,
    rider_weight: parsed.data.riderWeight ?? null,
    riding_experience: parsed.data.ridingExperience ?? null,
    is_verified: isVerified,
    status: "pending",
  });

  if (error) return { success: false, error: "Αποτυχία υποβολής κριτικής" };
  return { success: true };
}

const VoteReviewSchema = z.object({
  reviewId: z.string().uuid(),
  isHelpful: z.boolean(),
});

export async function voteReview(
  input: z.infer<typeof VoteReviewSchema>,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Απαιτείται σύνδεση" };

  const parsed = VoteReviewSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid input" };

  const { error } = await supabase.from("review_votes").upsert(
    {
      review_id: parsed.data.reviewId,
      user_id: user.id,
      is_helpful: parsed.data.isHelpful,
    },
    { onConflict: "review_id,user_id" },
  );

  if (error) return { success: false, error: "Αποτυχία ψηφοφορίας" };
  return { success: true };
}

const CreateQuestionSchema = z.object({
  productId: z.string().uuid(),
  body: z.string().min(10).max(500),
});

export async function createQuestion(
  input: z.infer<typeof CreateQuestionSchema>,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Απαιτείται σύνδεση" };

  const parsed = CreateQuestionSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid input" };

  const { error } = await supabase.from("questions").insert({
    product_id: parsed.data.productId,
    user_id: user.id,
    body: parsed.data.body,
  });

  if (error) return { success: false, error: "Αποτυχία υποβολής ερώτησης" };
  return { success: true };
}

const CreateAnswerSchema = z.object({
  questionId: z.string().uuid(),
  body: z.string().min(5).max(1000),
});

export async function createAnswer(
  input: z.infer<typeof CreateAnswerSchema>,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Απαιτείται σύνδεση" };

  const parsed = CreateAnswerSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid input" };

  const { error } = await supabase.from("answers").insert({
    question_id: parsed.data.questionId,
    user_id: user.id,
    body: parsed.data.body,
    is_official: false,
  });

  if (error) return { success: false, error: "Αποτυχία υποβολής απάντησης" };
  return { success: true };
}
