"use client";

import { useEffect, useRef } from "react";
import { Clock3, Trash2 } from "lucide-react";

type DraftPayload = {
  savedAt: number;
  values: Record<string, string>;
};

type DraftEventDetail = {
  draftKey: string;
  payload: DraftPayload;
  sourceFormId: string;
};

type DraftClearedEventDetail = {
  draftKey: string;
  sourceFormId: string;
};

function readDraft(draftKey: string): DraftPayload | null {
  try {
    const raw = window.localStorage.getItem(draftKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DraftPayload;
    return parsed && typeof parsed.savedAt === "number" && parsed.values ? parsed : null;
  } catch {
    return null;
  }
}

function collectDraftValues(form: HTMLFormElement) {
  const values: Record<string, string> = {};

  form.querySelectorAll<HTMLInputElement>('input[type="radio"][name^="status_"]:checked').forEach((input) => {
    values[input.name] = input.value;
  });

  form.querySelectorAll<HTMLTextAreaElement>('textarea[name^="note_"]').forEach((textarea) => {
    values[textarea.name] = textarea.value;
  });

  return values;
}

function applyDraftValues(form: HTMLFormElement, values: Record<string, string>) {
  Object.entries(values).forEach(([name, value]) => {
    const field = form.elements.namedItem(name);
    if (!field) return;

    if (field instanceof RadioNodeList) {
      field.value = value;
      return;
    }

    if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) {
      field.value = value;
    }
  });
}

function writeDraft(form: HTMLFormElement, draftKey: string, sourceFormId: string) {
  const payload: DraftPayload = {
    savedAt: Date.now(),
    values: collectDraftValues(form),
  };

  window.localStorage.setItem(draftKey, JSON.stringify(payload));
  window.dispatchEvent(new CustomEvent<DraftEventDetail>("attendance-draft-updated", { detail: { draftKey, payload, sourceFormId } }));
  return payload;
}

function getSavedLabel(savedAt: number | null) {
  if (!savedAt) return "Nháp tự lưu";
  const time = new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit" }).format(new Date(savedAt));
  return `Đã lưu nháp ${time}`;
}

export function AttendanceDraftAutosave({
  formId,
  draftKey,
  clearDraftOnSuccess = false,
}: {
  formId: string;
  draftKey: string;
  clearDraftOnSuccess?: boolean;
}) {
  const labelRef = useRef<HTMLSpanElement>(null);
  const clearButtonRef = useRef<HTMLButtonElement>(null);

  function updateDraftUi(payload: DraftPayload | null) {
    if (labelRef.current) {
      labelRef.current.textContent = getSavedLabel(payload?.savedAt || null);
    }

    if (clearButtonRef.current) {
      clearButtonRef.current.classList.toggle("hidden", !payload);
      clearButtonRef.current.classList.toggle("grid", Boolean(payload));
    }
  }

  useEffect(() => {
    const formElement = document.getElementById(formId);
    if (!(formElement instanceof HTMLFormElement)) return;
    const form = formElement;

    if (clearDraftOnSuccess) {
      window.localStorage.removeItem(draftKey);
      updateDraftUi(null);
    } else {
      const draft = readDraft(draftKey);
      if (draft) {
        applyDraftValues(form, draft.values);
        updateDraftUi(draft);
      }
    }

    function saveCurrentDraft() {
      const payload = writeDraft(form, draftKey, formId);
      updateDraftUi(payload);
    }

    function handleExternalDraft(event: Event) {
      const detail = (event as CustomEvent<DraftEventDetail>).detail;
      if (!detail || detail.draftKey !== draftKey || detail.sourceFormId === formId) return;
      applyDraftValues(form, detail.payload.values);
      updateDraftUi(detail.payload);
    }

    function handleExternalClear(event: Event) {
      const detail = (event as CustomEvent<DraftClearedEventDetail>).detail;
      if (!detail || detail.draftKey !== draftKey || detail.sourceFormId === formId) return;
      form.reset();
      updateDraftUi(null);
    }

    form.addEventListener("input", saveCurrentDraft);
    form.addEventListener("change", saveCurrentDraft);
    form.addEventListener("submit", saveCurrentDraft);
    window.addEventListener("pagehide", saveCurrentDraft);
    window.addEventListener("attendance-draft-updated", handleExternalDraft);
    window.addEventListener("attendance-draft-cleared", handleExternalClear);

    return () => {
      form.removeEventListener("input", saveCurrentDraft);
      form.removeEventListener("change", saveCurrentDraft);
      form.removeEventListener("submit", saveCurrentDraft);
      window.removeEventListener("pagehide", saveCurrentDraft);
      window.removeEventListener("attendance-draft-updated", handleExternalDraft);
      window.removeEventListener("attendance-draft-cleared", handleExternalClear);
    };
  }, [clearDraftOnSuccess, draftKey, formId]);

  return (
    <div className="flex min-h-9 items-center justify-between gap-2 rounded-md border bg-white px-3 text-sm text-muted-foreground sm:w-auto">
      <span className="inline-flex min-w-0 items-center gap-2">
        <Clock3 className="h-4 w-4 shrink-0" />
        <span ref={labelRef} className="truncate">
          Nháp tự lưu
        </span>
      </span>
      <button
        ref={clearButtonRef}
        type="button"
        className="hidden h-7 w-7 shrink-0 place-items-center rounded-md transition hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        title="Xóa bản nháp"
        aria-label="Xóa bản nháp điểm danh"
        onClick={() => {
          const form = document.getElementById(formId);
          window.localStorage.removeItem(draftKey);
          if (form instanceof HTMLFormElement) form.reset();
          updateDraftUi(null);
          window.dispatchEvent(new CustomEvent<DraftClearedEventDetail>("attendance-draft-cleared", { detail: { draftKey, sourceFormId: formId } }));
        }}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
