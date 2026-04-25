"use client";

import Link from "next/link";
import { ChevronDown, LogOut, Settings } from "lucide-react";
import { signOut } from "next-auth/react";
import { useEffect, useRef, useState } from "react";

export function UserMenu({ userInitial }: { userInitial: string }) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        aria-expanded={isOpen}
        aria-label="Open user menu"
        className="inline-flex items-center gap-2 rounded-full px-1 py-1 text-[#4B5563] transition hover:bg-[#F3F4F6]"
        onClick={() => setIsOpen((open) => !open)}
        type="button"
      >
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#F3F4F6] text-[16px] font-medium text-[#374151]">
          {userInitial}
        </span>
        <ChevronDown className="h-4 w-4" strokeWidth={2} />
      </button>

      {isOpen ? (
        <div className="absolute right-0 top-[58px] z-30 min-w-[180px] rounded-[16px] border border-[#E5E7EB] bg-white p-1.5 shadow-[0_18px_50px_rgba(15,23,42,0.14)]">
          <Link
            className="flex items-center gap-3 rounded-[12px] px-3 py-2.5 text-[14px] font-medium text-[#374151] transition hover:bg-[#F8FAFC]"
            href="/settings"
            onClick={() => setIsOpen(false)}
          >
            <Settings className="h-4 w-4 text-[#667085]" strokeWidth={2} />
            Settings
          </Link>
          <button
            className="flex w-full items-center gap-3 rounded-[12px] px-3 py-2.5 text-left text-[14px] font-medium text-[#E14D45] transition hover:bg-[#FFF5F5]"
            onClick={() => {
              setIsOpen(false);
              void signOut({
                callbackUrl: "/sign-in",
              });
            }}
            type="button"
          >
            <LogOut className="h-4 w-4" strokeWidth={2} />
            Logout
          </button>
        </div>
      ) : null}
    </div>
  );
}
