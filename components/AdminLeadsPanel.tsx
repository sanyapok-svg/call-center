"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, FileText, Search } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn, formatDateTime } from "@/lib/utils";
import type { LeadStatus } from "@/lib/validation";

export type AdminLeadRow = {
  id: string;
  localNumber: string;
  clientName: string;
  phone: string;
  equipmentText: string;
  createdAt: string;
  submittedAt: string | null;
  status: LeadStatus;
  bitrixLeadId: string | null;
  operatorEmail: string;
  operatorId: string;
};

export type AdminOperatorOption = {
  id: string;
  email: string;
};

type SortKey =
  | "createdAt"
  | "localNumber"
  | "clientName"
  | "status"
  | "operator"
  | "submittedAt";

type Props = {
  leads: AdminLeadRow[];
  operators: AdminOperatorOption[];
  stats: { draft: number; submitted: number; failed: number; total: number };
  initialStatus: string;
  initialOperatorId: string;
  initialQuery: string;
  initialSort: SortKey;
  initialDir: "asc" | "desc";
};

const STATUS_FILTERS: Array<{ key: string; label: string }> = [
  { key: "all", label: "Все" },
  { key: "draft", label: "Черновик" },
  { key: "submitted", label: "Отправлена" },
  { key: "failed", label: "Ошибка" },
];

const SORT_OPTIONS: Array<{ key: SortKey; label: string }> = [
  { key: "createdAt", label: "Дата создания" },
  { key: "submittedAt", label: "Дата отправки" },
  { key: "localNumber", label: "Номер" },
  { key: "clientName", label: "Клиент" },
  { key: "status", label: "Статус" },
  { key: "operator", label: "Оператор" },
];

