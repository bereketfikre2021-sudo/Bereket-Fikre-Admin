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

export default function InsightsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [type,   setType]   = useState('');   // '' | 'CASE_STUDY' | 'BLOG_POST'
  const [status, setStatus] = useState('');
  const [page,   setPage]   = useState(1);
  const [deleteId, setDeleteId] = useState(null);

  const INSIGHT_TABS = [
    { value: '',           label: 'All' },
    { value: 'CASE_STUDY', label: 'Case Studies' },
    { value: 'BLOG_POST',  label: 'Design Blog' },
  ];

  const { data, isLoading } = useQuery({
    queryKey: ['insights', { search, type, status, page }],
    queryFn: () => api.get('/admin/insights', { params: { search, type, status, page, limit: 10, sortBy: 'createdAt', order: 'desc' } }).then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/insights/${id}`),
    onSuccess: () => {
      toast.success('Insight deleted');
      qc.invalidateQueries(['insights']);
      qc.invalidateQueries(['dashboard']);
      setDeleteId(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Delete failed'),
  });

  // Update a single insight in the cache after an inline cover upload
  const updateInsightInCache = (updatedInsight) => {
    qc.setQueryData(['insights', { search, type, status, page }], (old) => {
      if (!old) return old;
      return {
        ...old,
        data: old.data.map((i) =>
          i.id === updatedInsight.id ? { ...i, coverImage: updatedInsight.coverImage } : i
        ),
      };
    });
  };

  const insights = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div>
      <PageHeader
        title="Project Insights"
        subtitle="Case studies and blog posts"
        action={
          <Link to="/insights/new" className="btn-primary">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Insight
          </Link>
        }
      />

      {/* Type tabs */}
      <div className="flex gap-1 flex-wrap mb-3">
        {INSIGHT_TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => { setType(t.value); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              type === t.value
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
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search insights..." />
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="input sm:w-40">
          <option value="">All statuses</option>
          <option value="PUBLISHED">Published</option>
          <option value="DRAFT">Draft</option>
        </select>
        {(search || status) && (
          <button
            onClick={() => { setSearch(''); setStatus(''); setPage(1); }}
            className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 underline whitespace-nowrap"
          >
            Clear filters
          </button>
        )}
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <LoadingSpinner />
        ) : insights.length === 0 ? (
          <EmptyState title="No insights yet" description="Add case studies and blog posts." actionLabel="Add Insight" actionTo="/insights/new" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                    <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Title</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400 hidden md:table-cell">Type</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400 hidden md:table-cell">Category</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400 hidden sm:table-cell">Status</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {insights.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <InlineThumbnail
                            src={item.coverImage}
                            alt={item.title}
                            endpoint={`/admin/insights/${item.id}/cover`}
                            fieldName="coverImage"
                            onSuccess={updateInsightInCache}
                            size="w-10 h-10"
                            shape="rounded-lg"
                          />
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 dark:text-white truncate max-w-[200px]">{item.title}</p>
                            {item.readingTime && <p className="text-xs text-gray-400">{item.readingTime} min read</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${item.type === 'CASE_STUDY' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'}`}>
                          {item.type === 'CASE_STUDY' ? 'Case Study' : 'Blog Post'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-xs hidden md:table-cell">{item.category}</td>
                      <td className="px-4 py-3 hidden sm:table-cell"><StatusBadge status={item.status} /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Link to={`/insights/${item.id}/edit`} className="p-1.5 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors" title="Edit">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </Link>
                          <button onClick={() => setDeleteId(item.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
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
        title="Delete Insight"
        message="This will permanently delete this insight."
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
