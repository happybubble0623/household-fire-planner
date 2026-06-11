"use client";

type WorkbookConflictDialogProps = {
  localUpdatedAt: string;
  cloudUpdatedAt: string;
  busy?: boolean;
  onKeepLocal: () => void;
  onKeepCloud: () => void;
};

function formatEdited(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "an unknown time";
  return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

/**
 * Blocking modal shown when both this device and the signed-in account hold
 * meaningful — and different — plans. The user must explicitly choose which to
 * keep; nothing is overwritten until they do. The more recently edited side is
 * flagged as a hint, but the choice is entirely theirs.
 */
export function WorkbookConflictDialog({
  localUpdatedAt,
  cloudUpdatedAt,
  busy = false,
  onKeepLocal,
  onKeepCloud
}: WorkbookConflictDialogProps) {
  const localTime = new Date(localUpdatedAt).getTime();
  const cloudTime = new Date(cloudUpdatedAt).getTime();
  const localIsNewer = !Number.isNaN(localTime) && !Number.isNaN(cloudTime) && localTime > cloudTime;
  const cloudIsNewer = !Number.isNaN(localTime) && !Number.isNaN(cloudTime) && cloudTime > localTime;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="workbook-conflict-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-white p-6 shadow-xl">
        <h2 id="workbook-conflict-title" className="text-lg font-semibold text-gray-900">
          Which plan would you like to keep?
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-gray-600">
          This device and your account each have a saved plan, and they&rsquo;re
          different. Choose which one to keep — the other will be replaced.
          Nothing is changed until you pick.
        </p>

        <div className="mt-5 grid gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={onKeepLocal}
            className="rounded-xl border border-[var(--border)] px-4 py-3 text-left transition-colors hover:bg-[var(--soft)] disabled:opacity-60"
          >
            <span className="block text-sm font-semibold text-gray-900">
              Keep this device&rsquo;s plan
              {localIsNewer ? (
                <span className="ml-2 rounded-full bg-[var(--soft)] px-2 py-0.5 text-[11px] font-medium text-gray-600">
                  most recent
                </span>
              ) : null}
            </span>
            <span className="mt-0.5 block text-xs text-gray-500">
              Edited {formatEdited(localUpdatedAt)}
            </span>
          </button>

          <button
            type="button"
            disabled={busy}
            onClick={onKeepCloud}
            className="rounded-xl border border-[var(--border)] px-4 py-3 text-left transition-colors hover:bg-[var(--soft)] disabled:opacity-60"
          >
            <span className="block text-sm font-semibold text-gray-900">
              Keep your account&rsquo;s plan
              {cloudIsNewer ? (
                <span className="ml-2 rounded-full bg-[var(--soft)] px-2 py-0.5 text-[11px] font-medium text-gray-600">
                  most recent
                </span>
              ) : null}
            </span>
            <span className="mt-0.5 block text-xs text-gray-500">
              Edited {formatEdited(cloudUpdatedAt)}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
