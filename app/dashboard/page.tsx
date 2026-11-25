import Link from "next/link";
import { redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { LeadTable, type LeadRow } from "@/components/LeadTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { leadAccessWhere } from "@/lib/leads";
import { cn } from "@/lib/utils";
import type { LeadStatus } from "@/lib/validation";

type SearchParams = Promise<{ status?: string }>;

const FILTERS: Array<{ key: string; label: string }> = [
  { key: "all", label: "Все" },
  { key: "draft", label: "Черновик" },
  { key: "submitted", label: "Отправлена" },
  { key: "failed", label: "Ошибка" },
];

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/");

  const params = await searchParams;
  const status =
    params.status === "draft" ||
    params.status === "submitted" ||
    params.status === "failed"
      ? params.status
      : "all";

  const access = leadAccessWhere(user);

  const [leads, draft, submitted, failed] = await Promise.all([
    prisma.lead.findMany({
      where: {
        ...access,
        ...(status !== "all" ? { status } : {}),
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        localNumber: true,
        clientName: true,
        equipmentText: true,
        createdAt: true,
        status: true,
      },
    }),
    prisma.lead.count({ where: { ...access, status: "draft" } }),
    prisma.lead.count({ where: { ...access, status: "submitted" } }),
    prisma.lead.count({ where: { ...access, status: "failed" } }),
  ]);

  const rows: LeadRow[] = leads.map((lead) => ({
    id: lead.id,
    localNumber: lead.localNumber,
    clientName: lead.clientName,
    equipmentText: lead.equipmentText,
    createdAt: lead.createdAt.toISOString(),
    status: lead.status as LeadStatus,
  }));

  return (
    <div className="min-h-screen bg-[#F5F6F7]">
      <Header email={user.email} isAdmin={user.isAdmin} />
      <main className="mx-auto max-w-[1200px] px-6 py-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-semibold text-[#1F2328]">Заявки</h1>
          <Link href="/leads/new" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto">+ Создать заявку</Button>
          </Link>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <StatCard label="Черновики" value={draft} />
          <StatCard label="Отправлено" value={submitted} />
          <StatCard label="Ошибки" value={failed} />
        </div>

        <div className="mb-4 flex flex-wrap gap-2 border-b border-[#E5E7EB]">
          {FILTERS.map((filter) => {
            const active = status === filter.key;
            const href =
              filter.key === "all"
                ? "/dashboard"
                : `/dashboard?status=${filter.key}`;
            return (
              <Link
                key={filter.key}
                href={href}
                className={cn(
                  "px-3 py-2 text-sm font-medium text-[#6B7280]",
                  active && "border-b-2 border-[#C8102E] text-[#C8102E]",
                )}
              >
                {filter.label}
              </Link>
            );
          })}
        </div>

        <Card>
          <CardContent className="p-0">
            <LeadTable leads={rows} />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-sm text-[#6B7280]">{label}</p>
        <p className="mt-1 text-[32px] leading-none font-bold text-[#1F2328]">
          {value}
        </p>
      </CardContent>
    </Card>
  );
}
