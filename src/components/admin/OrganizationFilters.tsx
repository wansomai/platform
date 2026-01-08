'use client';

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, RefreshCw } from "lucide-react";
import type { FilterType } from "@/types/admin";

interface OrganizationFiltersProps {
  filter: FilterType;
  search: string;
  onFilterChange: (filter: FilterType) => void;
  onSearchChange: (search: string) => void;
  onRefresh: () => void;
  isLoading?: boolean;
}

export function OrganizationFilters({
  filter,
  search,
  onFilterChange,
  onSearchChange,
  onRefresh,
  isLoading,
}: OrganizationFiltersProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      {/* Filter Tabs */}
      <Tabs value={filter} onValueChange={(value) => onFilterChange(value as FilterType)}>
        <TabsList>
          <TabsTrigger value="all">All Organizations</TabsTrigger>
          <TabsTrigger value="pending">Pending Upgrades</TabsTrigger>
          <TabsTrigger value="upgraded">Enterprise</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Search and Refresh */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder="Search organizations..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={onRefresh}
          disabled={isLoading}
          className="shrink-0"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>
    </div>
  );
}
