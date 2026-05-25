"use client";

import { useEffect } from "react";

const requiredFields = [
  { name: "parent_id", label: "Phụ huynh" },
  { name: "full_name", label: "Tên học sinh tối thiểu 2 ký tự" },
];

function getFieldValue(field: Element | RadioNodeList | null) {
  if (field instanceof HTMLInputElement || field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement) {
    return field.value.trim();
  }

  return "";
}

export function StudentRequiredFieldsAlert({ formId }: { formId: string }) {
  useEffect(() => {
    const formElement = document.getElementById(formId);
    if (!(formElement instanceof HTMLFormElement)) return;
    const form = formElement;

    function handleSubmit(event: SubmitEvent) {
      const missing = requiredFields.filter((field) => {
        const value = getFieldValue(form.elements.namedItem(field.name));
        return field.name === "full_name" ? value.length < 2 : !value;
      });

      if (missing.length === 0) return;

      event.preventDefault();
      window.alert(`Vui lòng nhập đủ thông tin bắt buộc:\n- ${missing.map((field) => field.label).join("\n- ")}`);

      const firstField = form.elements.namedItem(missing[0].name);
      if (firstField instanceof HTMLElement) firstField.focus();
    }

    form.addEventListener("submit", handleSubmit);
    return () => form.removeEventListener("submit", handleSubmit);
  }, [formId]);

  return null;
}
