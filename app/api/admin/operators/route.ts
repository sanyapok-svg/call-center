import { NextResponse } from "next/server";
import {
  AuthError,
  hashPassword,
  invalidateUserSessions,
  requireAdmin,
} from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createOperatorSchema, resetPasswordSchema } from "@/lib/validation";

export async function GET() {
  try {
    await requireAdmin();
    const operators = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        isAdmin: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      operators: operators.map((op) => ({
        ...op,
        createdAt: op.createdAt.toISOString(),
      })),
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
    await requireAdmin();
    const body = await request.json();
    const parsed = createOperatorSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Ошибка валидации", issues: parsed.error.issues },
        { status: 400 },
      );
    }

    const email = parsed.data.email.toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Пользователь с таким email уже существует" },
        { status: 409 },
      );
    }

    const passwordHash = await hashPassword(parsed.data.password);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        isAdmin: false,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      ...user,
      createdAt: user.createdAt.toISOString(),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await requireAdmin();
    const body = (await request.json()) as {
      id?: string;
      action?: "deactivate" | "activate" | "reset_password";
      password?: string;
    };

    if (!body.id || !body.action) {
      return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: body.id } });
    if (!user) {
      return NextResponse.json({ error: "Не найдено" }, { status: 404 });
    }

    if (user.id === admin.id && body.action === "deactivate") {
      return NextResponse.json(
        { error: "Нельзя отключить собственную учётную запись" },
        { status: 409 },
      );
    }

    if (body.action === "deactivate") {
      await prisma.user.update({
        where: { id: user.id },
        data: { isActive: false },
      });
      await invalidateUserSessions(user.id);
      return NextResponse.json({ ok: true, isActive: false });
    }

    if (body.action === "activate") {
      await prisma.user.update({
        where: { id: user.id },
        data: { isActive: true },
      });
      return NextResponse.json({ ok: true, isActive: true });
    }

    if (body.action === "reset_password") {
      const parsed = resetPasswordSchema.safeParse({ password: body.password });
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Пароль не короче 6 символов" },
          { status: 400 },
        );
      }
      const passwordHash = await hashPassword(parsed.data.password);
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      });
      await invalidateUserSessions(user.id);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Неизвестное действие" }, { status: 400 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
