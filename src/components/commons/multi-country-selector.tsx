"use client";

import { COUNTRIES } from "@/lib/country-picker/countries";
import { AnimatePresence, motion } from "framer-motion";
import React, { MutableRefObject, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

export interface MultiCountrySelectorProps {
  id: string;
  open: boolean;
  disabled?: boolean;
  onToggle: () => void;
  onChange: (values: string[]) => void;
  selectedValues: string[];
  placeholder?: string;
}

export default function MultiCountrySelector({
  id,
  open,
  disabled = false,
  onToggle,
  onChange,
  selectedValues,
  placeholder = "Select countries...",
}: MultiCountrySelectorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef     = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");

  // Close on outside click
  useEffect(() => {
    const mutableRef = containerRef as MutableRefObject<HTMLDivElement | null>;
    const handleClickOutside = (event: MouseEvent) => {
      if (mutableRef.current && !mutableRef.current.contains(event.target as Node) && open) {
        onToggle();
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, onToggle]);

  // Focus the input whenever the dropdown opens
  useEffect(() => {
    if (open) inputRef.current?.focus();
    else       setQuery("");
  }, [open]);

  const selectedCountries = COUNTRIES.filter((c) => selectedValues.includes(c.value));

  const toggleCountry = (value: string) => {
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter((v) => v !== value));
    } else {
      onChange([...selectedValues, value]);
    }
  };

  const removeCountry = (value: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selectedValues.filter((v) => v !== value));
  };

  const filtered = COUNTRIES.filter((c) =>
    c.title.toLowerCase().includes(query.toLowerCase())
  );

  const handleContainerClick = () => {
    if (disabled) return;
    if (!open) onToggle();
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') { onToggle(); setQuery(""); }
    // Backspace on empty query removes last selected country
    if (e.key === 'Backspace' && query === '' && selectedValues.length > 0) {
      onChange(selectedValues.slice(0, -1));
    }
  };

  return (
    <div ref={containerRef} className="relative mt-1">
      {/* Trigger / input row */}
      <div
        onClick={handleContainerClick}
        className={`
          flex flex-wrap items-center gap-1.5 min-h-[38px]
          w-full border rounded-md shadow-sm pl-3 pr-10 py-2
          cursor-text text-sm
          ${disabled ? "bg-neutral-100 pointer-events-none" : "bg-white"}
          ${open ? "ring-1 ring-teal-800 border-teal-800" : "border-gray-300"}
        `}
      >
        {/* Selected chips */}
        {selectedCountries.map((country) => (
          <span
            key={country.value}
            className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 rounded-md px-2 py-0.5 text-xs"
          >
            <img
              alt={country.value}
              src={`https://purecatamphetamine.github.io/country-flag-icons/3x2/${country.value}.svg`}
              className="inline h-3 rounded-sm"
            />
            {country.title}
            <button
              type="button"
              onClick={(e) => removeCountry(country.value, e)}
              className="hover:text-red-500 ml-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}

        {/* Inline search input */}
        <input
          ref={inputRef}
          id={id}
          type="text"
          autoComplete="off"
          disabled={disabled}
          value={query}
          onChange={(e) => { setQuery(e.target.value); if (!open) onToggle(); }}
          onKeyDown={handleKeyDown}
          placeholder={selectedCountries.length === 0 ? placeholder : "Type to search…"}
          className="flex-1 min-w-[120px] bg-transparent outline-none text-sm text-gray-800 placeholder-gray-400"
        />

        {/* Chevron */}
        {!disabled && (
          <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </span>
        )}
      </div>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.1 }}
            className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md text-base ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm overflow-y-auto"
            role="listbox"
            aria-multiselectable="true"
          >
            {filtered.length === 0 ? (
              <li className="text-gray-500 cursor-default select-none py-2 pl-3 pr-9 text-sm">
                No countries found
              </li>
            ) : (
              filtered.map((value, index) => {
                const isSelected = selectedValues.includes(value.value);
                return (
                  <li
                    key={`${id}-${index}`}
                    className={`cursor-pointer select-none relative py-2 pl-3 pr-9 flex items-center hover:bg-gray-50 transition ${isSelected ? "bg-teal-50" : ""}`}
                    role="option"
                    aria-selected={isSelected}
                    onMouseDown={(e) => e.preventDefault()} // prevent input blur
                    onClick={() => toggleCountry(value.value)}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      readOnly
                      className="h-4 w-4 text-teal-600 border-gray-300 rounded mr-2 pointer-events-none"
                    />
                    <img
                      alt={value.value}
                      src={`https://purecatamphetamine.github.io/country-flag-icons/3x2/${value.value}.svg`}
                      className="inline mr-2 h-4 rounded-sm"
                    />
                    <span className="font-normal truncate text-gray-900">{value.title}</span>
                  </li>
                );
              })
            )}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
