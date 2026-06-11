import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm hover:-translate-y-0.5 hover:bg-[var(--primary-hover)] hover:shadow-md",
        secondary:
          "border border-[var(--border)] bg-white text-gray-900 shadow-sm hover:-translate-y-0.5 hover:border-gray-300 hover:bg-gray-50 hover:shadow-md",
        ghost: "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
      },
      size: {
        default: "min-h-11",
        lg: "min-h-12 px-5 text-base",
        sm: "min-h-9 rounded-lg px-3 text-xs"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

export { buttonVariants };
