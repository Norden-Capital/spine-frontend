"use client";

import { useState, type ReactNode } from "react";
import { BottomSheet } from "@/components/spine-ui";

/** A BottomSheet that is open on load, rendered inside the mock frame (keeps its theme). */
export function OpenSheet({
  title,
  description,
  footer,
  children,
}: {
  title: string;
  description?: string;
  footer?: ReactNode;
  children: ReactNode;
}) {
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const [open, setOpen] = useState(true);
  return (
    <div ref={setContainer}>
      {container ? (
        <BottomSheet
          open={open}
          onOpenChange={setOpen}
          container={container}
          title={title}
          description={description}
          footer={footer}
        >
          {children}
        </BottomSheet>
      ) : null}
    </div>
  );
}
