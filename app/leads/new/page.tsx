import Link from "next/link";
import { redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { LeadForm } from "@/components/LeadForm";
import { getSessionUser } from "@/lib/auth";

export default async function NewLeadPage() {
  const user = await getSessionUser();
  if (!user) redirect("/");

  return (
    <div className="min-h-screen bg-[#F5F6F7]">
      <Header email={user.email} isAdmin={user.isAdmin} />
      <main className="mx-auto max-w-[1200px] px-6 py-8">
        <div className="mb-2 text-sm text-[#6B7280]">
          <Link href="/dashboard" className="hover:text-[#C8102E]">
            Рабочий стол
          </Link>
          <span className="mx-2">→</span>
          <span className="text-[#1F2328]">Новая заявка</span>
        </div>
        <h1 className="mb-6 text-2xl font-semibold text-[#1F2328]">
          Новая заявка
        </h1>
        <LeadForm mode="create" showRemoteResolved />
      </main>
    </div>
  );
}
