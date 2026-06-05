"use client";

import { Eye, EyeOff } from "lucide-react";
import { type ChangeEventHandler, useState } from "react";

export function PasswordField({
  autoComplete,
  description,
  id,
  label,
  name,
  onChange,
  placeholder,
  value,
}: {
  autoComplete?: string;
  description?: string;
  id: string;
  label: string;
  name: string;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  placeholder: string;
  value?: string;
}) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div>
      <label className="block text-[16px] font-semibold text-[var(--foreground)]" htmlFor={id}>
        {label}
      </label>
      <div className="relative mt-3">
        <input
          autoComplete={autoComplete}
          aria-label={label}
          className="field-input h-[54px] rounded-[18px] px-4 pr-12 text-[16px] placeholder:text-[var(--muted)]"
          id={id}
          name={name}
          onChange={onChange}
          placeholder={placeholder}
          type={isVisible ? "text" : "password"}
          value={value}
        />
        <button
          aria-label={isVisible ? `Hide ${label}` : `Show ${label}`}
          className="icon-ghost-button text-muted absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full"
          onClick={() => setIsVisible((visible) => !visible)}
          type="button"
        >
          {isVisible ? (
            <EyeOff className="h-4 w-4" strokeWidth={2} />
          ) : (
            <Eye className="h-4 w-4" strokeWidth={2} />
          )}
        </button>
      </div>
      {description ? (
        <p className="text-muted mt-1.5 text-[14px] leading-6">{description}</p>
      ) : null}
    </div>
  );
}
