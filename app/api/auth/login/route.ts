import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createSession, verifyPassword } from "@/lib/auth";
import { loginSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Неверный email или пароль" },
        { status: 401 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email.toLowerCase() },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: "Неверный email или пароль" },
        { status: 401 },
      );
    }

    const valid = await verifyPassword(parsed.data.password, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: "Неверный email или пароль" },
        { status: 401 },
      );
    }

    await createSession(user.id);

    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        isAdmin: user.isAdmin,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Неверный email или пароль" },
      { status: 401 },
    );
  }
}
