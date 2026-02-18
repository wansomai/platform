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
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mutableRef = ref as MutableRefObject<HTMLDivElement | null>;

    const handleClickOutside = (event: any) => {
      if (
        mutableRef.current &&
        !mutableRef.current.contains(event.target) &&
        open
      ) {
        onToggle();
        setQuery("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [ref, open, onToggle]);

  const [query, setQuery] = useState("");

  const selectedCountries = COUNTRIES.filter((c) =>
    selectedValues.includes(c.value)
  );

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

  return (
    <div ref={ref}>
      <div className="mt-1 relative">
        <button
          type="button"
          className={`${
            disabled ? "bg-neutral-100" : "bg-white"
          } relative w-full border border-gray-300 rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-teal-800 focus:border-teal-800 sm:text-sm min-h-[38px]`}
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={onToggle}
          disabled={disabled}
        >
          {selectedCountries.length === 0 ? (
            <span className="text-gray-400">{placeholder}</span>
          ) : (
            <span className="flex flex-wrap gap-1.5">
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
            </span>
          )}
          <span
            className={`absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none ${
              disabled ? "hidden" : ""
            }`}
          >
            <svg
              className="h-5 w-5 text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </span>
        </button>

        <AnimatePresence>
          {open && (
            <motion.ul
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
              className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-80 rounded-md text-base ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm"
              tabIndex={-1}
              role="listbox"
              aria-labelledby="listbox-label"
              aria-multiselectable="true"
            >
              <div className="sticky top-0 z-10 bg-white">
                <li className="text-gray-900 cursor-default select-none relative py-2 px-3">
                  <input
                    type="search"
                    name="search"
                    autoComplete="off"
                    className="focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="Search a country"
                    onChange={(e) => setQuery(e.target.value)}
                    value={query}
                  />
                </li>
                <hr />
              </div>

              <div className="max-h-64 scrollbar scrollbar-track-gray-100 scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-600 scrollbar-thumb-rounded scrollbar-thin overflow-y-scroll">
                {COUNTRIES.filter((country) =>
                  country.title.toLowerCase().startsWith(query.toLowerCase())
                ).length === 0 ? (
                  <li className="text-gray-900 cursor-default select-none relative py-2 pl-3 pr-9">
                    No countries found
                  </li>
                ) : (
                  COUNTRIES.filter((country) =>
                    country.title.toLowerCase().startsWith(query.toLowerCase())
                  ).map((value, index) => {
                    const isSelected = selectedValues.includes(value.value);
                    return (
                      <li
                        key={`${id}-${index}`}
                        className="text-gray-900 cursor-default select-none relative py-2 pl-3 pr-9 flex items-center hover:bg-gray-50 transition"
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => toggleCountry(value.value)}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          readOnly
                          className="h-4 w-4 text-green-600 border-gray-300 rounded mr-2 pointer-events-none"
                        />
                        <img
                          alt={value.value}
                          src={`https://purecatamphetamine.github.io/country-flag-icons/3x2/${value.value}.svg`}
                          className="inline mr-2 h-4 rounded-sm"
                        />
                        <span className="font-normal truncate">
                          {value.title}
                        </span>
                      </li>
                    );
                  })
                )}
              </div>
            </motion.ul>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
