import { Card, CardContent } from "@/components/ui/card";
import { Lightbulb } from "lucide-react";

interface Props {
  title: string;
  body: string;
}

export function InsightBanner({ title, body }: Props) {
  return (
    <Card className="bg-brand-subtle border-brand-dim">
      <CardContent className="pt-5 flex items-start gap-3">
        <Lightbulb className="w-5 h-5 text-brand-dark flex-shrink-0 mt-0.5" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-brand-darker">{title}</p>
          <p className="text-sm text-brand-body mt-0.5 leading-relaxed">{body}</p>
        </div>
      </CardContent>
    </Card>
  );
}
