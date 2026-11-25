import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AdminLeadsPanel,
  type AdminLeadRow,
} from "@/components/AdminLeadsPanel";
import { Header } from "@/components/Header";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { LeadStatus } from "@/lib/validation";

type SearchParams = Promise<{
  status?: string;
  operatorId?: string;
  q?: string;
  sort?: string;
  dir?: string;
}>;

const SORT_KEYS = [
  "createdAt",
  "localNumber",
  "clientName",
  "status",
  "operator",
  "submittedAt",
] as const;

type SortKey = (typeof SORT_KEYS)[number];

export default async function AdminLeadsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/");
  if (!user.isAdmin) redirect("/dashboard");

  const params = await searchParams;
  const status =
    params.status === "draft" ||
    params.status === "submitted" ||
    params.status === "failed"
      ? params.status
      : "all";
  const operatorId = params.operatorId?.trim() || "all";
  const query = params.q?.trim() || "";
  const sort: SortKey = SORT_KEYS.includes(params.sort as SortKey)
    ? (params.sort as SortKey)
    : "createdAt";
  const dir = params.dir === "asc" ? "asc" : "desc";

  const [leads, operators, draft, submitted, failed, total] = await Promise.all([
    prisma.lead.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        operator: {
          select: { id: true, email: true },
        },
      },
    }),
    prisma.user.findMany({
      where: { isAdmin: false },
      orderBy: { email: "asc" },
      select: { id: true, email: true },
    }),
    prisma.lead.count({ where: { status: "draft" } }),
    prisma.lead.count({ where: { status: "submitted" } }),
    prisma.lead.count({ where: { status: "failed" } }),
    prisma.lead.count(),
  ]);

  // Include admins who also created leads in the filter list
  const operatorMap = new Map(operators.map((op) => [op.id, op]));
  for (const lead of leads) {
    if (!operatorMap.has(lead.operatorId)) {
      operatorMap.set(lead.operatorId, {
        id: lead.operator.id,
        email: lead.operator.email,
      });
    }
  }

  const rows: AdminLeadRow[] = leads.map((lead) => ({
    id: lead.id,
    localNumber: lead.localNumber,
    clientName: lead.clientName,
    phone: lead.phone,
    equipmentText: lead.equipmentText,
    createdAt: lead.createdAt.toISOString(),
    submittedAt: lead.submittedAt?.toISOString() ?? null,
    status: lead.status as LeadStatus,
    bitrixLeadId: lead.bitrixLeadId,
    operatorEmail: lead.operator.email,
    operatorId: lead.operatorId,
  }));

  return (
    <div className="min-h-screen bg-[#F5F6F7]">
      <Header email={user.email} isAdmin={user.isAdmin} />
      <main className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-2 text-sm text-[#6B7280]">
          <Link href="/dashboard" className="hover:text-[#C8102E]">
            Рабочий стол
          </Link>
          <span className="mx-2">/</span>
          <span className="text-[#1F2328]">Все заявки</span>
        </div>
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold sm:text-2xl text-[#1F2328]">Все заявки</h1>
            <p className="mt-1 text-sm text-[#6B7280]">
              Заявки всех операторов: фильтры, поиск и сортировка
            </p>
          </div>
          <Link
            href="/admin/operators"
            className="text-sm font-medium text-[#C8102E] hover:underline"
          >
            Управление операторами
          </Link>
        </div>

        <AdminLeadsPanel
          key={`${status}|${operatorId}|${query}|${sort}|${dir}`}
          leads={rows}
          operators={[...operatorMap.values()].sort((a, b) =>
            a.email.localeCompare(b.email),
          )}
          stats={{ draft, submitted, failed, total }}
          initialStatus={status}
          initialOperatorId={operatorId}
          initialQuery={query}
          initialSort={sort}
          initialDir={dir}
        />
      </main>
    </div>
  );
}
