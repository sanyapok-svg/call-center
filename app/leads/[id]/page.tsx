import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { LeadForm } from "@/components/LeadForm";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { leadAccessWhere } from "@/lib/leads";
import { formatDateTime } from "@/lib/utils";

type Params = { params: Promise<{ id: string }> };

export default async function ViewLeadPage({ params }: Params) {
  const user = await getSessionUser();
  if (!user) redirect("/");

  const { id } = await params;
  const lead = await prisma.lead.findFirst({
    where: { id, ...leadAccessWhere(user) },
  });

  if (!lead) notFound();

  if (lead.status !== "submitted") {
    redirect(`/leads/${lead.id}/edit`);
  }

  return (
    <div className="min-h-screen bg-[#F5F6F7]">
      <Header email={user.email} isAdmin={user.isAdmin} />
      <main className="mx-auto max-w-[1200px] px-6 py-8">
        <div className="mb-2 text-sm text-[#6B7280]">
          <Link href="/dashboard" className="hover:text-[#C8102E]">
            Рабочий стол
          </Link>
          <span className="mx-2">→</span>
          <span className="text-[#1F2328]">{lead.localNumber}</span>
        </div>
        <h1 className="mb-6 text-2xl font-semibold text-[#1F2328]">
          Заявка {lead.localNumber}
        </h1>
        <LeadForm
          mode="view"
          leadId={lead.id}
          showRemoteResolved={false}
          statusBanner={
            <div className="rounded-xl border border-[#BBF7D0] bg-[#ECFDF5] px-4 py-3 text-sm text-[#166534]">
              ✓ Отправлена в Bitrix24. ID лида: {lead.bitrixLeadId ?? "—"}.
              {lead.submittedAt ? ` ${formatDateTime(lead.submittedAt)}` : ""}
            </div>
          }
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
