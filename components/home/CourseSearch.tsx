"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/Button";

const SUGGESTIONS = [
  "FPO Governance",
  "Digital Skills",
  "FPC Compliance",
  "Application Training",
];

export function CourseSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const handleSearch = (searchQuery: string) => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      router.push("/courses");
      return;
    }
    router.push(`/courses?search=${encodeURIComponent(trimmed)}`);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleSearch(query);
  };

  const handleChipClick = (suggestion: string) => {
    setQuery(suggestion);
    handleSearch(suggestion);
  };

  return (
    <section aria-label="Course Search" className="py-8 bg-white border-b border-slate-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <form onSubmit={handleSubmit} className="w-full">
          <label
            htmlFor="home-course-search"
            className="block text-sm font-semibold text-slate-800 mb-2"
          >
            What would you like to learn?
          </label>
          <div className="relative flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="h-5 w-5" aria-hidden="true" />
              </div>
              <input
                id="home-course-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search courses, skills, or topics (e.g. Governance, Accounting)..."
                className="w-full pl-11 pr-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#3E9BDB] focus:border-transparent transition-all shadow-xs"
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="px-6 py-3 h-auto whitespace-nowrap text-sm font-semibold"
            >
              Search
            </Button>
          </div>
        </form>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-slate-500 mr-1">Popular searches:</span>
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => handleChipClick(suggestion)}
              aria-label={`Search for ${suggestion}`}
              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-100 hover:bg-[#EAF4FC] hover:text-[#123E62] hover:border-[#3E9BDB]/40 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
