import { useEffect, useRef } from "react";
import type { ReactNode, KeyboardEvent } from "react";
import { Icon } from "./Icons";
export default function Dialog({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    else if (!open && d.open) d.close();
  }, [open]);
  function keepFocus(e: KeyboardEvent<HTMLDialogElement>) {
    if (e.key !== "Tab") return;
    const controls = [
      ...e.currentTarget.querySelectorAll<HTMLElement>(
        'button:not(:disabled),a[href],input:not(:disabled),textarea:not(:disabled),select:not(:disabled),[tabindex="0"]',
      ),
    ].filter((el) => el.getClientRects().length > 0);
    const first = controls[0],
      last = controls.at(-1);
    if (!first) return;
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last?.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
  return (
    <dialog
      ref={ref}
      className="game-dialog"
      onKeyDown={keepFocus}
      onCancel={onClose}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      aria-labelledby="dialog-title"
    >
      <div className="dialog-header">
        <h2 id="dialog-title">{title}</h2>
        <button
          className="icon-button"
          aria-label="Close dialog"
          onClick={onClose}
        >
          <Icon name="close" />
        </button>
      </div>
      <div className="dialog-body">{children}</div>
    </dialog>
  );
}
