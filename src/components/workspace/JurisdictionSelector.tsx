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
  REGIONS, 
  getJurisdictionsByRegion,
  searchJurisdictions,
  type Jurisdiction 
} from "@/lib/jurisdictions";

interface JurisdictionSelectorProps {
  value?: Jurisdiction | null;
  onChange: (jurisdiction: Jurisdiction | null) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function JurisdictionSelector({ 
  value, 
  onChange, 
  disabled = false,
  placeholder = "Select jurisdiction..." 
}: JurisdictionSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

  // Filter jurisdictions based on search and region
  const filteredJurisdictions = useMemo(() => {
    let jurisdictions = JURISDICTIONS;
    
    // Filter by search query
    if (searchQuery.trim()) {
      jurisdictions = searchJurisdictions(searchQuery);
    }
    
    // Filter by region
    if (selectedRegion) {
      jurisdictions = jurisdictions.filter(j => j.region === selectedRegion);
    }
    
    return jurisdictions;
  }, [searchQuery, selectedRegion]);

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
    onChange(jurisdiction);
    setOpen(false);
    setSearchQuery("");
    setSelectedRegion(null);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onChange(null);
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">
        Jurisdiction
      </label>
      
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between h-9 px-3",
              !value && "text-muted-foreground",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            disabled={disabled}
          >
            <span className="truncate">
              {value ? value.name : placeholder}
            </span>
            
            <div className="flex items-center gap-1 ml-2">
              {value && (
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

            {/* Region Filter */}
            <div className="p-3 border-b">
              <div className="flex flex-wrap gap-1">
                <Button
                  variant={selectedRegion === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedRegion(null)}
                  className="h-6 text-xs px-2"
                >
                  All
                </Button>
                {REGIONS.map((region) => (
                  <Button
                    key={region}
                    variant={selectedRegion === region ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedRegion(region)}
                    className="h-6 text-xs px-2"
                  >
                    {region.replace(' ', '')}
                  </Button>
                ))}
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
                          isSelected={value?.id === jurisdiction.id}
                          onSelect={handleSelect}
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
}

function JurisdictionOption({ jurisdiction, isSelected, onSelect }: JurisdictionOptionProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between px-2 py-1.5 rounded-sm cursor-pointer hover:bg-gray-100 transition-colors text-sm",
        isSelected && "bg-gray-100"
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
      
      {isSelected && (
        <Check className="h-4 w-4 text-gray-600 ml-2" />
      )}
    </div>
  );
}