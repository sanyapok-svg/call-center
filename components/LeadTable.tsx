"use client";

import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDateTime } from "@/lib/utils";
import type { LeadStatus } from "@/lib/validation";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export type LeadRow = {
  id: string;
  localNumber: string;
  clientName: string;
  equipmentText: string;
  createdAt: string;
  status: LeadStatus;
};

export function LeadTable({ leads }: { leads: LeadRow[] }) {
  const router = useRouter();

  if (leads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
        <FileText className="mb-4 h-12 w-12 text-[#9CA3AF]" />
        <p className="mb-4 text-[#6B7280]">Пока нет заявок. Создайте первую</p>
        <Link href="/leads/new">
          <Button type="button">+ Создать заявку</Button>
        </Link>
      </div>
    );
  }

  function openLead(lead: LeadRow) {
    if (lead.status === "submitted") {
      router.push(`/leads/${lead.id}`);
      return;
    }
    router.push(`/leads/${lead.id}/edit`);
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="border-b border-[#E5E7EB] bg-[#F9FAFB] text-[#6B7280]">
          <tr>
            <th className="px-4 py-3 font-medium">Номер</th>
            <th className="px-4 py-3 font-medium">Клиент</th>
            <th className="px-4 py-3 font-medium">Оборудование</th>
            <th className="px-4 py-3 font-medium">Создана</th>
            <th className="px-4 py-3 font-medium">Статус</th>
            <th className="px-4 py-3 font-medium">Действия</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr
              key={lead.id}
              className="cursor-pointer border-b border-[#E5E7EB] last:border-0 hover:bg-[#F9FAFB]"
              onClick={() => openLead(lead)}
            >
              <td className="px-4 py-3 font-medium text-[#1F2328]">
                {lead.localNumber}
              </td>
              <td className="px-4 py-3 text-[#1F2328]">{lead.clientName}</td>
              <td className="max-w-[220px] truncate px-4 py-3 text-[#6B7280]">
                {lead.equipmentText}
              </td>
              <td className="px-4 py-3 text-[#6B7280]">
                {formatDateTime(lead.createdAt)}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={lead.status} />
              </td>
              <td className="px-4 py-3">
                <button
                  type="button"
                  className="text-sm font-medium text-[#C8102E] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8102E]"
                  onClick={(e) => {
                    e.stopPropagation();
                    openLead(lead);
                  }}
                >
                  {lead.status === "submitted" ? "Открыть" : "Редактировать"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
