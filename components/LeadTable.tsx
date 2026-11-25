"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils";
import type { LeadStatus } from "@/lib/validation";

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
        <Link href="/leads/new" className="w-full max-w-xs sm:w-auto">
          <Button type="button" className="w-full sm:w-auto">
            + Создать заявку
          </Button>
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

  function actionLabel(status: LeadStatus) {
    return status === "submitted" ? "Открыть" : "Редактировать";
  }

  return (
    <>
      {/* Mobile cards */}
      <div className="space-y-3 p-4 md:hidden">
        {leads.map((lead) => (
          <button
            key={lead.id}
            type="button"
            onClick={() => openLead(lead)}
            className="w-full rounded-xl border border-[#E5E7EB] bg-white p-4 text-left transition hover:border-[#C8102E]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8102E]"
          >
            <div className="mb-2 flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-[#1F2328]">{lead.localNumber}</p>
                <p className="mt-0.5 text-sm text-[#1F2328]">{lead.clientName}</p>
              </div>
              <StatusBadge status={lead.status} />
            </div>
            <p className="truncate text-sm text-[#6B7280]">{lead.equipmentText}</p>
            <div className="mt-3 flex items-center justify-between gap-2">
              <span className="text-xs text-[#6B7280]">
                {formatDateTime(lead.createdAt)}
              </span>
              <span className="text-sm font-medium text-[#C8102E]">
                {actionLabel(lead.status)}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Desktop / tablet table */}
      <div className="hidden overflow-x-auto md:block">
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
                    {actionLabel(lead.status)}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
