"use client";

interface FilterCheckboxProps {
  checked: boolean;
  onChange: () => void;
  children: React.ReactNode;
}

export default function FilterCheckbox({ checked, onChange, children }: FilterCheckboxProps) {
  return (
    <label className="relative flex cursor-pointer items-center gap-2.5 text-sm text-zinc-300 hover:text-white">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="peer sr-only focus:outline-none"
        aria-hidden
      />
      <span className="block h-4 w-4 shrink-0 rounded border-2 border-zinc-500 bg-zinc-800/80 transition-colors peer-focus:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-attensi peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-zinc-900 peer-checked:border-attensi peer-checked:bg-attensi" />
      <svg
        className="pointer-events-none absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 p-0.5 text-white opacity-0 peer-checked:opacity-100"
        viewBox="0 0 12 10"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M1 5l3 3 7-7" />
      </svg>
      <span>{children}</span>
    </label>
  );
}
