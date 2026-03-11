import { useState } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandInput,
  CommandList,
  CommandItem,
  CommandEmpty,
  CommandGroup,
} from "cmdk";
import { cn } from "@/lib/utils";

interface InlineSelectProps {
  options: { value: string; label: string }[];
  value: string;
  onValueChange: (value: string) => void;
  onCreate?: (label: string) => Promise<{ value: string } | void>;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function InlineSelect({
  options,
  value,
  onValueChange,
  onCreate,
  placeholder = "Select...",
  disabled = false,
  className,
}: InlineSelectProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [creating, setCreating] = useState(false);

  const selectedOption = options.find((o) => o.value === value);

  const filtered = inputValue
    ? options.filter((o) =>
        o.label.toLowerCase().includes(inputValue.toLowerCase())
      )
    : options;

  const hasExactMatch = options.some(
    (o) => o.label.toLowerCase() === inputValue.toLowerCase()
  );

  async function handleCreate() {
    if (!onCreate || !inputValue.trim() || creating) return;
    setCreating(true);
    try {
      const result = await onCreate(inputValue.trim());
      if (result?.value) {
        onValueChange(result.value);
      }
      setInputValue("");
      setOpen(false);
    } finally {
      setCreating(false);
    }
  }

  function handleSelect(val: string) {
    onValueChange(val);
    setInputValue("");
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn("w-full justify-between font-normal", className)}
        >
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command className="w-full" shouldFilter={false}>
          <CommandInput
            placeholder="Search..."
            value={inputValue}
            onValueChange={setInputValue}
            className="h-9 border-0 border-b rounded-none focus:ring-0 px-3 text-sm"
          />
          <CommandList className="max-h-60 overflow-y-auto">
            <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
              No results found.
            </CommandEmpty>
            <CommandGroup>
              {filtered.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={() => handleSelect(option.value)}
                  className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-accent text-sm"
                >
                  <Check
                    className={cn(
                      "h-4 w-4 shrink-0",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
            {onCreate && inputValue.trim() && !hasExactMatch && (
              <CommandGroup>
                <CommandItem
                  value={`__create__${inputValue}`}
                  onSelect={handleCreate}
                  disabled={creating}
                  className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-accent text-sm text-primary"
                >
                  <Plus className="h-4 w-4 shrink-0" />
                  {creating ? "Creating..." : `Create "${inputValue}"`}
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
