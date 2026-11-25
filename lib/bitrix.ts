import "server-only";

export type BitrixLeadPayload = {
  localNumber: string;
  clientName: string;
  phone: string;
  email?: string | null;
  equipmentText: string;
  serialNumber?: string | null;
  address: string;
  description: string;
  diagnostics?: string | null;
};

export type BitrixLeadResult =
  | { ok: true; leadId: string }
  | { ok: false; error: string };

/** Пользовательские поля сделки Bitrix24 */
const UF = {
  contactPerson: "UF_CRM_1779446113",
  contactPhone: "UF_CRM_1779446125",
  equipment: "UF_CRM_DEAL_1795506483247",
  serialNumber: "UF_CRM_1782111840474",
  address: "UF_CRM_1773210251314",
  description: "UF_CRM_1773210262758",
  diagnostics: "UF_CRM_1795184351",
} as const;

function buildComments(payload: BitrixLeadPayload): string {
  const parts = [
    payload.description,
    payload.diagnostics?.trim()
      ? `Диагностика: ${payload.diagnostics.trim()}`
      : null,
    `Оборудование: ${payload.equipmentText}`,
    payload.serialNumber?.trim() ? `S/N: ${payload.serialNumber.trim()}` : null,
    payload.email?.trim() ? `Email: ${payload.email.trim()}` : null,
    `Локальный номер: ${payload.localNumber}`,
  ].filter(Boolean);

  return parts.join("\n\n");
}

export async function createBitrixLead(
  payload: BitrixLeadPayload,
): Promise<BitrixLeadResult> {
  const webhookUrl = process.env.BITRIX24_WEBHOOK_URL;

  if (!webhookUrl) {
    return { ok: false, error: "BITRIX24_WEBHOOK_URL не настроен" };
  }

  const categoryId = Number(process.env.BITRIX24_CATEGORY_ID ?? "3");
  const sourceId = process.env.BITRIX24_SOURCE_ID?.trim() || "UC_PN5PHF";

  // Создаём сделку в нужной воронке (CATEGORY_ID), не лид.
  const fields: Record<string, unknown> = {
    TITLE: `СЦ — ${payload.clientName} — ${payload.equipmentText}`,
    CATEGORY_ID: Number.isFinite(categoryId) ? categoryId : 3,
    SOURCE_ID: sourceId,
    ORIGIN_ID: `kc-${payload.localNumber}`,
    COMMENTS: buildComments(payload),
    [UF.contactPerson]: payload.clientName,
    [UF.contactPhone]: payload.phone,
    [UF.equipment]: payload.equipmentText,
    [UF.address]: payload.address,
    [UF.description]: payload.description,
  };

  if (payload.serialNumber?.trim()) {
    fields[UF.serialNumber] = payload.serialNumber.trim();
  }

  if (payload.diagnostics?.trim()) {
    fields[UF.diagnostics] = payload.diagnostics.trim();
  }

  const endpoint = webhookUrl.replace(/\/?$/, "/") + "crm.deal.add.json";

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fields }),
      cache: "no-store",
    });

    let data: {
      result?: number | string;
      error?: string;
      error_description?: string;
    };

    try {
      data = (await response.json()) as typeof data;
    } catch {
      return {
        ok: false,
        error: `Bitrix24 вернул неJSON ответ (HTTP ${response.status})`,
      };
    }

    if (!response.ok || data.error || data.result === undefined) {
      const message =
        data.error_description ||
        data.error ||
        `Bitrix24 HTTP ${response.status}`;
      return { ok: false, error: message };
    }

    return { ok: true, leadId: String(data.result) };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Ошибка сети при вызове Bitrix24";
    return { ok: false, error: message };
  }
}
