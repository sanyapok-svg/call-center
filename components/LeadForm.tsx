"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { leadFormSchema, type LeadFormValues } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/Toast";
import { Dialog } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

type Mode = "create" | "edit" | "view";

type LeadFormProps = {
  mode: Mode;
  leadId?: string;
  initialValues?: Partial<LeadFormValues>;
  statusBanner?: ReactNode;
  showRemoteResolved?: boolean;
  allowRetry?: boolean;
  allowDelete?: boolean;
};

const emptyValues: LeadFormValues = {
  clientName: "",
  phone: "",
  email: "",
  equipmentText: "",
  serialNumber: "",
  address: "",
  description: "",
  diagnostics: "",
};

export function LeadForm({
  mode,
  leadId,
  initialValues,
  statusBanner,
  showRemoteResolved = mode === "create",
  allowRetry = false,
  allowDelete = false,
}: LeadFormProps) {
  const router = useRouter();
  const { push } = useToast();
  const readOnly = mode === "view";

  const [values, setValues] = useState<LeadFormValues>({
    ...emptyValues,
    ...initialValues,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof LeadFormValues, string>>>({});
  const [remoteResolved, setRemoteResolved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmRetry, setConfirmRetry] = useState(false);

  function updateField<K extends keyof LeadFormValues>(key: K, value: LeadFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function validate(): LeadFormValues | null {
    const parsed = leadFormSchema.safeParse(values);
    if (!parsed.success) {
      const next: Partial<Record<keyof LeadFormValues, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof LeadFormValues;
        if (!next[key]) next[key] = issue.message;
      }
      setErrors(next);
      return null;
    }
    setErrors({});
    return parsed.data;
  }

  async function saveDraft(redirect = true): Promise<string | null> {
    const data = validate();
    if (!data) return null;

    setSaving(true);
    try {
      const response = await fetch(leadId ? `/api/leads/${leadId}` : "/api/leads", {
        method: leadId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const payload = (await response.json()) as { id?: string; error?: string };
      if (!response.ok) {
        push({ tone: "error", message: payload.error || "Не удалось сохранить черновик" });
        return null;
      }

      push({ tone: "neutral", message: "Черновик сохранён" });
      if (redirect) {
        router.push("/dashboard");
        router.refresh();
      }
      return payload.id ?? leadId ?? null;
    } finally {
      setSaving(false);
    }
  }

  async function submitToBitrix(existingId?: string) {
    const data = validate();
    if (!data) return;

    setSubmitting(true);
    try {
      let id = existingId ?? leadId;
      if (!id || mode === "create") {
        id = (await saveDraft(false)) ?? undefined;
      } else {
        const patch = await fetch(`/api/leads/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!patch.ok) {
          const payload = (await patch.json()) as { error?: string };
          push({ tone: "error", message: payload.error || "Не удалось сохранить перед отправкой" });
          return;
        }
      }

      if (!id) return;

      const response = await fetch(`/api/leads/${id}/submit`, { method: "POST" });
      const payload = (await response.json()) as { error?: string; bitrixLeadId?: string };

      if (!response.ok) {
        push({
          tone: "error",
          message: payload.error || "Ошибка отправки",
          actionLabel: "Повторить",
          onAction: () => {
            router.push(`/leads/${id}/edit`);
          },
        });
        router.push(`/leads/${id}/edit`);
        router.refresh();
        return;
      }

      push({ tone: "success", message: "Заявка отправлена" });
      router.push(`/leads/${id}`);
      router.refresh();
    } finally {
      setSubmitting(false);
      setConfirmRetry(false);
    }
  }

  async function handleDelete() {
    if (!leadId) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/leads/${leadId}`, { method: "DELETE" });
      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        push({ tone: "error", message: payload.error || "Не удалось удалить" });
        return;
      }
      push({ tone: "neutral", message: "Черновик удалён" });
      router.push("/dashboard");
      router.refresh();
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  function handleRemoteResolved(checked: boolean) {
    setRemoteResolved(checked);
    if (checked) {
      push({
        tone: "neutral",
        message: "Звонок закрывается в UIS, заявка не создаётся",
      });
      setValues(emptyValues);
      setErrors({});
    }
  }

  if (remoteResolved) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-6">
          <p className="text-[#1F2328]">
            Звонок закрывается в UIS, заявка не создаётся.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button variant="secondary" onClick={() => setRemoteResolved(false)}>
              Вернуться к форме
            </Button>
            <Button variant="ghost" onClick={() => router.push("/dashboard")}>
              На рабочий стол
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {statusBanner}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>ДАННЫЕ КЛИЕНТА</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field
              label="Имя клиента / организация"
              required
              error={errors.clientName}
            >
              <Input
                value={values.clientName}
                disabled={readOnly}
                onChange={(e) => updateField("clientName", e.target.value)}
              />
            </Field>
            <Field label="Контактный телефон" required error={errors.phone}>
              <Input
                value={values.phone}
                disabled={readOnly}
                onChange={(e) => updateField("phone", e.target.value)}
              />
            </Field>
            <Field label="Email" error={errors.email}>
              <Input
                type="email"
                value={values.email ?? ""}
                disabled={readOnly}
                onChange={(e) => updateField("email", e.target.value)}
              />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>ОБОРУДОВАНИЕ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field
              label="Своё оборудование"
              required
              error={errors.equipmentText}
              hint="Производитель + модель + тип"
            >
              <Input
                value={values.equipmentText}
                disabled={readOnly}
                onChange={(e) => updateField("equipmentText", e.target.value)}
              />
            </Field>
            <Field label="Серийный номер (S/N)" error={errors.serialNumber}>
              <Input
                value={values.serialNumber ?? ""}
                disabled={readOnly}
                onChange={(e) => updateField("serialNumber", e.target.value)}
              />
            </Field>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>ОБРАЩЕНИЕ</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 lg:grid-cols-2">
            <Field label="Адрес нахождения оборудования" required error={errors.address}>
              <Input
                value={values.address}
                disabled={readOnly}
                onChange={(e) => updateField("address", e.target.value)}
              />
            </Field>
            <div className="lg:col-span-2">
              <Field label="Описание неисправности" required error={errors.description}>
                <Textarea
                  value={values.description}
                  disabled={readOnly}
                  onChange={(e) => updateField("description", e.target.value)}
                />
              </Field>
            </div>
            <div className="lg:col-span-2">
              <Field
                label="Результаты первичной диагностики по скриптам"
                error={errors.diagnostics}
              >
                <Textarea
                  value={values.diagnostics ?? ""}
                  disabled={readOnly}
                  onChange={(e) => updateField("diagnostics", e.target.value)}
                />
              </Field>
            </div>
          </CardContent>
        </Card>
      </div>

      {showRemoteResolved && !readOnly ? (
        <label className="flex items-start gap-3 rounded-xl border border-[#E5E7EB] bg-white p-4">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border-[#E5E7EB] text-[#C8102E] focus:ring-[#C8102E]"
            checked={remoteResolved}
            onChange={(e) => handleRemoteResolved(e.target.checked)}
          />
          <span>
            <span className="block text-sm font-medium text-[#1F2328]">
              Проблема решена дистанционно
            </span>
            <span className="block text-sm text-[#6B7280]">
              Заявка не создаётся, звонок закрывается в UIS
            </span>
          </span>
        </label>
      ) : null}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button variant="ghost" type="button" onClick={() => router.push("/dashboard")}>
          {readOnly ? "Назад" : "Отмена"}
        </Button>

        {allowDelete && !readOnly ? (
          <Button
            variant="secondary"
            type="button"
            onClick={() => setConfirmDelete(true)}
            disabled={deleting}
          >
            Удалить черновик
          </Button>
        ) : null}

        {!readOnly ? (
          <Button
            variant="secondary"
            type="button"
            onClick={() => void saveDraft(true)}
            disabled={saving || submitting}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Сохранить черновик
          </Button>
        ) : null}

        {!readOnly ? (
          <Button
            type="button"
            onClick={() => void submitToBitrix()}
            disabled={saving || submitting}
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {allowRetry ? "Повторить отправку" : "Отправить в Б24"}
          </Button>
        ) : null}

        {allowRetry && readOnly ? (
          <Button type="button" onClick={() => setConfirmRetry(true)}>
            Повторить отправку
          </Button>
        ) : null}
      </div>

      <Dialog
        open={confirmDelete}
        title="Удалить черновик?"
        description="Запись будет удалена безвозвратно."
        confirmLabel="Удалить"
        confirmVariant="danger"
        loading={deleting}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => void handleDelete()}
      />

      <Dialog
        open={confirmRetry}
        title="Повторить отправку?"
        description="Заявка будет снова отправлена в Bitrix24."
        confirmLabel="Отправить"
        loading={submitting}
        onCancel={() => setConfirmRetry(false)}
        onConfirm={() => void submitToBitrix()}
      />
    </div>
  );
}

function Field({
  label,
  required,
  error,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <Label required={required}>{label}</Label>
      {hint ? <p className="mb-1.5 text-xs text-[#6B7280]">{hint}</p> : null}
      {children}
      {error ? <p className="mt-1 text-sm text-[#B91C1C]">{error}</p> : null}
    </div>
  );
}
