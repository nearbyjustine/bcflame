'use client';

import { useState, useEffect } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

// Popular Google Fonts list
const GOOGLE_FONTS = [
  { family: 'Roboto', category: 'sans-serif' },
  { family: 'Open Sans', category: 'sans-serif' },
  { family: 'Montserrat', category: 'sans-serif' },
  { family: 'Lato', category: 'sans-serif' },
  { family: 'Poppins', category: 'sans-serif' },
  { family: 'Inter', category: 'sans-serif' },
  { family: 'Raleway', category: 'sans-serif' },
  { family: 'Nunito', category: 'sans-serif' },
  { family: 'Work Sans', category: 'sans-serif' },
  { family: 'Playfair Display', category: 'serif' },
  { family: 'Merriweather', category: 'serif' },
  { family: 'Lora', category: 'serif' },
  { family: 'PT Serif', category: 'serif' },
  { family: 'Source Serif Pro', category: 'serif' },
  { family: 'Crimson Text', category: 'serif' },
  { family: 'Bebas Neue', category: 'display' },
  { family: 'Righteous', category: 'display' },
  { family: 'Abril Fatface', category: 'display' },
  { family: 'Lobster', category: 'display' },
  { family: 'Pacifico', category: 'script' },
  { family: 'Dancing Script', category: 'script' },
  { family: 'Great Vibes', category: 'script' },
  { family: 'Satisfy', category: 'script' },
];

interface FontSelectorProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function FontSelector({ value, onChange, placeholder = 'Select font...', disabled }: FontSelectorProps) {
  const [open, setOpen] = useState(false);
  const [fontsLoaded, setFontsLoaded] = useState(false);

  // Load Google Fonts dynamically
  useEffect(() => {
    // Create link element for Google Fonts
    const fontFamilies = GOOGLE_FONTS.map((f) => f.family.replace(/\s/g, '+'))
.join('&family=');
    const link = document.createElement('link');
    link.href = `https://fonts.googleapis.com/css2?${fontFamilies.split('&').map(f => `family=${f}`).join('&')}&display=swap`;
    link.rel = 'stylesheet';

    link.onload = () => setFontsLoaded(true);
    document.head.appendChild(link);

    return () => {
      document.head.removeChild(link);
    };
  }, []);

  const getCurrentFontDisplay = () => {
    if (!value) return placeholder;

    // Extract font family name from CSS value (e.g., "'Roboto', sans-serif" -> "Roboto")
    const match = value.match(/['"](.*?)['"]|^([^,]+)/);
    return match ? (match[1] || match[2] || value).trim() : value;
  };

  const formatFontValue = (fontFamily: string, fallback: string) => {
    return `'${fontFamily}', ${fallback}`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
          disabled={disabled}
        >
          <span
            className="truncate"
            style={{
              fontFamily: value || 'inherit',
            }}
          >
            {getCurrentFontDisplay()}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Search fonts..." />
          <CommandList>
            <CommandEmpty>No font found.</CommandEmpty>

            {/* Sans Serif */}
            <CommandGroup heading="Sans Serif">
              {GOOGLE_FONTS.filter((f) => f.category === 'sans-serif').map((font) => {
                const fontValue = formatFontValue(font.family, 'sans-serif');
                const isSelected = value === fontValue || getCurrentFontDisplay() === font.family;

                return (
                  <CommandItem
                    key={font.family}
                    value={font.family}
                    onSelect={() => {
                      onChange(fontValue);
                      setOpen(false);
                    }}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        isSelected ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <span
                      className="flex-1 text-base"
                      style={{
                        fontFamily: fontsLoaded ? `'${font.family}', sans-serif` : 'inherit',
                      }}
                    >
                      {font.family}
                    </span>
                  </CommandItem>
                );
              })}
            </CommandGroup>

            {/* Serif */}
            <CommandGroup heading="Serif">
              {GOOGLE_FONTS.filter((f) => f.category === 'serif').map((font) => {
                const fontValue = formatFontValue(font.family, 'serif');
                const isSelected = value === fontValue || getCurrentFontDisplay() === font.family;

                return (
                  <CommandItem
                    key={font.family}
                    value={font.family}
                    onSelect={() => {
                      onChange(fontValue);
                      setOpen(false);
                    }}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        isSelected ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <span
                      className="flex-1 text-base"
                      style={{
                        fontFamily: fontsLoaded ? `'${font.family}', serif` : 'inherit',
                      }}
                    >
                      {font.family}
                    </span>
                  </CommandItem>
                );
              })}
            </CommandGroup>

            {/* Display */}
            <CommandGroup heading="Display">
              {GOOGLE_FONTS.filter((f) => f.category === 'display').map((font) => {
                const fontValue = formatFontValue(font.family, 'cursive');
                const isSelected = value === fontValue || getCurrentFontDisplay() === font.family;

                return (
                  <CommandItem
                    key={font.family}
                    value={font.family}
                    onSelect={() => {
                      onChange(fontValue);
                      setOpen(false);
                    }}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        isSelected ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <span
                      className="flex-1 text-base"
                      style={{
                        fontFamily: fontsLoaded ? `'${font.family}', cursive` : 'inherit',
                      }}
                    >
                      {font.family}
                    </span>
                  </CommandItem>
                );
              })}
            </CommandGroup>

            {/* Script */}
            <CommandGroup heading="Script">
              {GOOGLE_FONTS.filter((f) => f.category === 'script').map((font) => {
                const fontValue = formatFontValue(font.family, 'cursive');
                const isSelected = value === fontValue || getCurrentFontDisplay() === font.family;

                return (
                  <CommandItem
                    key={font.family}
                    value={font.family}
                    onSelect={() => {
                      onChange(fontValue);
                      setOpen(false);
                    }}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        isSelected ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <span
                      className="flex-1 text-base"
                      style={{
                        fontFamily: fontsLoaded ? `'${font.family}', cursive` : 'inherit',
                      }}
                    >
                      {font.family}
                    </span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