export function AdminLeadsPanel({
  leads,
  operators,
  stats,
  initialStatus,
  initialOperatorId,
  initialQuery,
  initialSort,
  initialDir,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState(initialQuery);
  const [status, setStatus] = useState(initialStatus);
  const [operatorId, setOperatorId] = useState(initialOperatorId);
  const [sort, setSort] = useState<SortKey>(initialSort);
  const [dir, setDir] = useState<"asc" | "desc">(initialDir);

  function pushParams(next: {
    status?: string;
    operatorId?: string;
    q?: string;
    sort?: SortKey;
    dir?: "asc" | "desc";
  }) {
    const params = new URLSearchParams();
    const s = next.status ?? status;
    const op = next.operatorId ?? operatorId;
    const q = (next.q ?? query).trim();
    const sortKey = next.sort ?? sort;
    const sortDir = next.dir ?? dir;

    if (s && s !== "all") params.set("status", s);
    if (op && op !== "all") params.set("operatorId", op);
    if (q) params.set("q", q);
    if (sortKey !== "createdAt") params.set("sort", sortKey);
    if (sortDir !== "desc") params.set("dir", sortDir);

    const qs = params.toString();
    startTransition(() => {
      router.push(qs ? `/admin/leads?${qs}` : "/admin/leads");
    });
  }

  function toggleSort(key: SortKey) {
    const nextDir = sort === key && dir === "desc" ? "asc" : "desc";
    setSort(key);
    setDir(nextDir);
    pushParams({ sort: key, dir: nextDir });
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = [...leads];

    if (status !== "all") {
      rows = rows.filter((lead) => lead.status === status);
    }
    if (operatorId !== "all") {
      rows = rows.filter((lead) => lead.operatorId === operatorId);
    }
    if (q) {
      rows = rows.filter((lead) => {
        const haystack = [
          lead.localNumber,
          lead.clientName,
          lead.phone,
          lead.equipmentText,
          lead.operatorEmail,
          lead.bitrixLeadId ?? "",
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(q);
      });
    }

    const factor = dir === "asc" ? 1 : -1;
    rows.sort((a, b) => {
      const av = sortValue(a, sort);
      const bv = sortValue(b, sort);
      if (av < bv) return -1 * factor;
      if (av > bv) return 1 * factor;
      return a.localNumber.localeCompare(b.localNumber) * factor;
    });

    return rows;
  }, [leads, query, status, operatorId, sort, dir]);

  function openLead(lead: AdminLeadRow) {
    if (lead.status === "submitted") {
      router.push(`/leads/${lead.id}`);
      return;
    }
    router.push(`/leads/${lead.id}/edit`);
  }

  return (
    <div className={cn("space-y-6", pending && "opacity-80")}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Всего" value={stats.total} />
        <StatCard label="Черновики" value={stats.draft} />
        <StatCard label="Отправлено" value={stats.submitted} />
        <StatCard label="Ошибки" value={stats.failed} />
      </div>

      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
              <Input
                className="pl-9"
                placeholder="Поиск: номер, клиент, телефон, оператор, Bitrix ID…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") pushParams({ q: query });
                }}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-3 lg:w-[520px]">
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium text-[#1F2328]">Оператор</span>
                <select
                  className="flex h-11 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 text-sm text-[#1F2328] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8102E]"
                  value={operatorId}
                  onChange={(e) => {
                    setOperatorId(e.target.value);
                    pushParams({ operatorId: e.target.value });
                  }}
                >
                  <option value="all">Все операторы</option>
                  {operators.map((op) => (
                    <option key={op.id} value={op.id}>
                      {op.email}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium text-[#1F2328]">Сортировка</span>
                <select
                  className="flex h-11 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 text-sm text-[#1F2328] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8102E]"
                  value={sort}
                  onChange={(e) => {
                    const next = e.target.value as SortKey;
                    setSort(next);
                    pushParams({ sort: next });
                  }}
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.key} value={opt.key}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium text-[#1F2328]">Порядок</span>
                <select
                  className="flex h-11 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 text-sm text-[#1F2328] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8102E]"
                  value={dir}
                  onChange={(e) => {
                    const next = e.target.value as "asc" | "desc";
                    setDir(next);
                    pushParams({ dir: next });
                  }}
                >
                  <option value="desc">По убыванию</option>
                  <option value="asc">По возрастанию</option>
                </select>
              </label>
            </div>
            <Button
              type="button"
              variant="secondary"
              className="w-full lg:w-auto"
              onClick={() => pushParams({ q: query })}
            >
              Применить
            </Button>
          </div>

          <div className="-mx-1 flex gap-1 overflow-x-auto border-b border-[#E5E7EB] px-1 sm:mx-0 sm:flex-wrap sm:gap-2 sm:px-0">
            {STATUS_FILTERS.map((filter) => {
              const active = status === filter.key;
              return (
                <button
                  key={filter.key}
                  type="button"
                  className={cn(
                    "shrink-0 px-3 py-2 text-sm font-medium whitespace-nowrap text-[#6B7280]",
                    active && "border-b-2 border-[#C8102E] text-[#C8102E]",
                  )}
                  onClick={() => {
                    setStatus(filter.key);
                    pushParams({ status: filter.key });
                  }}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <FileText className="mb-4 h-12 w-12 text-[#9CA3AF]" />
              <p className="text-[#6B7280]">Заявки не найдены</p>
            </div>
          ) : (
            <>
              <div className="space-y-3 p-4 lg:hidden">
                {filtered.map((lead) => (
                  <button
                    key={lead.id}
                    type="button"
                    onClick={() => openLead(lead)}
                    className="w-full rounded-xl border border-[#E5E7EB] bg-white p-4 text-left transition hover:border-[#C8102E]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8102E]"
                  >
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-[#1F2328]">
                          {lead.localNumber}
                        </p>
                        <p className="mt-0.5 text-sm text-[#1F2328]">
                          {lead.clientName}
                        </p>
                      </div>
                      <StatusBadge status={lead.status} />
                    </div>
                    <p className="truncate text-sm text-[#6B7280]">
                      {lead.equipmentText}
                    </p>
                    <p className="mt-1 truncate text-xs text-[#6B7280]">
                      {lead.operatorEmail}
                      {lead.bitrixLeadId ? ` · Bitrix ${lead.bitrixLeadId}` : ""}
                    </p>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <span className="text-xs text-[#6B7280]">
                        {formatDateTime(lead.createdAt)}
                      </span>
                      <span className="text-sm font-medium text-[#C8102E]">
                        {lead.status === "submitted" ? "Открыть" : "Редактировать"}
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[980px] text-left text-sm">
                  <thead className="border-b border-[#E5E7EB] bg-[#F9FAFB] text-[#6B7280]">
                    <tr>
                      <SortTh
                        label="Номер"
                        active={sort === "localNumber"}
                        dir={dir}
                        onClick={() => toggleSort("localNumber")}
                      />
                      <SortTh
                        label="Клиент"
                        active={sort === "clientName"}
                        dir={dir}
                        onClick={() => toggleSort("clientName")}
                      />
                      <th className="px-4 py-3 font-medium">Оборудование</th>
                      <SortTh
                        label="Оператор"
                        active={sort === "operator"}
                        dir={dir}
                        onClick={() => toggleSort("operator")}
                      />
                      <SortTh
                        label="Создана"
                        active={sort === "createdAt"}
                        dir={dir}
                        onClick={() => toggleSort("createdAt")}
                      />
                      <SortTh
                        label="Статус"
                        active={sort === "status"}
                        dir={dir}
                        onClick={() => toggleSort("status")}
                      />
                      <th className="px-4 py-3 font-medium">Bitrix ID</th>
                      <th className="px-4 py-3 font-medium">Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((lead) => (
                      <tr
                        key={lead.id}
                        className="cursor-pointer border-b border-[#E5E7EB] last:border-0 hover:bg-[#F9FAFB]"
                        onClick={() => openLead(lead)}
                      >
                        <td className="px-4 py-3 font-medium text-[#1F2328]">
                          {lead.localNumber}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-[#1F2328]">{lead.clientName}</div>
                          <div className="text-xs text-[#6B7280]">{lead.phone}</div>
                        </td>
                        <td className="max-w-[200px] truncate px-4 py-3 text-[#6B7280]">
                          {lead.equipmentText}
                        </td>
                        <td className="px-4 py-3 text-[#6B7280]">
                          {lead.operatorEmail}
                        </td>
                        <td className="px-4 py-3 text-[#6B7280]">
                          {formatDateTime(lead.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={lead.status} />
                        </td>
                        <td className="px-4 py-3 text-[#6B7280]">
                          {lead.bitrixLeadId ?? "—"}
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={
                              lead.status === "submitted"
                                ? `/leads/${lead.id}`
                                : `/leads/${lead.id}/edit`
                            }
                            className="text-sm font-medium text-[#C8102E] hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {lead.status === "submitted"
                              ? "Открыть"
                              : "Редактировать"}
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <p className="text-sm text-[#6B7280]">
        Показано: {filtered.length} из {leads.length}
      </p>
    </div>
  );
}

function sortValue(lead: AdminLeadRow, key: SortKey): string | number {
  switch (key) {
    case "createdAt":
      return new Date(lead.createdAt).getTime();
    case "submittedAt":
      return lead.submittedAt ? new Date(lead.submittedAt).getTime() : 0;
    case "localNumber":
      return lead.localNumber;
    case "clientName":
      return lead.clientName.toLowerCase();
    case "status":
      return lead.status;
    case "operator":
      return lead.operatorEmail.toLowerCase();
  }
}

function SortTh({
  label,
  active,
  dir,
  onClick,
}: {
  label: string;
  active: boolean;
  dir: "asc" | "desc";
  onClick: () => void;
}) {
  const Icon = !active ? ArrowUpDown : dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <th className="px-4 py-3 font-medium">
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "inline-flex items-center gap-1 hover:text-[#1F2328]",
          active && "text-[#C8102E]",
        )}
      >
        {label}
        <Icon className="h-3.5 w-3.5" />
      </button>
    </th>
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
