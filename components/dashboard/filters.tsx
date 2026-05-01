"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar, ChevronDown } from "lucide-react";
import { programs, counties } from "@/lib/mock-data";

interface FiltersProps {
  selectedProgram: string;
  setSelectedProgram: (value: string) => void;
  selectedCounty: string;
  setSelectedCounty: (value: string) => void;
}

const dateRanges = [
  "Last 30 days",
  "Last 3 months",
  "Last 6 months",
  "Last 12 months",
  "All time",
];

export function Filters({
  selectedProgram,
  setSelectedProgram,
  selectedCounty,
  setSelectedCounty,
}: FiltersProps) {
  const [selectedDateRange, setSelectedDateRange] = useState("Last 12 months");
  const [showDateMenu, setShowDateMenu] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select value={selectedProgram} onValueChange={setSelectedProgram}>
        <SelectTrigger className="w-[160px] bg-white border-gray-200 text-gray-700 rounded-lg shadow-sm hover:border-gray-300 focus:ring-emerald-500">
          <SelectValue placeholder="All Programs" />
        </SelectTrigger>
        <SelectContent className="bg-white border-gray-200 shadow-lg">
          {programs.map((program) => (
            <SelectItem
              key={program}
              value={program}
              className="text-gray-700 hover:bg-gray-50"
            >
              {program}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={selectedCounty} onValueChange={setSelectedCounty}>
        <SelectTrigger className="w-[160px] bg-white border-gray-200 text-gray-700 rounded-lg shadow-sm hover:border-gray-300 focus:ring-emerald-500">
          <SelectValue placeholder="All Counties" />
        </SelectTrigger>
        <SelectContent className="bg-white border-gray-200 shadow-lg">
          {counties.map((county) => (
            <SelectItem
              key={county}
              value={county}
              className="text-gray-700 hover:bg-gray-50"
            >
              {county}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Date range button with dropdown */}
      <div className="relative">
        <Button
          variant="outline"
          className="gap-2 border-gray-200 bg-white text-gray-700 hover:bg-gray-50 rounded-lg shadow-sm"
          onClick={() => setShowDateMenu((prev) => !prev)}
        >
          <Calendar className="h-4 w-4 text-gray-500" />
          {selectedDateRange}
          <ChevronDown className="h-3 w-3 text-gray-400" />
        </Button>

        {showDateMenu && (
          <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
            {dateRanges.map((range) => (
              <button
                key={range}
                onClick={() => {
                  setSelectedDateRange(range);
                  setShowDateMenu(false);
                }}
                className={`w-full text-left px-4 py-2 text-sm transition-colors first:rounded-t-lg last:rounded-b-lg ${
                  selectedDateRange === range
                    ? "bg-emerald-50 text-emerald-700 font-medium"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
