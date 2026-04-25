"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

export function PasswordField({
  description,
  id,
  label,
  name,
  placeholder,
}: {
  description?: string;
  id: string;
  label: string;
  name: string;
  placeholder: string;
}) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div>
      <label className="block text-[16px] font-semibold text-[#111827]" htmlFor={id}>
        {label}
      </label>
      <div className="relative mt-3">
        <input
          aria-label={label}
          className="h-12 w-full rounded-[14px] border border-[#D8DEE8] bg-white px-4 pr-12 text-[16px] text-[#111827] outline-none transition placeholder:text-[#B0B8C6] focus:border-[#4A9FD8] focus:ring-4 focus:ring-[#4A9FD8]/10"
          id={id}
          name={name}
          placeholder={placeholder}
          type={isVisible ? "text" : "password"}
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
        <p className="mt-2 text-[14px] leading-6 text-[#9AA3B2]">{description}</p>
      ) : null}
    </div>
  );
}

export function DeleteConfirmationForm({
  action,
}: {
  action: (formData: FormData) => Promise<void>;
}) {
  const [confirmation, setConfirmation] = useState("");
  const isEnabled = confirmation.trim() === "DELETE";

  return (
    <form action={action} className="mt-7" id="delete-all-data-form">
      <label className="block text-[18px] font-medium text-[#111827]" htmlFor="deleteConfirmation">
        Type DELETE to confirm
      </label>
      <div className="mt-4 flex items-center gap-5">
        <input
          aria-label="Delete confirmation"
          className="h-12 flex-1 rounded-[14px] border border-[#D8DEE8] bg-white px-4 text-[16px] text-[#111827] outline-none transition placeholder:text-[#B0B8C6] focus:border-[#EF4444] focus:ring-4 focus:ring-[#EF4444]/10"
          id="deleteConfirmation"
          name="deleteConfirmation"
          onChange={(event) => setConfirmation(event.target.value)}
          placeholder="DELETE"
          type="text"
          value={confirmation}
        />
        <button
          className="inline-flex h-12 min-w-[250px] items-center justify-center rounded-[12px] px-6 text-[18px] font-semibold transition disabled:cursor-not-allowed disabled:bg-[#FDE8E8] disabled:text-[#F19999] enabled:bg-[#EF4444] enabled:text-white enabled:hover:bg-[#DC2626]"
          disabled={!isEnabled}
          type="submit"
        >
          Permanently delete all data
        </button>
      </div>
    </form>
  );
}
