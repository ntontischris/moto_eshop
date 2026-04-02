import Link from "next/link";
import { ArrowRight, UserCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function ProfileCompletionPrompt() {
  return (
    <Card className="border-2 border-dashed border-muted-foreground/30 bg-muted/30">
      <CardContent className="flex flex-col items-start gap-4 pt-6 sm:flex-row sm:items-center">
        <div className="shrink-0 rounded-full bg-accent p-3">
          <UserCircle className="h-6 w-6 text-muted-foreground" />
        </div>

        <div className="flex-1 space-y-1">
          <p className="text-sm font-semibold">
            Ολοκληρώστε το προφίλ αναβάτη σας
          </p>
          <p className="text-xs text-muted-foreground">
            Προσθέστε τον τύπο αναβάτη, την εμπειρία και τα φυσικά στοιχεία σας
            για εξατομικευμένες προτάσεις εξοπλισμού.
          </p>
        </div>

        <Button
          render={<Link href="/account/profile" />}
          size="sm"
          variant="outline"
          className="shrink-0"
        >
          Συμπλήρωση
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
