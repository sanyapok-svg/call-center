import { NextResponse } from "next/server";
import { AuthError, requireUser } from "@/lib/auth";
import { createBitrixLead } from "@/lib/bitrix";
import { prisma } from "@/lib/db";
import { leadAccessWhere } from "@/lib/leads";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  try {
    const user = await requireUser();
    const { id } = await params;

    const lead = await prisma.lead.findFirst({
      where: { id, ...leadAccessWhere(user) },
    });

    if (!lead) {
      return NextResponse.json({ error: "Не найдено" }, { status: 404 });
    }

    if (lead.status === "submitted") {
      return NextResponse.json(
        { error: "Заявка уже отправлена" },
        { status: 409 },
      );
    }

    if (lead.status !== "draft" && lead.status !== "failed") {
      return NextResponse.json(
        { error: "Недопустимый статус для отправки" },
        { status: 409 },
      );
    }

    const result = await createBitrixLead({
      localNumber: lead.localNumber,
      clientName: lead.clientName,
      phone: lead.phone,
      email: lead.email,
      equipmentText: lead.equipmentText,
      serialNumber: lead.serialNumber,
      address: lead.address,
      description: lead.description,
      diagnostics: lead.diagnostics,
    });

    if (!result.ok) {
      await prisma.lead.update({
        where: { id: lead.id },
        data: {
          status: "failed",
          lastError: result.error,
        },
      });

      return NextResponse.json(
        { error: result.error },
        { status: 502 },
      );
    }

    const updated = await prisma.lead.update({
      where: { id: lead.id },
      data: {
        status: "submitted",
        bitrixLeadId: result.leadId,
        lastError: null,
        submittedAt: new Date(),
      },
    });

    return NextResponse.json({
      ok: true,
      bitrixLeadId: updated.bitrixLeadId,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
