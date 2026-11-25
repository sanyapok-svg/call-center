import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { LeadForm } from "@/components/LeadForm";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { leadAccessWhere } from "@/lib/leads";
import { formatDateTime } from "@/lib/utils";

type Params = { params: Promise<{ id: string }> };

export default async function EditLeadPage({ params }: Params) {
  const user = await getSessionUser();
  if (!user) redirect("/");

  const { id } = await params;
  const lead = await prisma.lead.findFirst({
    where: { id, ...leadAccessWhere(user) },
  });

  if (!lead) notFound();

  if (lead.status === "submitted") {
    redirect(`/leads/${lead.id}`);
  }

  const errorSuffix = lead.lastError ? `: ${lead.lastError}` : ".";

  const failedBanner =
    lead.status === "failed" ? (
      <div className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#991B1B]">
        <p>
          Ошибка отправки{errorSuffix} Можно исправить данные и повторить
          отправку.
        </p>
        {lead.updatedAt ? (
          <span className="mt-1 block text-[#B91C1C]">
            {formatDateTime(lead.updatedAt)}
          </span>
        ) : null}
      </div>
    ) : null;

  return (
    <div className="min-h-screen bg-[#F5F6F7]">
      <Header email={user.email} isAdmin={user.isAdmin} />
      <main className="mx-auto max-w-[1200px] px-6 py-8">
        <div className="mb-2 text-sm text-[#6B7280]">
          <Link href="/dashboard" className="hover:text-[#C8102E]">
            Рабочий стол
          </Link>
          <span className="mx-2">/</span>
          <span className="text-[#1F2328]">{lead.localNumber}</span>
        </div>
        <h1 className="mb-6 text-2xl font-semibold text-[#1F2328]">
          Редактирование {lead.localNumber}
        </h1>
        <LeadForm
          mode="edit"
          leadId={lead.id}
          allowRetry={lead.status === "failed"}
          allowDelete={lead.status === "draft"}
          statusBanner={failedBanner}
          showRemoteResolved={false}
          initialValues={{
            clientName: lead.clientName,
            phone: lead.phone,
            email: lead.email ?? "",
            equipmentText: lead.equipmentText,
            serialNumber: lead.serialNumber ?? "",
            address: lead.address,
            description: lead.description,
            diagnostics: lead.diagnostics ?? "",
          }}
        />
      </main>
    </div>
  );
}
