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

function buildComments(
  description: string,
  diagnostics?: string | null,
): string {
  if (diagnostics && diagnostics.trim()) {
    return `${description}\n\nДиагностика: ${diagnostics}`;
  }
  return description;
}

export async function createBitrixLead(
  payload: BitrixLeadPayload,
): Promise<BitrixLeadResult> {
  const webhookUrl = process.env.BITRIX24_WEBHOOK_URL;

  if (!webhookUrl) {
    return { ok: false, error: "BITRIX24_WEBHOOK_URL не настроен" };
  }

  const fields: Record<string, unknown> = {
    TITLE: `СЦ — ${payload.clientName} — ${payload.equipmentText}`,
    NAME: payload.clientName,
    PHONE: [{ VALUE: payload.phone, VALUE_TYPE: "WORK" }],
    ADDRESS: payload.address,
    COMMENTS: buildComments(payload.description, payload.diagnostics),
    SOURCE_ID: "KC_WEBFORM",
    ORIGIN_ID: `kc-${payload.localNumber}`,
  };

  if (payload.email) {
    fields.EMAIL = [{ VALUE: payload.email, VALUE_TYPE: "WORK" }];
  }

  // Оборудование и S/N дублируем в COMMENTS — пользовательские UF-коды в CRM
  // могут отсутствовать и ломать создание лида.
  const equipmentBlock = [
    `Оборудование: ${payload.equipmentText}`,
    payload.serialNumber ? `S/N: ${payload.serialNumber}` : null,
  ]
    .filter(Boolean)
    .join("\n");
  fields.COMMENTS = [fields.COMMENTS, equipmentBlock].filter(Boolean).join("\n\n");

  const endpoint = webhookUrl.replace(/\/?$/, "/") + "crm.lead.add.json";

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
