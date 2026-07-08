import { useRef, useState } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';

/**
 * InlineThumbnail
 *
 * Renders a small image thumbnail in a table row.
 * Clicking it opens a file picker and immediately uploads
 * the chosen file to the backend — no page navigation needed.
 *
 * Props:
 *   src        {string|null}  Current image URL
 *   alt        {string}       Alt text
 *   endpoint   {string}       PUT endpoint, e.g. '/admin/projects/:id'
 *   fieldName  {string}       FormData field name, e.g. 'thumbnail'
 *   onSuccess  {function}     Called with the updated record after upload
 *   size       {string}       Tailwind size classes (default 'w-10 h-10')
 *   shape      {string}       'rounded-lg' | 'rounded-full'
 */
export default function InlineThumbnail({
  src,
  alt = '',
  endpoint,
  fieldName = 'thumbnail',
  onSuccess,
  size = 'w-10 h-10',
  shape = 'rounded-lg',
}) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview]   = useState(null);

  const displaySrc = preview || src;

  const handleClick = (e) => {
    e.stopPropagation(); // don't trigger row click
    inputRef.current?.click();
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Instant local preview
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);
    setUploading(true);

    try {
      const fd = new FormData();
      fd.append(fieldName, file);

      const { data } = await api.put(endpoint, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Image updated');
      onSuccess?.(data.data);
    } catch (err) {
      // Revert preview on failure
      setPreview(null);
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
      // Reset input so the same file can be re-selected
      e.target.value = '';
    }
  };

  return (
    <div
      className={`relative flex-shrink-0 ${size} cursor-pointer group`}
      onClick={handleClick}
      title="Click to change image"
    >
      {/* Image or placeholder */}
      {displaySrc ? (
        <img
          src={displaySrc}
          alt={alt}
          className={`${size} ${shape} object-cover`}
        />
      ) : (
        <div className={`${size} ${shape} bg-gray-200 dark:bg-gray-700 flex items-center justify-center`}>
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      )}

      {/* Hover overlay — camera icon */}
      <div className={`absolute inset-0 ${shape} bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center`}>
        {uploading ? (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/svg+xml"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}
