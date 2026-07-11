/**
 * PreviewLinkButton
 * Opens the relevant section of the live frontend in a new tab.
 *
 * Props:
 *   entity  — 'Project' | 'Insight' | 'Service'
 *   slug    — optional slug for deeper linking
 */

const FRONTEND_URL = 'https://bereketfikre.et';

const SECTION_MAP = {
  Project:  '/#portfolio',
  Insight:  '/#insights',
  Service:  '/#services',
  FAQ:      '/#faq',
  Partner:  '/#partners',
};

export default function PreviewLinkButton({ entity, slug }) {
  const section = SECTION_MAP[entity] || '/';
  const href    = `${FRONTEND_URL}${section}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="p-1.5 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
      title={`View ${entity} on site`}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
      </svg>
    </a>
  );
}
