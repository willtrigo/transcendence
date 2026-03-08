"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "relative overflow-hidden inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        primary:
          "bg-gradient-to-r from-[#FB923C] via-[#F97316] to-[#EA580C] text-white shadow-lg hover:shadow-2xl hover:-translate-y-0.5 hover:brightness-110 active:scale-[0.98]",

        secondary:
          "bg-gradient-to-r from-[#1D4ED8] to-[#7C3AED] text-white shadow-lg hover:shadow-2xl hover:-translate-y-0.5 hover:brightness-110 active:scale-[0.98]",

        outline:
          "border border-[#1D4ED8] text-[#1D4ED8] bg-white shadow-md hover:shadow-2xl hover:-translate-y-0.5 hover:bg-[#1D4ED8] hover:text-white active:scale-[0.98]",

        ghost:
          "bg-transparent text-gray-700 hover:bg-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98]",

        danger:
          "bg-red-600 text-white shadow-lg hover:shadow-2xl hover:-translate-y-0.5 hover:brightness-110 active:scale-[0.98]",
      },
      size: {
        sm: "h-8 px-3",
        md: "h-10 px-5",
        lg: "h-12 px-6 text-base",
      },
      fullWidth: {
        true: "w-full",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
)

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    loading?: boolean
  }

export function Button({
  className,
  variant,
  size,
  fullWidth,
  loading,
  children,
  disabled,
  onClick,
  ...props
}: ButtonProps) {
  const buttonRef = React.useRef<HTMLButtonElement>(null)

  const createRipple = (event: React.MouseEvent<HTMLButtonElement>) => {
    const button = buttonRef.current
    if (!button) return

    const circle = document.createElement("span")
    const diameter = Math.max(button.clientWidth, button.clientHeight)
    const radius = diameter / 2
    const rect = button.getBoundingClientRect()

    circle.style.width = circle.style.height = `${diameter}px`
    circle.style.left = `${event.clientX - rect.left - radius}px`
    circle.style.top = `${event.clientY - rect.top - radius}px`
    circle.classList.add("ripple")

    const ripple = button.getElementsByClassName("ripple")[0]
    if (ripple) {
      ripple.remove()
    }

    button.appendChild(circle)
  }

  return (
    <button
      ref={buttonRef}
      onClick={(e) => {
        createRipple(e)
        onClick?.(e)
      }}
      className={cn(buttonVariants({ variant, size, fullWidth }), className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
      )}
      {children}
    </button>
  )
}