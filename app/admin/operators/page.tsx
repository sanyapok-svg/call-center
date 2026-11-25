import Link from "next/link";
import { redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { OperatorsAdmin } from "@/components/OperatorsAdmin";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function OperatorsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/");
  if (!user.isAdmin) redirect("/dashboard");

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

  return (
    <div className="min-h-screen bg-[#F5F6F7]">
      <Header email={user.email} isAdmin={user.isAdmin} />
      <main className="mx-auto max-w-[1200px] px-6 py-8">
        <div className="mb-2 text-sm text-[#6B7280]">
          <Link href="/dashboard" className="hover:text-[#C8102E]">
            Рабочий стол
          </Link>
          <span className="mx-2">→</span>
          <span className="text-[#1F2328]">Операторы</span>
        </div>
        <h1 className="mb-6 text-2xl font-semibold text-[#1F2328]">
          Управление операторами
        </h1>
        <OperatorsAdmin
          initialOperators={operators.map((op) => ({
            ...op,
            createdAt: op.createdAt.toISOString(),
          }))}
        />
      </main>
    </div>
  );
}
