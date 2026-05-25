"use client";

import { Search, X } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase()
    .trim();
}

function setItemControlsDisabled(item: HTMLElement, disabled: boolean) {
  item.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | HTMLButtonElement>("input, textarea, select, button").forEach((control) => {
    control.disabled = disabled;
  });
}

export function ClientSearch({
  targetId,
  label = "Tìm kiếm",
  placeholder,
  countLabel,
  className,
  disableControlsWhenHidden = false,
}: {
  targetId: string;
  label?: string;
  placeholder?: string;
  countLabel?: string;
  className?: string;
  disableControlsWhenHidden?: boolean;
}) {
  const inputId = useId();
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const target = document.getElementById(targetId);
    if (!target) return;

    const normalizedQuery = normalizeSearch(query);
    const items = Array.from(target.querySelectorAll<HTMLElement>("[data-search-text]"));
    const visibleKeys = new Set<string>();
    const totalKeys = new Set<string>();

    items.forEach((item, index) => {
      const key = item.dataset.searchKey || String(index);
      totalKeys.add(key);
      const haystack = normalizeSearch(item.dataset.searchText || item.textContent || "");
      const visible = !normalizedQuery || haystack.includes(normalizedQuery);
      item.hidden = !visible;
      if (disableControlsWhenHidden) setItemControlsDisabled(item, !visible);
      if (visible) visibleKeys.add(key);
    });

    const frame = window.requestAnimationFrame(() => {
      setVisibleCount(visibleKeys.size);
      setTotalCount(totalKeys.size);
    });

    return () => {
      window.cancelAnimationFrame(frame);
      if (!disableControlsWhenHidden) return;
      items.forEach((item) => setItemControlsDisabled(item, false));
    };
  }, [disableControlsWhenHidden, query, targetId]);

  return (
    <div className={cn("grid gap-2", className)}>
      <Label htmlFor={inputId}>{label}</Label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={inputId}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.preventDefault();
          }}
          placeholder={placeholder}
          className="pl-9 pr-10"
          type="search"
        />
        {query ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-0 top-1/2 h-10 w-10 -translate-y-1/2"
            onClick={() => setQuery("")}
            aria-label="Xóa tìm kiếm"
          >
            <X className="h-4 w-4" />
          </Button>
        ) : null}
      </div>
      {countLabel ? (
        <p className="text-sm text-muted-foreground">
          Hiển thị {visibleCount}/{totalCount} {countLabel}
        </p>
      ) : null}
    </div>
  );
}
