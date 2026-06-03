"use client";

import { Search, X } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type FilterOption = {
  value: string;
  label: string;
};

type FilterConfig = {
  key: string;
  label: string;
  options: FilterOption[];
};

function normalizeFilter(value: string) {
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

export function ClientListFilters({
  targetId,
  searchLabel = "Tìm kiếm",
  searchPlaceholder,
  countLabel,
  filters,
  className,
  disableControlsWhenHidden = false,
}: {
  targetId: string;
  searchLabel?: string;
  searchPlaceholder?: string;
  countLabel?: string;
  filters: FilterConfig[];
  className?: string;
  disableControlsWhenHidden?: boolean;
}) {
  const searchId = useId();
  const [query, setQuery] = useState("");
  const [values, setValues] = useState<Record<string, string>>(() => Object.fromEntries(filters.map((filter) => [filter.key, "all"])));
  const [visibleCount, setVisibleCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const target = document.getElementById(targetId);
    if (!target) return;

    const normalizedQuery = normalizeFilter(query);
    const items = Array.from(target.querySelectorAll<HTMLElement>("[data-search-text]"));
    const visibleKeys = new Set<string>();
    const totalKeys = new Set<string>();

    items.forEach((item, index) => {
      const key = item.dataset.searchKey || String(index);
      totalKeys.add(key);
      const haystack = normalizeFilter(item.dataset.searchText || item.textContent || "");
      const matchesSearch = !normalizedQuery || haystack.includes(normalizedQuery);
      const matchesFilters = filters.every((filter) => {
        const value = values[filter.key] || "all";
        if (value === "all") return true;
        return item.dataset[`filter${filter.key.charAt(0).toUpperCase()}${filter.key.slice(1)}`] === value;
      });
      const visible = matchesSearch && matchesFilters;
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
  }, [disableControlsWhenHidden, filters, query, targetId, values]);

  return (
    <div className={cn("grid gap-3", className)}>
      <div className="grid gap-2">
        <Label htmlFor={searchId}>{searchLabel}</Label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id={searchId}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") event.preventDefault();
            }}
            placeholder={searchPlaceholder}
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
      {filters.map((filter) => (
        <div key={filter.key} className="grid gap-2">
          <Label htmlFor={`${searchId}-${filter.key}`}>{filter.label}</Label>
          <Select
            id={`${searchId}-${filter.key}`}
            value={values[filter.key] || "all"}
            onChange={(event) => setValues((current) => ({ ...current, [filter.key]: event.target.value }))}
          >
            {filter.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
      ))}
    </div>
  );
}
