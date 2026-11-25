"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type ToastTone = "neutral" | "success" | "error";

export type ToastItem = {
  id: string;
  message: string;
  tone: ToastTone;
  actionLabel?: string;
  onAction?: () => void;
};

type ToastContextValue = {
  push: (toast: Omit<ToastItem, "id">) => void;
};

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<ToastItem[]>([]);

  const push = React.useCallback((toast: Omit<ToastItem, "id">) => {
    const id = crypto.randomUUID();
    setItems((prev) => [...prev, { ...toast, id }]);
    window.setTimeout(() => {
      setItems((prev) => prev.filter((item) => item.id !== id));
    }, 5000);
  }, []);

  const dismiss = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="pointer-events-none fixed right-4 bottom-4 z-[60] flex w-full max-w-sm flex-col gap-2">
        {items.map((item) => (
          <div
            key={item.id}
            className={cn(
              "pointer-events-auto rounded-xl border px-4 py-3 shadow-lg",
              item.tone === "success" && "border-[#BBF7D0] bg-[#ECFDF5] text-[#166534]",
              item.tone === "error" && "border-[#FECACA] bg-[#FEF2F2] text-[#991B1B]",
              item.tone === "neutral" && "border-[#E5E7EB] bg-white text-[#1F2328]",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium">{item.message}</p>
              <button
                type="button"
                className="text-xs opacity-60 hover:opacity-100"
                onClick={() => dismiss(item.id)}
              >
                ✕
              </button>
            </div>
            {item.actionLabel && item.onAction ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="mt-2"
                onClick={() => {
                  item.onAction?.();
                  dismiss(item.id);
                }}
              >
                {item.actionLabel}
              </Button>
            ) : null}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}
