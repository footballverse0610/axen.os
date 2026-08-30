"use client";

import { useState } from "react";

const fieldClass =
  "rounded-xl border border-border bg-surface-muted px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20";

/**
 * 「自由入力+候補選択」のカテゴリー入力。
 * テキスト入力欄に加えて候補チップを表示し、タップすると入力欄に反映される。
 * 候補にない値も自由に入力できる(name属性を持つ通常のtext inputのため、
 * Server Actionの<form action={...}>にそのままFormData経由で送られる)。
 */
export function CategoryPicker({
  id,
  name,
  defaultValue,
  suggestions,
  placeholder,
  required,
}: {
  id: string;
  name: string;
  defaultValue?: string;
  suggestions: readonly string[];
  placeholder?: string;
  required?: boolean;
}) {
  const [value, setValue] = useState(defaultValue ?? "");

  return (
    <div className="flex flex-col gap-2">
      <input
        id={id}
        name={name}
        type="text"
        inputMode="text"
        required={required}
        maxLength={50}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className={fieldClass}
      />
      <div className="flex flex-wrap gap-1.5">
        {suggestions.map((option) => {
          const isSelected = value === option;
          return (
            <button
              key={option}
              type="button"
              onClick={() => setValue(option)}
              aria-pressed={isSelected}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                isSelected
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-surface-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}
