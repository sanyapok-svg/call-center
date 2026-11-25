"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Header } from "@/components/Header";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        setError("Неверный email или пароль");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Неверный email или пароль");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F6F7]">
      <Header showNav={false} />
      <main className="mx-auto flex max-w-[1200px] items-center justify-center px-6 py-16">
        <div
          className="w-full max-w-[400px] rounded-xl bg-white p-10"
          style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}
        >
          <div className="mb-6 flex justify-center">
            <Logo size="login" priority />
          </div>
          <h1 className="mb-8 text-center text-xl font-semibold text-[#1F2328]">
            Платформа заявок
            <br />
            сервисного центра
          </h1>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Пароль</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error ? (
              <p className="text-sm text-[#6B7280]">{error}</p>
            ) : null}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Вход…" : "Войти"}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
