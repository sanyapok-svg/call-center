import { Badge } from "@/components/ui/badge";
import type { LeadStatus } from "@/lib/validation";

const LABELS: Record<LeadStatus, string> = {
  draft: "Черновик",
  submitted: "Отправлена",
  failed: "Ошибка отправки",
};

export function StatusBadge({ status }: { status: LeadStatus }) {
  return <Badge variant={status}>{LABELS[status]}</Badge>;
}
