"use client";

import { Star } from "lucide-react";
import { ScrollReveal } from "@/components/effects/scroll-reveal";
import { Container } from "@/components/layout/container";
import { H2, SectionLabel } from "@/components/ui/typography";

interface ReviewItem {
  id: string;
  name: string;
  rating: number;
  text: string;
  product: string;
}

interface ReviewsCarouselProps {
  reviews: ReviewItem[];
}

export const ReviewsCarousel = ({ reviews }: ReviewsCarouselProps) => (
  <section className="bg-bg-surface py-16 diagonal-top md:py-24">
    <Container>
      <ScrollReveal>
        <SectionLabel className="mb-3">Reviews</SectionLabel>
        <H2 className="mb-10 text-text-primary">ΟΙ ΠΕΛΑΤΕΣ ΜΑΣ ΛΕΝΕ</H2>
      </ScrollReveal>

      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none snap-x snap-mandatory">
        {reviews.map((review, i) => (
          <ScrollReveal key={review.id} delay={i * 0.1} className="snap-start">
            <div className="w-[300px] shrink-0 rounded-lg border border-border-default bg-bg-deep p-6">
              <div className="mb-3 flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${star <= review.rating ? "fill-gold text-gold" : "text-bg-elevated"}`}
                  />
                ))}
              </div>
              <p className="mb-4 text-sm leading-relaxed text-text-secondary line-clamp-4">
                &ldquo;{review.text}&rdquo;
              </p>
              <div className="border-t border-border-default pt-3">
                <p className="text-sm font-semibold text-text-primary">
                  {review.name}
                </p>
                <p className="text-xs text-text-muted">
                  Αγόρασε: {review.product}
                </p>
              </div>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </Container>
  </section>
);
