import { useState, useRef } from 'react';

/**
 * Drag-and-drop image upload with preview
 */
export default function ImageUpload({ label, currentUrl, onChange, accept = 'image/*', hint }) {
  const [preview, setPreview] = useState(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const handleFile = (file) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    onChange(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const displayUrl = preview || currentUrl;

  return (
    <div>
      {label && <label className="label">{label}</label>}

      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
          dragging
            ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-brand-400 dark:hover:border-brand-500'
        }`}
      >
        {displayUrl ? (
          <div className="relative">
            <img
              src={displayUrl}
              alt="Preview"
              className="w-full h-48 object-cover rounded-lg"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
              <p className="text-white text-sm font-medium">Click to change</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
            <svg className="w-10 h-10 text-gray-400 mb-3" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Drag & drop or <span className="text-brand-600 dark:text-brand-400">browse</span>
            </p>
            <p className="text-xs text-gray-400 mt-1">{hint || 'JPG, PNG, WebP, SVG — max 10 MB'}</p>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => handleFile(e.target.files[0])}
        />
      </div>

      {displayUrl && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setPreview(null);
            onChange(null);
          }}
          className="mt-1.5 text-xs text-red-500 hover:text-red-700"
        >
          Remove image
        </button>
      )}
    </div>
  );
}
