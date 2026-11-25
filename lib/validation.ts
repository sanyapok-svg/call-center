import { z } from "zod";

const phoneRegex = /^[+]?[\d\s()-]{7,20}$/;

export const loginSchema = z.object({
  email: z.string().email("Некорректный email"),
  password: z.string().min(1, "Введите пароль"),
});

export const leadFormSchema = z.object({
  clientName: z.string().trim().min(1, "Укажите имя клиента / организацию"),
  phone: z
    .string()
    .trim()
    .min(1, "Укажите телефон")
    .regex(phoneRegex, "Некорректный формат телефона"),
  email: z
    .string()
    .trim()
    .email("Некорректный email")
    .optional()
    .or(z.literal("")),
  equipmentText: z
    .string()
    .trim()
    .min(1, "Укажите оборудование (производитель + модель + тип)"),
  serialNumber: z.string().trim().optional().or(z.literal("")),
  address: z.string().trim().min(1, "Укажите адрес нахождения оборудования"),
  description: z.string().trim().min(1, "Укажите описание неисправности"),
  diagnostics: z.string().trim().optional().or(z.literal("")),
});

export const createOperatorSchema = z.object({
  email: z.string().email("Некорректный email"),
  password: z.string().min(6, "Пароль не короче 6 символов"),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(6, "Пароль не короче 6 символов"),
});

export type LeadFormValues = z.infer<typeof leadFormSchema>;
export type LoginValues = z.infer<typeof loginSchema>;

export const LEAD_STATUSES = ["draft", "submitted", "failed"] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];
