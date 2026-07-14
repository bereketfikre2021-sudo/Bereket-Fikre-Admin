import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

/** Drag handle icon — pure presentational */
export function DragHandleIcon({ listeners, attributes, isDragging }) {
  return (
    <button
      type="button"
      {...listeners}
      {...attributes}
      className={`p-1.5 rounded cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 dark:hover:text-gray-400 transition-colors focus:outline-none ${isDragging ? 'cursor-grabbing' : ''}`}
      title="Drag to reorder"
      aria-label="Drag to reorder"
    >
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <circle cx="9"  cy="5"  r="1.5" />
        <circle cx="15" cy="5"  r="1.5" />
        <circle cx="9"  cy="12" r="1.5" />
        <circle cx="15" cy="12" r="1.5" />
        <circle cx="9"  cy="19" r="1.5" />
        <circle cx="15" cy="19" r="1.5" />
      </svg>
    </button>
  );
}

/**
 * Wraps a <tr> with sortable drag-and-drop behaviour.
 * Usage: <SortableRow id={item.id}>{(handle) => <td>{handle}</td> ...}</SortableRow>
 */
export function SortableTableRow({ id, children }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1 : undefined,
    position: isDragging ? 'relative' : undefined,
  };

  const handle = <DragHandleIcon listeners={listeners} attributes={attributes} isDragging={isDragging} />;

  return (
    <tr ref={setNodeRef} style={style}>
      {children(handle)}
    </tr>
  );
}

/**
 * Wraps any block element (div, li, etc.) with sortable drag-and-drop.
 * Usage: <SortableItem id={item.id}>{(handle) => <div>{handle} ...</div>}</SortableItem>
 */
export function SortableItem({ id, children }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handle = <DragHandleIcon listeners={listeners} attributes={attributes} isDragging={isDragging} />;

  return (
    <div ref={setNodeRef} style={style}>
      {children(handle)}
    </div>
  );
}
