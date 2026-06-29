import { useState, useEffect } from "react"
import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Filter, ChevronDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"

const ROLE_OPTIONS = [
  { value: "all", label: "All Roles" },
  { value: "admin", label: "Admin" },
  { value: "user", label: "User" },
]

export default function UserFilters({
   filters,
   onFilterChange,
   onClear,
   yearLevelOptions,
   courseOptions,
   sectionOptions,
}) {
  const [searchQuery, setSearchQuery] = useState(filters.search || "")

  useEffect(() => {
    const timer = setTimeout(() => {
      onFilterChange({ ...filters, search: searchQuery })
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery]) // eslint-disable-line

   const activeFilterCount = [
     filters.role !== "all",
     filters.year_level !== "all",
     filters.course_or_strand !== "all",
     filters.section !== "all",
     filters.search,
   ].filter(Boolean).length

   const handleRoleChange = (value) => {
     onFilterChange({ ...filters, role: value })
   }

   const handleYearChange = (value) => {
     onFilterChange({ ...filters, year_level: value })
   }

   const handleCourseChange = (value) => {
     onFilterChange({ ...filters, course_or_strand: value })
   }

   const handleSectionChange = (value) => {
     onFilterChange({ ...filters, section: value })
   }

  return (
    <div className="flex flex-col gap-3 lg:flex-row">
      {/* Search Input */}
      <div className="relative flex-1">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
        <Input
          type="text"
          placeholder="Search by name, email, or student number..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 pr-9"
        />
        {searchQuery && (
          <button
            onClick={() => {
              setSearchQuery("")
              onFilterChange({ ...filters, search: "" })
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Desktop Filters */}
      <div className="hidden lg:flex items-center gap-2">
        {/* Role Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter size={14} />
              Role
              {filters.role !== "all" && (
                <Badge variant="approved" className="text-[10px]">
                  {ROLE_OPTIONS.find(r => r.value === filters.role)?.label}
                </Badge>
              )}
              <ChevronDown size={14} className="opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuLabel>Filter by Role</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {ROLE_OPTIONS.map((opt) => (
              <DropdownMenuItem
                key={opt.value}
                onClick={() => handleRoleChange(opt.value)}
                className={filters.role === opt.value ? "bg-[var(--bg-subtle)]" : ""}
              >
                {opt.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Year Level Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              Year Level
              {filters.year_level !== "all" && (
                <Badge variant="approved" className="text-[10px]">
                  {yearLevelOptions?.find(y => y.value === filters.year_level)?.label}
                </Badge>
              )}
              <ChevronDown size={14} className="opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuLabel>Filter by Year</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {yearLevelOptions?.map((opt) => (
              <DropdownMenuItem
                key={opt.value}
                onClick={() => handleYearChange(opt.value)}
                className={filters.year_level === opt.value ? "bg-[var(--bg-subtle)]" : ""}
              >
                {opt.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

         {/* Course Filter */}
         <DropdownMenu>
           <DropdownMenuTrigger asChild>
             <Button variant="outline" className="gap-2">
               Course/Strand
               {filters.course_or_strand !== "all" && (
                 <Badge variant="approved" className="text-[10px]">
                   {courseOptions?.find(c => c.value === filters.course_or_strand)?.label}
                 </Badge>
               )}
               <ChevronDown size={14} className="opacity-50" />
             </Button>
           </DropdownMenuTrigger>
           <DropdownMenuContent align="end" className="w-44">
             <DropdownMenuLabel>Filter by Course</DropdownMenuLabel>
             <DropdownMenuSeparator />
             {courseOptions?.map((opt) => (
               <DropdownMenuItem
                 key={opt.value}
                 onClick={() => handleCourseChange(opt.value)}
                 className={filters.course_or_strand === opt.value ? "bg-[var(--bg-subtle)]" : ""}
               >
                 {opt.label}
               </DropdownMenuItem>
             ))}
           </DropdownMenuContent>
          </DropdownMenu>

         {/* Section Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              Section
              {filters.section !== "all" && (
                <Badge variant="approved" className="text-[10px]">
                  {sectionOptions?.find(s => s.value === filters.section)?.label}
                </Badge>
              )}
              <ChevronDown size={14} className="opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuLabel>Filter by Section</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {sectionOptions?.map((opt) => (
              <DropdownMenuItem
                key={opt.value}
                onClick={() => handleSectionChange(opt.value)}
                className={filters.section === opt.value ? "bg-[var(--bg-subtle)]" : ""}
              >
                {opt.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Clear Filters */}
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={onClear} className="gap-1.5 text-xs">
            <X size={14} />
            Clear all
          </Button>
        )}
      </div>

      {/* Mobile Filters (icon button) */}
      <div className="flex lg:hidden items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter size={14} />
              Filters
              {activeFilterCount > 0 && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[var(--text-primary)] text-[10px] font-bold text-[var(--bg-surface)]">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Filters</DropdownMenuLabel>
            <DropdownMenuSeparator />

            {/* Role */}
            <DropdownMenuLabel className="text-xs">Role</DropdownMenuLabel>
            {ROLE_OPTIONS.map((opt) => (
              <DropdownMenuItem
                key={opt.value}
                onClick={() => handleRoleChange(opt.value)}
                className={filters.role === opt.value ? "bg-[var(--bg-subtle)]" : ""}
              >
                <div className="flex items-center gap-2">
                  <div className={`h-3.5 w-3.5 rounded-sm border ${filters.role === opt.value ? "border-[var(--text-primary)] bg-[var(--text-primary)]" : "border-[var(--border-light)]"}`}>
                    {filters.role === opt.value && <div className="h-full w-full" />}
                  </div>
                  {opt.label}
                </div>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />

            {/* Year Level */}
            <DropdownMenuLabel className="text-xs">Year Level</DropdownMenuLabel>
            {yearLevelOptions?.map((opt) => (
              <DropdownMenuItem
                key={opt.value}
                onClick={() => handleYearChange(opt.value)}
                className={filters.year_level === opt.value ? "bg-[var(--bg-subtle)]" : ""}
              >
                <div className="flex items-center gap-2">
                  <div className={`h-3.5 w-3.5 rounded-sm border ${filters.year_level === opt.value ? "border-[var(--text-primary)] bg-[var(--text-primary)]" : "border-[var(--border-light)]"}`}>
                    {filters.year_level === opt.value && <div className="h-full w-full" />}
                  </div>
                  {opt.label}
                </div>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />

             {/* Course */}
             <DropdownMenuLabel className="text-xs">Course/Strand</DropdownMenuLabel>
             {courseOptions?.map((opt) => (
               <DropdownMenuItem
                 key={opt.value}
                 onClick={() => handleCourseChange(opt.value)}
                 className={filters.course_or_strand === opt.value ? "bg-[var(--bg-subtle)]" : ""}
               >
                 <div className="flex items-center gap-2">
                   <div className={`h-3.5 w-3.5 rounded-sm border ${filters.course_or_strand === opt.value ? "border-[var(--text-primary)] bg-[var(--text-primary)]" : "border-[var(--border-light)]"}`}>
                     {filters.course_or_strand === opt.value && <div className="h-full w-full" />}
                   </div>
                   {opt.label}
                 </div>
               </DropdownMenuItem>
             ))}
             <DropdownMenuSeparator />

             {/* Section */}
            <DropdownMenuLabel className="text-xs">Section</DropdownMenuLabel>
            {sectionOptions?.map((opt) => (
              <DropdownMenuItem
                key={opt.value}
                onClick={() => handleSectionChange(opt.value)}
                className={filters.section === opt.value ? "bg-[var(--bg-subtle)]" : ""}
              >
                <div className="flex items-center gap-2">
                  <div className={`h-3.5 w-3.5 rounded-sm border ${filters.section === opt.value ? "border-[var(--text-primary)] bg-[var(--text-primary)]" : "border-[var(--border-light)]"}`}>
                    {filters.section === opt.value && <div className="h-full w-full" />}
                  </div>
                  {opt.label}
                </div>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />

            {/* Clear All */}
            {activeFilterCount > 0 && (
              <DropdownMenuItem onClick={onClear} className="text-center text-xs text-[var(--status-red)]">
                Clear all filters
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}