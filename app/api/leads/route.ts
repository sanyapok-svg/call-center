import { NextResponse } from "next/server";
import { AuthError, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { leadAccessWhere, nextLocalNumber, normalizeLeadInput } from "@/lib/leads";
import { leadFormSchema, LEAD_STATUSES, type LeadStatus } from "@/lib/validation";

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const where = {
      ...leadAccessWhere(user),
      ...(status && LEAD_STATUSES.includes(status as LeadStatus)
        ? { status }
        : {}),
    };

    const [leads, draft, submitted, failed] = await Promise.all([
      prisma.lead.findMany({
        where,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          localNumber: true,
          clientName: true,
          equipmentText: true,
          createdAt: true,
          status: true,
          operatorId: true,
        },
      }),
      prisma.lead.count({
        where: { ...leadAccessWhere(user), status: "draft" },
      }),
      prisma.lead.count({
        where: { ...leadAccessWhere(user), status: "submitted" },
      }),
      prisma.lead.count({
        where: { ...leadAccessWhere(user), status: "failed" },
      }),
    ]);

    return NextResponse.json({
      leads: leads.map((lead) => ({
        ...lead,
        createdAt: lead.createdAt.toISOString(),
      })),
      stats: { draft, submitted, failed },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const parsed = leadFormSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Ошибка валидации", issues: parsed.error.issues },
        { status: 400 },
      );
    }

    const localNumber = await nextLocalNumber();
    const data = normalizeLeadInput(parsed.data);

    const lead = await prisma.lead.create({
      data: {
        ...data,
        localNumber,
        operatorId: user.id,
        status: "draft",
      },
    });

    return NextResponse.json({ id: lead.id, localNumber: lead.localNumber });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
