'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { MapPin, Search, X } from 'lucide-react';

interface Prediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (address: string) => void;
  placeholder?: string;
  accentColor?: string;
  icon?: 'pin' | 'search';
  autoFocus?: boolean;
}

const DEBOUNCE_MS = 300;

export default function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = '123 Main St, City, State ZIP',
  accentColor = '#16a34a',
  icon = 'pin',
  autoFocus = false,
}: AddressAutocompleteProps) {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const sessionTokenRef = useRef<string>(crypto.randomUUID());

  const fetchPredictions = useCallback(async (input: string) => {
    if (!input || input.length < 3) {
      setPredictions([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      const params = new URLSearchParams({ input, sessiontoken: sessionTokenRef.current });
      const res = await fetch(`/api/autocomplete?${params}`);
      const data = await res.json();

      if (data.status === 'OK' && data.predictions?.length > 0) {
        setPredictions(data.predictions.slice(0, 5));
        setIsOpen(true);
        setHighlightedIndex(-1);
      } else {
        setPredictions([]);
        setIsOpen(false);
      }
    } catch {
      setPredictions([]);
      setIsOpen(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchPredictions(val), DEBOUNCE_MS);
  };

  const handleSelect = (prediction: Prediction) => {
    const address = prediction.description;
    onChange(address);
    onSelect(address);
    setPredictions([]);
    setIsOpen(false);
    sessionTokenRef.current = crypto.randomUUID();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || predictions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((i) => Math.min(i + 1, predictions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      e.preventDefault();
      handleSelect(predictions[highlightedIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  };

  const handleClear = () => {
    onChange('');
    setPredictions([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, []);

  const Icon = icon === 'search' ? Search : MapPin;

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Icon
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10"
        />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (predictions.length > 0) setIsOpen(true); }}
          placeholder={placeholder}
          autoFocus={autoFocus}
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          role="combobox"
          className="w-full pl-10 pr-9 py-3.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all"
          style={{
            boxShadow: isOpen ? `0 0 0 2px ${accentColor}40` : undefined,
            borderColor: isOpen ? accentColor : undefined,
          }}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {isLoading ? (
            <div
              className="w-4 h-4 rounded-full border-2 border-slate-200 animate-spin"
              style={{ borderTopColor: accentColor }}
            />
          ) : value ? (
            <button type="button" onClick={handleClear} className="text-slate-300 hover:text-slate-500 transition-colors" aria-label="Clear address">
              <X size={14} />
            </button>
          ) : null}
        </div>
      </div>

      {isOpen && predictions.length > 0 && (
        <div
          className="absolute z-50 left-0 right-0 mt-1.5 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden"
          role="listbox"
          aria-label="Address suggestions"
        >
          <div className="px-3 pt-2 pb-1 border-b border-slate-50">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Verified Addresses</p>
          </div>
          <ul className="py-1">
            {predictions.map((pred, idx) => {
              const isHighlighted = idx === highlightedIndex;
              return (
                <li key={pred.place_id} role="option" aria-selected={isHighlighted}>
                  <button
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); handleSelect(pred); }}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className="w-full text-left px-3 py-2.5 flex items-start gap-3 transition-colors"
                    style={{ background: isHighlighted ? `${accentColor}12` : 'transparent' }}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: isHighlighted ? `${accentColor}20` : '#f1f5f9' }}
                    >
                      <MapPin size={13} style={{ color: isHighlighted ? accentColor : '#94a3b8' }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{pred.structured_formatting.main_text}</p>
                      <p className="text-xs text-slate-400 truncate">{pred.structured_formatting.secondary_text}</p>
                    </div>
                    {isHighlighted && (
                      <div
                        className="shrink-0 ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-md self-center"
                        style={{ background: `${accentColor}20`, color: accentColor }}
                      >
                        ↵
                      </div>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="px-3 py-2 border-t border-slate-50 flex items-center justify-end gap-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://maps.gstatic.com/mapfiles/api-3/images/powered-by-google-on-white3.png"
              alt="Powered by Google"
              className="h-3.5 opacity-60"
            />
          </div>
        </div>
      )}
    </div>
  );
}
