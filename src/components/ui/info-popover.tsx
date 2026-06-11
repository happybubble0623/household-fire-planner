"use client";

import { useId, useState } from "react";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

type InfoPopoverProps = {
  label: string;
  content: string;
  className?: string;
};

export function InfoPopover({ label, content, className }: InfoPopoverProps) {
  const [open, setOpen] = useState(false);
  const tooltipId = useId();

  return (
    <span
      className={cn("relative inline-flex items-center", className)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setOpen(false);
        }
      }}
    >
      <button
        type="button"
        aria-label={`About ${label}`}
        aria-expanded={open}
        aria-describedby={open ? tooltipId : undefined}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setOpen(false);
          }
        }}
        className="inline-flex h-6 w-6 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
      >
        <Info aria-hidden="true" className="h-4 w-4" />
      </button>
      {open ? (
        <span
          id={tooltipId}
          role="tooltip"
          className="absolute left-1/2 top-7 z-50 w-72 -translate-x-1/2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-left text-sm font-normal normal-case leading-relaxed tracking-normal text-gray-600 shadow-lg"
        >
          {content}
        </span>
      ) : null}
    </span>
  );
}
