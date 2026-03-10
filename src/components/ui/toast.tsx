"use client"

import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

type ToastVariant = "neutral" | "success" | "danger" | "info"

type ToastItem = {
  id: string
  title?: string
  message: string
  variant: ToastVariant
  durationMs: number
}

type ToastContextValue = {
  push: (t: Omit<ToastItem, "id">) => void
}

const ToastContext = React.createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = React.useContext(ToastContext)

  if (!ctx) {
    throw new Error("useToast must be used within <ToastProvider />")
  }

  return ctx
}

function variantClass(variant: ToastVariant) {
  if (variant === "success") {
    return "border-emerald-400/25 bg-emerald-500/10 text-emerald-100"
  }

  if (variant === "danger") {
    return "border-[rgb(var(--danger))]/25 bg-[rgb(var(--danger))]/10 text-red-100"
  }

  if (variant === "info") {
    return "border-[rgb(var(--info))]/25 bg-[rgb(var(--info))]/10 text-blue-100"
  }

  return "border-white/10 bg-white/5 text-white"
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<ToastItem[]>([])

  const remove = React.useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const push = React.useCallback(
    (toast: Omit<ToastItem, "id">) => {
      const id =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : String(Date.now() + Math.random())

      const item: ToastItem = { id, ...toast }

      setItems((prev) => [item, ...prev])

      window.setTimeout(() => {
        remove(id)
      }, toast.durationMs)
    },
    [remove]
  )

  return (
    <ToastContext.Provider value={{ push }}>
      {children}

      <div className="fixed right-5 top-5 z-[80] flex w-[min(420px,calc(100vw-40px))] flex-col gap-3">
        {items.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              "relative rounded-2xl border px-4 py-3",
              "bg-[rgb(var(--card))]/85 backdrop-blur-xl",
              "shadow-[0_0_50px_rgba(0,0,0,0.55)]",
              "animate-[toastIn_180ms_ease-out]",
              variantClass(toast.variant)
            )}
          >
            <button
              type="button"
              onClick={() => remove(toast.id)}
              className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-md text-gray-400 transition hover:bg-white/10 hover:text-white"
              aria-label="Fechar notificação"
            >
              <X size={16} />
            </button>

            {toast.title && (
              <div className="pr-6 text-sm font-semibold leading-5">
                {toast.title}
              </div>
            )}

            <div className="pr-6 text-sm text-[rgb(var(--muted))]">
              {toast.message}
            </div>
          </div>
        ))}
      </div>

      <style jsx global>{`
        @keyframes toastIn {
          from {
            opacity: 0;
            transform: translateY(-6px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </ToastContext.Provider>
  )
}