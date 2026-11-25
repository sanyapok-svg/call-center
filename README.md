# A.E.L. Call Center — платформа заявок

Веб-форма колл-центра A.E.L. для создания заявок в Bitrix24.

**Стек:** Next.js (App Router) · TypeScript · Prisma · Postgres · Tailwind CSS · Vercel

## Быстрый старт

1. Скопируйте `.env.example` → `.env` и заполните переменные.
2. Установите зависимости: `npm install`
3. Примените схему: `npm run db:push`
4. Создайте админа: `npm run db:seed`
5. Запуск: `npm run dev`

## Переменные окружения

| Переменная | Назначение |
|---|---|
| `DATABASE_URL` | Postgres connection string |
| `BITRIX24_WEBHOOK_URL` | Входящий вебхук Bitrix24 (**не** `NEXT_PUBLIC_`) |
| `SESSION_SECRET` | Секрет сессий |
| `ADMIN_EMAIL` | Email первого админа (сид) |
| `ADMIN_PASSWORD` | Пароль первого админа (удалить после сида) |

## Деплой на Vercel

1. Подключите Postgres (Vercel Postgres / Neon / Supabase).
2. Задайте env в проекте Vercel.
3. Deploy. После деплоя выполните `prisma db push` / migrate и `npm run db:seed`.

## Безопасность

- Вебхук Bitrix24 вызывается только в `app/api/leads/[id]/submit/route.ts`.
- Изоляция заявок по `operatorId` на сервере; админ видит все.
- Статус `submitted` необратим (API → 409).
