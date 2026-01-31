import { useState, useEffect } from "react";
import { Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const themes = [
  { name: "Red", value: "red", color: "oklch(0.55 0.22 25)" },
  { name: "Blue", value: "blue", color: "oklch(0.55 0.20 250)" },
  { name: "Green", value: "green", color: "oklch(0.55 0.20 145)" },
  { name: "Purple", value: "purple", color: "oklch(0.55 0.20 300)" },
  { name: "Teal", value: "teal", color: "oklch(0.55 0.18 190)" },
  { name: "Orange", value: "orange", color: "oklch(0.60 0.20 45)" },
];

export function ThemeSelector() {
  const [currentTheme, setCurrentTheme] = useState<string>("red");

  useEffect(() => {
    // Load theme from localStorage
    const savedTheme = localStorage.getItem("app-theme") || "red";
    setCurrentTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  const changeTheme = (theme: string) => {
    setCurrentTheme(theme);
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("app-theme", theme);
  };

  const currentThemeData = themes.find((t) => t.value === currentTheme);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" title="Change theme color">
          <Palette className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <div className="px-2 py-1.5 text-sm font-semibold">Theme Color</div>
        {themes.map((theme) => (
          <DropdownMenuItem
            key={theme.value}
            onClick={() => changeTheme(theme.value)}
            className="flex items-center gap-3 cursor-pointer"
          >
            <div
              className="w-4 h-4 rounded-full border border-border"
              style={{ backgroundColor: theme.color }}
            />
            <span>{theme.name}</span>
            {currentTheme === theme.value && (
              <span className="ml-auto text-xs text-muted-foreground">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
