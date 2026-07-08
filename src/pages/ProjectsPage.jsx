import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
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

// Filter tabs matching the frontend Portfolio.jsx tabs exactly
// category values match the `service` field / `category` stored in DB
const FILTER_TABS = [
  { value: '',                          label: 'All' },
  { value: 'recent',                    label: 'Recent Projects' },
  { value: 'brand-identity-design',     label: 'Brand Identity' },
  { value: 'marketing-campaign-design', label: 'Digital Design' },
  { value: 'print-design',              label: 'Print & Marketing' },
  { value: 'art-direction-visual-guidance', label: 'Creative Direction' },
];

export default function ProjectsPage() {
  const qc = useQueryClient();
  const [search,   setSearch]   = useState('');
  const [status,   setStatus]   = useState('');
  const [tab,      setTab]      = useState(''); // default = All
  const [page,     setPage]     = useState(1);
  const [deleteId, setDeleteId] = useState(null);

  // Build API params from the active tab
  // category values match the `category` field stored in DB (= frontend service value)
  const tabParams = () => {
    if (tab === 'recent') return { featured: true,      sortBy: 'displayOrder', order: 'asc' };
    if (tab === '')       return {                       sortBy: 'displayOrder', order: 'asc' };
    return             { category: tab,              sortBy: 'displayOrder', order: 'asc' };
  };

  const { data, isLoading } = useQuery({
    queryKey: ['projects', { search, status, tab, page }],
    queryFn: () =>
      api.get('/projects', {
        params: {
          search:   search || undefined,
          status:   status || undefined,
          page,
          limit: 10,
          ...tabParams(),
        },
      }).then((r) => r.data),
  });

  // Update a single project in the cache after an inline thumbnail upload
  const updateProjectInCache = (updatedProject) => {
    qc.setQueryData(['projects', { search, status, tab, page }], (old) => {
      if (!old) return old;
      return {
        ...old,
        data: old.data.map((p) =>
          p.id === updatedProject.id ? { ...p, thumbnail: updatedProject.thumbnail } : p
        ),
      };
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

  const projects   = data?.data       || [];
  const pagination = data?.pagination;

  const resetFilters = () => { setSearch(''); setStatus(''); setTab('recent'); setPage(1); };
  const hasFilters = search || status;

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

      {/* Filter Tabs — matches frontend Portfolio.jsx exactly */}
      <div className="flex gap-1 flex-wrap mb-3">
        {FILTER_TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => { setTab(t.value); setPage(1); }}
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

      {/* Search + Status filters */}
      <div className="card p-4 mb-4 flex flex-col sm:flex-row gap-3 items-center">
        <SearchInput
          value={search}
          onChange={(v) => { setSearch(v); setPage(1); }}
          placeholder="Search projects..."
        />
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="input sm:w-40"
        >
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

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <LoadingSpinner />
        ) : projects.length === 0 ? (
          <EmptyState
            title={hasFilters ? 'No projects match your filters' : `No ${FILTER_TABS.find(t=>t.value===tab)?.label || ''} projects yet`}
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
                    <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Project</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400 hidden md:table-cell">Category</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400 hidden sm:table-cell">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400 hidden lg:table-cell">Added</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {projects.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
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
                            {p.featured && (
                              <span className="text-xs text-brand-600 dark:text-brand-400 font-medium">★ Featured</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-xs hidden md:table-cell max-w-[160px] truncate">
                        {p.category}
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <StatusBadge status={p.status} />
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs hidden lg:table-cell">
                        {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            to={`/projects/${p.id}/edit`}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
                            title="Edit"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </Link>
                          <button
                            onClick={() => setDeleteId(p.id)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            title="Delete"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 pb-3">
              <Pagination pagination={pagination} onPageChange={setPage} />
            </div>
          </>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!deleteId}
        title="Delete Project"
        message="This will permanently delete the project and all its images. This action cannot be undone."
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
