// src/components/workspace/JurisdictionSelector.tsx
"use client";

import React, { useState, useMemo } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  JURISDICTIONS,
  searchJurisdictions,
} from "@/lib/jurisdictions";
import { Jurisdiction } from "@/types";

interface JurisdictionSelectorProps {
  value?: Jurisdiction | null;
  values?: Jurisdiction[];  // For multi-select mode
  onChange?: (jurisdiction: Jurisdiction | null) => void;  // For single-select mode
  onChangeMulti?: (jurisdictions: Jurisdiction[]) => void;  // For multi-select mode
  disabled?: boolean;
  placeholder?: string;
  multiSelect?: boolean;  // Enable multi-select mode
  maxSelections?: number;  // Optional limit on number of selections
  inline?: boolean;  // Render inline without Popover wrapper
}

export function JurisdictionSelector({
  value,
  values = [],
  onChange,
  onChangeMulti,
  disabled = false,
  placeholder = "Select jurisdiction...",
  multiSelect = false,
  maxSelections,
  inline = false
}: JurisdictionSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Use the appropriate value(s) based on mode
  const selectedJurisdictions = multiSelect ? values : (value ? [value] : []);

  // Filter jurisdictions based on search
  const filteredJurisdictions = useMemo(() => {
    // Filter by search query
    if (searchQuery.trim()) {
      return searchJurisdictions(searchQuery);
    }

    return JURISDICTIONS;
  }, [searchQuery]);

  // Group jurisdictions by region
  const jurisdictionsByRegion = useMemo(() => {
    const grouped: Record<string, Jurisdiction[]> = {};
    
    filteredJurisdictions.forEach(jurisdiction => {
      if (!grouped[jurisdiction.region]) {
        grouped[jurisdiction.region] = [];
      }
      grouped[jurisdiction.region].push(jurisdiction);
    });
    
    return grouped;
  }, [filteredJurisdictions]);

  const handleSelect = (jurisdiction: Jurisdiction) => {
    if (multiSelect) {
      // Multi-select mode
      const isSelected = selectedJurisdictions.some(j => j.id === jurisdiction.id);
      let newSelections: Jurisdiction[];

      if (isSelected) {
        // Remove from selection
        newSelections = selectedJurisdictions.filter(j => j.id !== jurisdiction.id);
      } else {
        // Add to selection (check max limit)
        if (maxSelections && selectedJurisdictions.length >= maxSelections) {
          return; // Don't add if limit reached
        }
        newSelections = [...selectedJurisdictions, jurisdiction];
      }

      onChangeMulti?.(newSelections);
      // Don't close popover in multi-select mode
    } else {
      // Single-select mode
      onChange?.(jurisdiction);
      setOpen(false);
      setSearchQuery("");
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (multiSelect) {
      onChangeMulti?.([]);
    } else {
      onChange?.(null);
    }
  };

  const handleRemoveJurisdiction = (jurisdictionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (multiSelect) {
      const newSelections = selectedJurisdictions.filter(j => j.id !== jurisdictionId);
      onChangeMulti?.(newSelections);
    }
  };

  // Inline mode: render just the content without Popover wrapper
  if (inline) {
    return (
      <div className="space-y-3">
        {/* Multi-select: Show selected jurisdictions as badges */}
        {multiSelect && selectedJurisdictions.length > 0 && (
          <div className="flex flex-wrap gap-1 p-2 border rounded-md bg-gray-50">
            {selectedJurisdictions.map((jurisdiction) => (
              <div
                key={jurisdiction.id}
                className="inline-flex items-center gap-1 px-2 py-1 bg-white border rounded-md text-sm"
              >
                <span className="truncate max-w-[200px]">{jurisdiction.name}</span>
                <button
                  onClick={(e) => handleRemoveJurisdiction(jurisdiction.id, e)}
                  className="hover:bg-gray-100 rounded-sm p-0.5"
                  disabled={disabled}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col h-[350px]">
          {/* Search Bar */}
          <div className="pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search jurisdictions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-8"
              />
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="pr-3">
              {/* Jurisdictions by Region */}
              {Object.entries(jurisdictionsByRegion).map(([region, jurisdictions]) => (
                <div key={region} className="mb-3">
                  <div className="px-2 py-1 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    {region}
                  </div>
                  <div className="space-y-0.5">
                    {jurisdictions.map((jurisdiction) => (
                      <JurisdictionOption
                        key={jurisdiction.id}
                        jurisdiction={jurisdiction}
                        isSelected={selectedJurisdictions.some(j => j.id === jurisdiction.id)}
                        onSelect={handleSelect}
                        multiSelect={multiSelect}
                      />
                    ))}
                  </div>
                </div>
              ))}

              {/* No Results */}
              {filteredJurisdictions.length === 0 && (
                <div className="py-8 text-center text-gray-500">
                  <p className="text-sm">No jurisdictions found</p>
                  <p className="text-xs mt-1">Try adjusting your search</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    );
  }

  // Full mode with Popover wrapper
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">
        {multiSelect ? "Jurisdictions" : "Jurisdiction"}
        {multiSelect && maxSelections && (
          <span className="text-xs text-gray-500 ml-2">
            ({selectedJurisdictions.length}/{maxSelections} selected)
          </span>
        )}
      </label>

      {/* Multi-select: Show selected jurisdictions as badges */}
      {multiSelect && selectedJurisdictions.length > 0 && (
        <div className="flex flex-wrap gap-1 p-2 border rounded-md bg-gray-50">
          {selectedJurisdictions.map((jurisdiction) => (
            <div
              key={jurisdiction.id}
              className="inline-flex items-center gap-1 px-2 py-1 bg-white border rounded-md text-sm"
            >
              <span className="truncate max-w-[200px]">{jurisdiction.name}</span>
              <button
                onClick={(e) => handleRemoveJurisdiction(jurisdiction.id, e)}
                className="hover:bg-gray-100 rounded-sm p-0.5"
                disabled={disabled}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between h-9 px-3",
              !multiSelect && !value && "text-muted-foreground",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            disabled={disabled}
          >
            <span className="truncate">
              {!multiSelect && value
                ? value.name
                : multiSelect && selectedJurisdictions.length > 0
                ? `${selectedJurisdictions.length} selected`
                : placeholder}
            </span>

            <div className="flex items-center gap-1 ml-2">
              {((multiSelect && selectedJurisdictions.length > 0) || (!multiSelect && value)) && (
                <div
                  className="h-4 w-4 p-0 hover:bg-gray-100 rounded-sm flex items-center justify-center cursor-pointer"
                  onClick={handleClear}
                >
                  <X className="h-3 w-3" />
                </div>
              )}
              <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
            </div>
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-[320px] p-0" align="start">
          <div className="flex flex-col h-[400px]">
            {/* Search Bar */}
            <div className="p-3 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search jurisdictions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-8"
                />
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-1">
                {/* Jurisdictions by Region */}
                {Object.entries(jurisdictionsByRegion).map(([region, jurisdictions]) => (
                  <div key={region} className="mb-3">
                    <div className="px-2 py-1 text-xs font-medium text-gray-500 uppercase tracking-wide">
                      {region}
                    </div>
                    <div className="space-y-0.5">
                      {jurisdictions.map((jurisdiction) => (
                        <JurisdictionOption
                          key={jurisdiction.id}
                          jurisdiction={jurisdiction}
                          isSelected={selectedJurisdictions.some(j => j.id === jurisdiction.id)}
                          onSelect={handleSelect}
                          multiSelect={multiSelect}
                        />
                      ))}
                    </div>
                  </div>
                ))}

                {/* No Results */}
                {filteredJurisdictions.length === 0 && (
                  <div className="py-8 text-center text-gray-500">
                    <p className="text-sm">No jurisdictions found</p>
                    <p className="text-xs mt-1">Try adjusting your search or filter</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </PopoverContent>
      </Popover>

      {/* Current Selection Info */}
      {value && (
        <div className="text-xs text-gray-500 mt-1">
          {value.country}
          {value.state && ` • ${value.state}`}
          {' • '}
          <span className="capitalize">{value.legalSystem.replace('-', ' ')}</span>
        </div>
      )}
    </div>
  );
}

// Individual jurisdiction option component
interface JurisdictionOptionProps {
  jurisdiction: Jurisdiction;
  isSelected: boolean;
  onSelect: (jurisdiction: Jurisdiction) => void;
  multiSelect?: boolean;
}

function JurisdictionOption({ jurisdiction, isSelected, onSelect, multiSelect }: JurisdictionOptionProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between px-2 py-1.5 rounded-sm cursor-pointer hover:bg-gray-100 transition-colors text-sm",
        isSelected && !multiSelect && "bg-gray-100"
      )}
      onClick={() => onSelect(jurisdiction)}
    >
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{jurisdiction.name}</div>
        <div className="text-xs text-gray-500 truncate">
          {jurisdiction.legalSystem.replace('-', ' ')} • {jurisdiction.citationStyle}
          {jurisdiction.state && ` • ${jurisdiction.state}`}
        </div>
      </div>

      {multiSelect ? (
        <div className="ml-2">
          <div className={cn(
            "h-4 w-4 border rounded flex items-center justify-center",
            isSelected ? "bg-primary border-primary" : "border-gray-300"
          )}>
            {isSelected && <Check className="h-3 w-3 text-white" />}
          </div>
        </div>
      ) : (
        isSelected && <Check className="h-4 w-4 text-gray-600 ml-2" />
      )}
    </div>
  );
}