"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

/**
 * Submit button that shows a spinner while its parent <form action> runs.
 * Must be rendered inside the form.
 */
export function PendingButton({
  children,
  className = "",
  pendingLabel,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  pendingLabel?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} {...props} className={className}>
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {pendingLabel ?? children}
        </>
      ) : (
        children
      )}
    </button>
  );
}
