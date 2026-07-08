import { useState } from 'react';

/**
 * Dynamic tag/chip input
 * value: string[]
 * onChange: (string[]) => void
 */
export default function TagInput({ label, value = [], onChange, placeholder = 'Type and press Enter' }) {
  const [input, setInput] = useState('');

  const add = () => {
    const trimmed = input.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setInput('');
  };

  const remove = (tag) => onChange(value.filter((t) => t !== tag));

  const handleKey = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      add();
    } else if (e.key === 'Backspace' && !input && value.length > 0) {
      remove(value[value.length - 1]);
    }
  };

  return (
    <div>
      {label && <label className="label">{label}</label>}
      <div className="flex flex-wrap gap-2 p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus-within:ring-2 focus-within:ring-brand-500 focus-within:border-transparent min-h-[42px]">
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 rounded-md text-xs font-medium"
          >
            {tag}
            <button type="button" onClick={() => remove(tag)} className="hover:text-brand-900 dark:hover:text-brand-100">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </span>
        ))}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          onBlur={add}
          placeholder={value.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] bg-transparent text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 outline-none"
        />
      </div>
      <p className="text-xs text-gray-400 mt-1">Press Enter or comma to add</p>
    </div>
  );
}
