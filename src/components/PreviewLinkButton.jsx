import { getPreviewUrl } from '../lib/previewUrls';

/**
 * External link button for viewing published content on the live site.
 */
export default function PreviewLinkButton({ entity, slug, type, className = '' }) {
  const url = getPreviewUrl(entity, { slug, type });

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors ${className}`}
      title="View on live site"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
      </svg>
    </a>
  );
}
