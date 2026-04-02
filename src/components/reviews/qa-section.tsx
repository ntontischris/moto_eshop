import { getQuestionsForProduct } from "@/lib/queries/reviews";
import { QuestionForm } from "./question-form";
import { Badge } from "@/components/ui/badge";

interface QaSectionProps {
  productId: string;
  isLoggedIn: boolean;
}

export async function QaSection({ productId, isLoggedIn }: QaSectionProps) {
  const questions = await getQuestionsForProduct(productId);

  return (
    <section className="space-y-6" id="qa">
      <h2 className="text-2xl font-bold">Ερωτήσεις & Απαντήσεις</h2>
      {questions.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Δεν υπάρχουν ερωτήσεις ακόμα.
        </p>
      )}
      <div className="space-y-4">
        {questions.map((q) => (
          <div key={q.id} className="space-y-3 rounded-lg border p-4">
            <p className="font-medium">{q.body}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(q.created_at).toLocaleDateString("el-GR")}
            </p>
            {(
              q.answers as {
                id: string;
                body: string;
                is_official: boolean;
                created_at: string;
              }[]
            ).map((ans) => (
              <div
                key={ans.id}
                className={`ml-4 border-l-2 pl-3 ${ans.is_official ? "border-primary" : "border-muted"}`}
              >
                {ans.is_official && (
                  <Badge variant="default" className="mb-1">
                    Επίσημη Απάντηση
                  </Badge>
                )}
                <p className="text-sm">{ans.body}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(ans.created_at).toLocaleDateString("el-GR")}
                </p>
              </div>
            ))}
          </div>
        ))}
      </div>
      {isLoggedIn ? (
        <div className="border-t pt-4">
          <h3 className="mb-2 font-semibold">Κάνε μια ερώτηση</h3>
          <QuestionForm productId={productId} />
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          <a href="/login" className="underline">
            Συνδέσου
          </a>{" "}
          για να κάνεις ερώτηση.
        </p>
      )}
    </section>
  );
}
