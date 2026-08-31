import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import type { ComponentProps } from "react";

type EmptyStateCardProps = ComponentProps<typeof EmptyState> & {
  cardClassName?: string;
};

export function EmptyStateCard({ cardClassName, ...props }: EmptyStateCardProps) {
  return (
    <Card className={cardClassName}>
      <CardContent className="py-12">
        <EmptyState {...props} />
      </CardContent>
    </Card>
  );
}
