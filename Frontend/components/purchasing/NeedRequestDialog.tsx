import React, { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useI18n } from "../../i18n";

interface Props {
  title: string;
  subtitle?: string;
  busy?: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

/** Native modal semantics include focus trapping, Escape and focus restoration. */
export default function NeedRequestDialog({
  title,
  subtitle,
  busy = false,
  onClose,
  children,
}: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const { t } = useI18n();
  useEffect(() => {
    const dialog = ref.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog?.showModal();
    return () => {
      dialog?.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);
  return createPortal(
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-modal="true"
      className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-2xl overflow-y-auto rounded-3xl border-0 bg-white p-0 text-slate-800 shadow-2xl modal-dialog"
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget && !busy) {
          const bounds = event.currentTarget.getBoundingClientRect();
          if (
            event.clientX < bounds.left ||
            event.clientX > bounds.right ||
            event.clientY < bounds.top ||
            event.clientY > bounds.bottom
          )
            onClose();
        }
      }}
    >
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5 sm:px-8">
        <div className="min-w-0">
          <h2
            id={titleId}
            className="break-words text-xl font-bold tracking-tight"
          >
            {title}
          </h2>
          {subtitle && (
            <p className="mt-1 text-sm leading-relaxed text-slate-500">
              {subtitle}
            </p>
          )}
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={onClose}
          aria-label={t("needs.close")}
          className="shrink-0 rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-2 focus-visible:outline-lime-600 disabled:opacity-40"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      {children}
    </dialog>,
    document.body,
  );
}
