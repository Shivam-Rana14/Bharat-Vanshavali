"use client"

import * as React from "react"
import { Check, ChevronsUpDown, MapPin, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"

interface LocationInputProps {
    value: string
    onChange: (value: string) => void
    placeholder?: string
    className?: string
    disabled?: boolean
}

interface NominatimResult {
    place_id: number
    display_name: string
    lat: string
    lon: string
}

export function LocationInput({
    value,
    onChange,
    placeholder = "Search location...",
    className,
    disabled
}: LocationInputProps) {
    const [open, setOpen] = React.useState(false)
    const [query, setQuery] = React.useState(value)
    const [suggestions, setSuggestions] = React.useState<NominatimResult[]>([])
    const [loading, setLoading] = React.useState(false)

    // Update internal query when external value changes
    React.useEffect(() => {
        setQuery(value)
    }, [value])

    // Debounced search
    React.useEffect(() => {
        if (!open) return // Don't search if closed (optional, but saves requests)

        const timer = setTimeout(async () => {
            if (query.length < 3) {
                setSuggestions([])
                return
            }

            // If the query matches the current value exactly, it might be what the user selected.
            // We can still search to show alternatives, or skip. Let's search to be safe but maybe skip if identical?
            // Actually, continuous searching is fine for UX as long as we debounce.

            setLoading(true)
            try {
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
                        query
                    )}&addressdetails=1&limit=5`
                )
                if (response.ok) {
                    const data = await response.json()
                    setSuggestions(data)
                }
            } catch (error) {
                console.error("Failed to fetch locations:", error)
            } finally {
                setLoading(false)
            }
        }, 500) // 500ms debounce

        return () => clearTimeout(timer)
    }, [query, open])

    return (
        <div className={cn("relative", className)}>
            <div className="relative">
                <Input
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value)
                        onChange(e.target.value) // Allow custom values immediately
                        setOpen(true)
                    }}
                    onFocus={() => setOpen(true)}
                    placeholder={placeholder}
                    disabled={disabled}
                    className="pr-10"
                />
                <div className="absolute right-3 top-2.5 text-muted-foreground">
                    {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <MapPin className="h-4 w-4 opacity-50" />
                    )}
                </div>
            </div>

            {open && suggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white rounded-md border shadow-md max-h-60 overflow-auto">
                    <ul className="py-1">
                        {suggestions.map((item) => (
                            <li
                                key={item.place_id}
                                className="px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer flex items-start gap-2"
                                onClick={() => {
                                    onChange(item.display_name)
                                    setQuery(item.display_name)
                                    setOpen(false)
                                }}
                            >
                                <MapPin className="h-4 w-4 mt-0.5 text-gray-400 shrink-0" />
                                <span className="line-clamp-2">{item.display_name}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Click outside handler could be added here, or we rely on onBlur. 
          However, onBlur on input closes the list before onClick on list item fires.
          A common trick is using onMouseDown on the list item to prevent blur, 
          or using a proper Popover/Combobox component. 
          
          For simplicity and robustness, let's use a simple overlay or just handle blur carefully.
          Actually, the simplest way for a custom dropdown is to use a backdrop or listen to clicks.
      */}
            {open && (
                <div
                    className="fixed inset-0 z-40 bg-transparent"
                    onClick={() => setOpen(false)}
                    aria-hidden="true"
                />
            )}
            {/* Re-render the dropdown above the backdrop */}
            {open && suggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white rounded-md border shadow-md max-h-60 overflow-auto">
                    <ul className="py-1">
                        {suggestions.map((item) => (
                            <li
                                key={item.place_id}
                                className="px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer flex items-start gap-2"
                                onMouseDown={(e) => {
                                    // Prevent input blur
                                    e.preventDefault()
                                }}
                                onClick={() => {
                                    onChange(item.display_name)
                                    setQuery(item.display_name)
                                    setOpen(false)
                                }}
                            >
                                <MapPin className="h-4 w-4 mt-0.5 text-gray-400 shrink-0" />
                                <span className="line-clamp-2">{item.display_name}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    )
}
