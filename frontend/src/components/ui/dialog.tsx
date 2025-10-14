"use client";

import * as React from "react";
import { Dialog as HeadlessDialog, DialogTitle as HeadlessDialogTitle, Transition } from "@headlessui/react";
import { cn } from "@/lib/utils";

interface DialogContextValue {
  onOpenChange?: (open: boolean) => void;
}

const DialogContext = React.createContext<DialogContextValue | null>(null);

function useDialogContext() {
  const context = React.useContext(DialogContext);
  if (!context) {
    throw new Error("Dialog components must be used within a Dialog");
  }
  return context;
}

export interface DialogProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  const handleClose = React.useCallback(
    (value: boolean) => {
      onOpenChange?.(value);
    },
    [onOpenChange]
  );

  return (
    <Transition.Root show={open} as={React.Fragment}>
      <HeadlessDialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={React.Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-6">
            <DialogContext.Provider value={{ onOpenChange: handleClose }}>
              {children}
            </DialogContext.Provider>
          </div>
        </div>
      </HeadlessDialog>
    </Transition.Root>
  );
}

export interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(function DialogContent(
  { className, children, ...props },
  ref
) {
  const { onOpenChange } = useDialogContext();

  return (
    <Transition.Child
      as={React.Fragment}
      enter="ease-out duration-200"
      enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
      enterTo="opacity-100 translate-y-0 sm:scale-100"
      leave="ease-in duration-150"
      leaveFrom="opacity-100 translate-y-0 sm:scale-100"
      leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
    >
      <HeadlessDialog.Panel
        ref={ref}
        className={cn(
          "relative w-full max-w-xl transform overflow-hidden rounded-lg bg-white p-6 text-left align-middle shadow-xl transition-all",
          className
        )}
        {...props}
      >
        {children}
        <button
          type="button"
          className="absolute right-4 top-4 rounded-md p-1 text-gray-500 transition hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          onClick={() => onOpenChange?.(false)}
          aria-label="Cerrar"
        >
          <span aria-hidden>×</span>
        </button>
      </HeadlessDialog.Panel>
    </Transition.Child>
  );
});

export interface DialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

export function DialogHeader({ className, ...props }: DialogHeaderProps) {
  return <div className={cn("mb-4 space-y-1", className)} {...props} />;
}

export interface DialogTitleProps extends React.ComponentProps<typeof HeadlessDialogTitle> {}

export function DialogTitle({ className, ...props }: DialogTitleProps) {
  return <HeadlessDialogTitle className={cn("text-lg font-semibold text-gray-900", className)} {...props} />;
}

