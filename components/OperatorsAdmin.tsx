"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/Toast";
import { formatDateTime } from "@/lib/utils";

export type OperatorRow = {
  id: string;
  email: string;
  isAdmin: boolean;
  isActive: boolean;
  createdAt: string;
};

export function OperatorsAdmin({
  initialOperators,
}: {
  initialOperators: OperatorRow[];
}) {
  const { push } = useToast();
  const [operators, setOperators] = useState(initialOperators);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [resetTarget, setResetTarget] = useState<OperatorRow | null>(null);
  const [newPassword, setNewPassword] = useState("");

  async function refresh() {
    const response = await fetch("/api/admin/operators");
    if (!response.ok) return;
    const data = (await response.json()) as { operators: OperatorRow[] };
    setOperators(data.operators);
  }

  async function createOperator() {
    setCreating(true);
    try {
      const response = await fetch("/api/admin/operators", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        push({ tone: "error", message: payload.error || "Не удалось создать" });
        return;
      }
      setEmail("");
      setPassword("");
      push({ tone: "success", message: "Оператор создан" });
      await refresh();
    } finally {
      setCreating(false);
    }
  }

  async function toggleActive(op: OperatorRow) {
    setBusyId(op.id);
    try {
      const response = await fetch("/api/admin/operators", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: op.id,
          action: op.isActive ? "deactivate" : "activate",
        }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        push({ tone: "error", message: payload.error || "Ошибка" });
        return;
      }
      await refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function resetPassword() {
    if (!resetTarget) return;
    setBusyId(resetTarget.id);
    try {
      const response = await fetch("/api/admin/operators", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: resetTarget.id,
          action: "reset_password",
          password: newPassword,
        }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        push({ tone: "error", message: payload.error || "Ошибка сброса пароля" });
        return;
      }
      push({ tone: "success", message: "Пароль обновлён" });
      setResetTarget(null);
      setNewPassword("");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-4 p-5">
          <h2 className="text-sm font-semibold tracking-wide text-[#6B7280]">
            ДОБАВИТЬ ОПЕРАТОРА
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <Label>Временный пароль</Label>
              <Input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          <Button
            type="button"
            className="w-full sm:w-auto"
            onClick={() => void createOperator()}
            disabled={creating || !email || !password}
          >
            + Добавить
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-[#E5E7EB] bg-[#F9FAFB] text-[#6B7280]">
              <tr>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Статус</th>
                <th className="px-4 py-3 font-medium">Создан</th>
                <th className="px-4 py-3 font-medium">Действия</th>
              </tr>
            </thead>
            <tbody>
              {operators.map((op) => (
                <tr key={op.id} className="border-b border-[#E5E7EB] last:border-0">
                  <td className="px-4 py-3">
                    {op.email}
                    {op.isAdmin ? (
                      <span className="ml-2 text-xs text-[#6B7280]">(админ)</span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={op.isActive ? "active" : "inactive"}>
                      {op.isActive ? "Активен" : "Отключён"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-[#6B7280]">
                    {formatDateTime(op.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        disabled={busyId === op.id}
                        onClick={() => void toggleActive(op)}
                      >
                        {op.isActive ? "Отключить" : "Включить"}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={busyId === op.id}
                        onClick={() => {
                          setResetTarget(op);
                          setNewPassword("");
                        }}
                      >
                        Сбросить пароль
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(resetTarget)}
        title="Сброс пароля"
        description={
          resetTarget ? `Новый пароль для ${resetTarget.email}` : undefined
        }
        confirmLabel="Сохранить"
        loading={Boolean(resetTarget && busyId === resetTarget.id)}
        confirmDisabled={newPassword.length < 6}
        onCancel={() => setResetTarget(null)}
        onConfirm={() => void resetPassword()}
      >
        <Label>Новый пароль</Label>
        <Input
          type="text"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Минимум 6 символов"
        />
      </Dialog>
    </div>
  );
}
