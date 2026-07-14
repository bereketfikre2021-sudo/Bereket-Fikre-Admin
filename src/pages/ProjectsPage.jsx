import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import api from '../lib/api';
import toast from 'react-hot-toast';
import PageHeader from '../components/PageHeader';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';
import SearchInput from '../components/SearchInput';
import StatusBadge from '../components/StatusBadge';
import Pagination from '../components/Pagination';
import InlineThumbnail from '../components/InlineThumbnail';
import PreviewLinkButton from '../components/PreviewLinkButton';
import BulkActionBar from '../components/BulkActionBar';
import { SortableTableRow } from '../components/DragHandle';

const FILTER_TABS = [
  { value: '',                                label: 'All' },
  { value: 'Recent Projects',                 label: 'Recent Projects' },
  { value: 'Brand Identity',                  label: 'Brand Identity' },
  { value: 'Digital Design · Social Media',   label: 'Social Media' },
  { value: 'Digital Design · Web Banners',    label: 'Web Banners' },
  { value: 'Print & Marketing',               label: 'Print & Marketing' },
  { value: 'Creative Direction',              label: 'Creative Direction' },
];

export default function ProjectsPage() {
  const qc = useQueryClient();
  const [search,   setSearch]   = useState('');
  const [status,   setStatus]   = useState('');
  const [tab,      setTab]      = useState('');
  const [page,     setPage]     = useState(1);
  const [deleteId, setDeleteId] = useState(null);

  const [selected,      setSelected]      = useState(new Set());
  const [bulkLoading,   setBulkLoading]   = useState(false);
  const [bulkConfirm,   setBulkConfirm]   = useState(false); // confirm dialog for bulk delete
  const [localProjects, setLocalProjects] = useState(null); // optimistic local order for drag

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const tabParams = () => {
    const base = { sortBy: 'displayOrder', order: 'asc' };
    if (tab === '') return base;
    if (tab === 'Recent Projects') return { ...base, featured: true };
    return { ...base, category: tab };
  };

  const { data, isLoading } = useQuery({
    queryKey: ['projects', { search, status, tab, page }],
    queryFn: () =>
      api.get('/projects', {
        params: { search: search || undefined, status: status || undefined, page, limit: 10, ...tabParams() },
      }).then((r) => r.data),
  });

  const updateProjectInCache = (updatedProject) => {
    qc.setQueryData(['projects', { search, status, tab, page }], (old) => {
      if (!old) return old;
      return { ...old, data: old.data.map((p) => p.id === updatedProject.id ? { ...p, thumbnail: updatedProject.thumbnail } : p) };
    });
  };

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/projects/${id}`),
    onSuccess: () => {
      toast.success('Project deleted');
      qc.invalidateQueries(['projects']);
      qc.invalidateQueries(['dashboard']);
      setDeleteId(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Delete failed'),
  });

  const projects   = localProjects ?? data?.data ?? [];
  const pagination = data?.pagination;
  const allIds     = projects.map((p) => p.id);
  const allSelected = allIds.length > 0 && allIds.every((id) => selected.has(id));

  const reorderMutation = useMutation({
    mutationFn: (items) => api.put('/admin/projects/reorder', { items }),
    onError: () => {
      toast.error('Reorder failed');
      setLocalProjects(null);
    },
  });

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const oldIndex = projects.findIndex((p) => p.id === active.id);
    const newIndex = projects.findIndex((p) => p.id === over.id);
    const reordered = arrayMove(projects, oldIndex, newIndex);
    setLocalProjects(reordered);
    reorderMutation.mutate(reordered.map((p, i) => ({ id: p.id, displayOrder: i })));
  };

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(allIds));
    }
  };

  const toggleOne = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // ── Bulk actions ─────────────────────────────────────────────────────────────
  const bulkUpdateStatus = async (newStatus) => {
    setBulkLoading(true);
    const ids = [...selected];
    try {
      // Send all updates in parallel using multipart form
      await Promise.all(
        ids.map((id) => {
          const fd = new FormData();
          fd.append('status', newStatus);
          return api.put(`/admin/projects/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        })
      );
      toast.success(`${ids.length} project${ids.length > 1 ? 's' : ''} set to ${newStatus.toLowerCase()}`);
      setSelected(new Set());
      qc.invalidateQueries(['projects']);
    } catch {
      toast.error('Some updates failed. Please try again.');
    } finally {
      setBulkLoading(false);
    }
  };

  const bulkDelete = async () => {
    setBulkLoading(true);
    const ids = [...selected];
    try {
      await Promise.all(ids.map((id) => api.delete(`/admin/projects/${id}`)));
      toast.success(`${ids.length} project${ids.length > 1 ? 's' : ''} deleted`);
      setSelected(new Set());
      setBulkConfirm(false);
      qc.invalidateQueries(['projects']);
      qc.invalidateQueries(['dashboard']);
    } catch {
      toast.error('Some deletes failed. Please try again.');
    } finally {
      setBulkLoading(false);
    }
  };

  const resetFilters = () => { setSearch(''); setStatus(''); setTab(''); setPage(1); setLocalProjects(null); };
  const hasFilters = search || status || tab;

  return (
    <div>
      <PageHeader
        title="Featured Projects"
        subtitle={`${pagination?.total ?? 0} total`}
        action={
          <Link to="/projects/new" className="btn-primary">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Project
          </Link>
        }
      />

      {/* Filter Tabs */}
      <div className="flex gap-1 flex-wrap mb-3">
        {FILTER_TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => { setTab(t.value); setPage(1); setSelected(new Set()); }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              tab === t.value
                ? 'bg-brand-600 text-white'
                : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Search + Status */}
      <div className="card p-4 mb-4 flex flex-col sm:flex-row gap-3 items-center">
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); setSelected(new Set()); }} placeholder="Search projects..." />
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); setSelected(new Set()); }} className="input sm:w-40">
          <option value="">All statuses</option>
          <option value="PUBLISHED">Published</option>
          <option value="DRAFT">Draft</option>
        </select>
        {hasFilters && (
          <button onClick={resetFilters} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 underline whitespace-nowrap">
            Clear filters
          </button>
        )}
      </div>

      {/* Bulk action bar — appears when items are selected */}
      <BulkActionBar
        count={selected.size}
        loading={bulkLoading}
        onPublish={() => bulkUpdateStatus('PUBLISHED')}
        onUnpublish={() => bulkUpdateStatus('DRAFT')}
        onDelete={() => setBulkConfirm(true)}
        onClear={() => setSelected(new Set())}
      />

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <LoadingSpinner />
        ) : projects.length === 0 ? (
          <EmptyState
            title={hasFilters ? 'No projects match your filters' : `No ${FILTER_TABS.find(t => t.value === tab)?.label || ''} projects yet`}
            description={hasFilters ? 'Try adjusting your search or status filter.' : 'Add your first project to get started.'}
            actionLabel={hasFilters ? 'Clear filters' : 'Add Project'}
            actionTo={hasFilters ? undefined : '/projects/new'}
            onAction={hasFilters ? resetFilters : undefined}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                    {/* Drag handle col */}
                    <th className="px-2 py-3 w-8" aria-label="Drag to reorder" />
                    {/* Select-all checkbox */}
                    <th className="px-4 py-3 w-10">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleAll}
                        className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                        aria-label="Select all"
                      />
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Project</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400 hidden md:table-cell">Category</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400 hidden sm:table-cell">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400 hidden lg:table-cell">Added</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    modifiers={[restrictToVerticalAxis]}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext items={projects.map((p) => p.id)} strategy={verticalListSortingStrategy}>
                      {projects.map((p) => (
                        <SortableTableRow key={p.id} id={p.id}>
                          {(handle) => (
                            <>
                              {/* Drag handle cell */}
                              <td className="px-2 py-3 w-8">{handle}</td>
                              {/* Row checkbox */}
                              <td className="px-4 py-3 w-10">
                                <input
                                  type="checkbox"
                                  checked={selected.has(p.id)}
                                  onChange={() => toggleOne(p.id)}
                                  className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                                  aria-label={`Select ${p.title}`}
                                />
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <InlineThumbnail
                                    src={p.thumbnail}
                                    alt={p.title}
                                    endpoint={`/admin/projects/${p.id}/thumbnail`}
                                    fieldName="thumbnail"
                                    onSuccess={updateProjectInCache}
                                    size="w-10 h-10"
                                    shape="rounded-lg"
                                  />
                                  <div className="min-w-0">
                                    <p className="font-medium text-gray-900 dark:text-white truncate max-w-[200px]">{p.title}</p>
                                    {p.featured && <span className="text-xs text-brand-600 dark:text-brand-400 font-medium">★ Recent</span>}
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-xs hidden md:table-cell max-w-[160px] truncate">{p.category}</td>
                              <td className="px-4 py-3 hidden sm:table-cell"><StatusBadge status={p.status} /></td>
                              <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs hidden lg:table-cell">
                                {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '—'}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center justify-end gap-1">
                                  {p.status === 'PUBLISHED' && <PreviewLinkButton entity="Project" slug={p.slug} />}
                                  <Link to={`/projects/${p.id}/edit`} className="p-1.5 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors" title="Edit">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </Link>
                                  <button onClick={() => setDeleteId(p.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Delete">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                              </td>
                            </>
                          )}
                        </SortableTableRow>
                      ))}
                    </SortableContext>
                  </DndContext>
                </tbody>
              </table>
            </div>
            <div className="px-4 pb-3">
              <Pagination pagination={pagination} onPageChange={(p) => { setPage(p); setSelected(new Set()); }} />
            </div>
          </>
        )}
      </div>

      {/* Single delete confirm */}
      <ConfirmDialog
        isOpen={!!deleteId}
        title="Delete Project"
        message="This will permanently delete the project and all its images."
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
      />

      {/* Bulk delete confirm */}
      <ConfirmDialog
        isOpen={bulkConfirm}
        title={`Delete ${selected.size} project${selected.size > 1 ? 's' : ''}?`}
        message="This will permanently delete all selected projects and their images. This cannot be undone."
        loading={bulkLoading}
        onConfirm={bulkDelete}
        onCancel={() => setBulkConfirm(false)}
      />
    </div>
  );
}
