import { NextResponse } from "next/server";
import { AuthError, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { leadAccessWhere, normalizeLeadInput } from "@/lib/leads";
import { leadFormSchema } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

async function findAccessibleLead(id: string) {
  const user = await requireUser();
  const lead = await prisma.lead.findFirst({
    where: { id, ...leadAccessWhere(user) },
  });
  return { user, lead };
}

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const { lead } = await findAccessibleLead(id);

    if (!lead) {
      return NextResponse.json({ error: "Не найдено" }, { status: 404 });
    }

    return NextResponse.json({
      ...lead,
      createdAt: lead.createdAt.toISOString(),
      updatedAt: lead.updatedAt.toISOString(),
      submittedAt: lead.submittedAt?.toISOString() ?? null,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const { lead } = await findAccessibleLead(id);

    if (!lead) {
      return NextResponse.json({ error: "Не найдено" }, { status: 404 });
    }

    if (lead.status === "submitted") {
      return NextResponse.json(
        { error: "Отправленную заявку нельзя редактировать" },
        { status: 409 },
      );
    }

    const body = await request.json();
    const parsed = leadFormSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Ошибка валидации", issues: parsed.error.issues },
        { status: 400 },
      );
    }

    const data = normalizeLeadInput(parsed.data);
    const updated = await prisma.lead.update({
      where: { id: lead.id },
      data,
    });

    return NextResponse.json({ id: updated.id });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const { lead } = await findAccessibleLead(id);

    if (!lead) {
      return NextResponse.json({ error: "Не найдено" }, { status: 404 });
    }

    if (lead.status !== "draft") {
      return NextResponse.json(
        { error: "Удалять можно только черновики" },
        { status: 409 },
      );
    }

    await prisma.lead.delete({ where: { id: lead.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
