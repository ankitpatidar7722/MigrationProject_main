import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, X, Check } from 'lucide-react';

export interface Option {
    label: string;
    value: string | number;
}

interface SearchableSelectProps {
    options: Option[];
    value: string | number | undefined;
    onChange: (value: string | number) => void;
    placeholder?: string;
    className?: string;
    name?: string;
    required?: boolean;
    disabled?: boolean;
    error?: boolean;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
    options,
    value,
    onChange,
    placeholder = "Select...",
    className = "",
    disabled = false,
    error = false
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const selectedOption = options.find(opt => String(opt.value) === String(value));

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchTerm('');
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Focus input when opening
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const filteredOptions = options.filter(opt =>
        opt.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSelect = (option: Option) => {
        onChange(option.value);
        setIsOpen(false);
        setSearchTerm('');
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange('');
    };

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            <div
                className={`
                    flex items-center justify-between w-full px-4 py-2.5
                    bg-slate-50 dark:bg-zinc-800 border
                    rounded-xl cursor-pointer transition-all
                    ${error ? 'border-red-500' : 'border-transparent hover:border-slate-200 dark:hover:border-zinc-700'}
                    ${isOpen ? 'ring-2 ring-blue-500 bg-white dark:bg-zinc-900 border-transparent' : ''}
                    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                onClick={() => { if (!disabled) setIsOpen(!isOpen); }}
            >
                {isOpen ? (
                    <input
                        ref={inputRef}
                        type="text"
                        className="w-full bg-transparent border-none outline-none text-slate-900 dark:text-slate-100 placeholder-slate-400"
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                    />
                ) : (
                    <span className={`block truncate ${!selectedOption ? 'text-slate-500' : 'text-slate-900 dark:text-slate-100'}`}>
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                )}

                <div className="flex items-center gap-2 ml-2 min-w-fit">
                    {selectedOption && !disabled && (
                        <div
                            role="button"
                            onClick={handleClear}
                            className="p-1 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded-full text-slate-500 transition-colors"
                            title="Clear selection"
                        >
                            <X size={14} />
                        </div>
                    )}
                    <ChevronDown size={16} className={`text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    {name ? <input type="hidden" name={name} value={value || ''} /> : null}
                </div>
            </div>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl shadow-lg max-h-60 overflow-auto">
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map((option) => (
                            <div
                                key={option.value}
                                onClick={() => handleSelect(option)}
                                className={`
                                    px-4 py-2.5 cursor-pointer flex items-center justify-between
                                    hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors
                                    ${String(option.value) === String(value) ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'}
                                `}
                            >
                                <span className="truncate">{option.label}</span>
                                {String(option.value) === String(value) && <Check size={16} className="min-w-fit ml-2" />}
                            </div>
                        ))
                    ) : (
                        <div className="px-4 py-3 text-sm text-slate-500 text-center">
                            No results found
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
