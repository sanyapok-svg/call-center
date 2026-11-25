import "server-only";

import { prisma } from "@/lib/db";
import type { SessionUser } from "@/lib/auth";
import type { LeadFormValues } from "@/lib/validation";

export async function nextLocalNumber(): Promise<string> {
  const counter = await prisma.$transaction(async (tx) => {
    const existing = await tx.leadCounter.findUnique({ where: { id: 1 } });
    if (!existing) {
      return tx.leadCounter.create({ data: { id: 1, value: 1 } });
    }
    return tx.leadCounter.update({
      where: { id: 1 },
      data: { value: { increment: 1 } },
    });
  });

  return `KC-${String(counter.value).padStart(4, "0")}`;
}

export function leadAccessWhere(user: SessionUser) {
  if (user.isAdmin) return {};
  return { operatorId: user.id };
}

export function normalizeLeadInput(data: LeadFormValues) {
  return {
    clientName: data.clientName.trim(),
    phone: data.phone.trim(),
    email: data.email?.trim() ? data.email.trim() : null,
    equipmentText: data.equipmentText.trim(),
    serialNumber: data.serialNumber?.trim() ? data.serialNumber.trim() : null,
    address: data.address.trim(),
    description: data.description.trim(),
    diagnostics: data.diagnostics?.trim() ? data.diagnostics.trim() : null,
  };
}
