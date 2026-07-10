const FRONTEND_URL = (import.meta.env.VITE_FRONTEND_URL || 'https://bereketfikre.et').replace(/\/$/, '');

/** Map entity types to frontend hash sections */
const SECTION_MAP = {
  Project: '#portfolio',
  Insight: '#insights',
  Service: '#services',
  Partner: '#trusted-by',
  Testimonial: '#testimonials',
  FAQ: '#faq',
};

/**
 * Build a live preview URL for published content.
 * @param {'Project'|'Insight'|'Service'|'Partner'|'Testimonial'|'FAQ'} entity
 * @param {{ slug?: string, type?: string }} [opts]
 */
export function getPreviewUrl(entity, opts = {}) {
  const hash = SECTION_MAP[entity] || '';
  return `${FRONTEND_URL}/${hash}`;
}

export { FRONTEND_URL };
