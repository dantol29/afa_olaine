"use client";

import { useId, useState, type KeyboardEvent, type ReactNode } from "react";

import { matchSuggestions } from "@/lib/admin-suggestions";
import { cn } from "@/lib/utils";

const INPUT_CLASS = "mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-club-navy outline-none focus:border-club-red";

/** A text field that lists values used before as the admin types. Picking one fills the field; any other text is kept
 *  as typed, so a new value needs no extra step. Arrow keys move through the list, Enter picks, Escape closes. */
export function SuggestInput({
  name,
  label,
  value,
  onChange,
  options,
  iconFor,
  required,
  placeholder,
  className,
}: {
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  /** A small picture before each suggestion, such as a club logo. */
  iconFor?: (option: string) => ReactNode;
  required?: boolean;
  placeholder?: string;
  className?: string;
}) {
  const inputId = useId();
  const listId = `${inputId}-list`;
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const suggestions = isOpen ? matchSuggestions(options, value, (option) => option) : [];
  const isListShown = suggestions.length > 0;

  function pick(option: string) {
    onChange(option);
    setIsOpen(false);
    setActiveIndex(-1);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        return;
      }
      const step = event.key === "ArrowDown" ? 1 : -1;
      setActiveIndex((index) => (suggestions.length === 0 ? -1 : (index + step + suggestions.length) % suggestions.length));
    } else if (event.key === "Enter" && isListShown && activeIndex >= 0) {
      // Picks the highlighted value instead of submitting the form.
      event.preventDefault();
      pick(suggestions[activeIndex]);
    } else if (event.key === "Escape" && isOpen) {
      event.preventDefault();
      setIsOpen(false);
    }
  }

  return (
    <div className={cn("relative text-sm font-semibold text-club-navy", className)}>
      <label htmlFor={inputId}>{label}</label>
      <input
        id={inputId}
        type="text"
        name={name}
        value={value}
        required={required}
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-expanded={isListShown}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={isListShown && activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
        onChange={(event) => {
          onChange(event.target.value);
          setIsOpen(true);
          setActiveIndex(-1);
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
        onKeyDown={handleKeyDown}
        className={INPUT_CLASS}
      />
      {isListShown && (
        <ul id={listId} role="listbox" aria-label={label} className="absolute inset-x-0 top-full z-30 mt-1 max-h-72 overflow-y-auto border border-slate-200 bg-white py-1 shadow-lg">
          {suggestions.map((option, index) => (
            <li
              key={option}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={index === activeIndex}
              // Keeps the focus in the field, so the list does not close before the click lands.
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => pick(option)}
              onMouseEnter={() => setActiveIndex(index)}
              className={cn(
                "flex cursor-pointer items-center gap-2 px-3 py-2 text-sm font-normal text-club-navy",
                index === activeIndex && "bg-slate-100",
              )}
            >
              {iconFor?.(option)}
              <span className="min-w-0 truncate">{option}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
