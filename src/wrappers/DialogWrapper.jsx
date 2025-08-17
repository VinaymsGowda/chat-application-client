import * as Dialog from "@radix-ui/react-dialog";
import React from "react";

function DialogWrapper({ open, onOpenChange, title, children }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/30 z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[60vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-4 sm:p-6 shadow-lg focus:outline-none">
          <Dialog.Title className="text-lg font-bold mb-4 flex items-center gap-2">
            {title}
          </Dialog.Title>

          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default DialogWrapper;
