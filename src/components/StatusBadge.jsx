export default function StatusBadge({ status }) {
  const map = {
    NEW:       'badge-new',
    READ:      'badge-read',
    REPLIED:   'badge-replied',
    ARCHIVED:  'badge-archived',
    PUBLISHED: 'badge-published',
    DRAFT:     'badge-draft',
  };
  return (
    <span className={map[status] || 'badge-draft'}>
      {status?.charAt(0) + status?.slice(1).toLowerCase()}
    </span>
  );
}
