"use client";

import { useEffect, useRef } from "react";
import { trackToolUse } from "@/lib/analytics";

// Invisible. Fires one "tool_use" event when a tool page opens.
export function ToolUseTracker({ toolName }: { toolName: string }) {
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    trackToolUse(toolName);
  }, [toolName]);
  return null;
}
