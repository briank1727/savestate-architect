import Button from './Button'

type ConfirmDialogProps = {
  title?: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  onConfirm: () => void
  onCancel: () => void
}

function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel
}: ConfirmDialogProps): React.JSX.Element {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onCancel}
      role="presentation"
    >
      <div
        className="min-w-[320px] max-w-md rounded-lg bg-[var(--color-background-soft)] border border-[var(--ev-c-gray-1)] p-5 flex flex-col gap-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {title && (
          <div className="text-base font-semibold text-[var(--ev-c-text-1)]">{title}</div>
        )}
        <div className="text-sm text-[var(--ev-c-text-1)]">{message}</div>
        <div className="flex gap-2 justify-end">
          <Button onClick={onCancel}>{cancelLabel}</Button>
          <Button
            className={destructive ? 'bg-red-600! hover:bg-red-700!' : ''}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog
