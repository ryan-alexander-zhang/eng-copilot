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
      <label className="block text-[16px] font-semibold text-[#111827]" htmlFor={id}>
        {label}
      </label>
      <div className="relative mt-3">
        <input
          autoComplete={autoComplete}
          aria-label={label}
          className="h-[54px] w-full rounded-[18px] border border-[#D8DEE8] bg-white px-4 pr-12 text-[16px] text-[#111827] outline-none transition placeholder:text-[#B0B8C6] focus:border-[#4A9FD8] focus:ring-4 focus:ring-[#4A9FD8]/10"
          id={id}
          name={name}
          onChange={onChange}
          placeholder={placeholder}
          type={isVisible ? "text" : "password"}
          value={value}
        />
        <button
          aria-label={isVisible ? `Hide ${label}` : `Show ${label}`}
          className="absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-[#9AA3B2] transition hover:bg-[#F4F6FA] hover:text-[#667085]"
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
        <p className="mt-1.5 text-[14px] leading-6 text-[#9AA3B2]">{description}</p>
      ) : null}
    </div>
  );
}
