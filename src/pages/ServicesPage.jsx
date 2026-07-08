import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import toast from 'react-hot-toast';
import PageHeader from '../components/PageHeader';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';

export default function ServicesPage() {
  const qc = useQueryClient();
  const [deleteId, setDeleteId] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['services'],
    queryFn: () => api.get('/admin/services', { params: { limit: 50, sortBy: 'displayOrder', order: 'asc', isActive: undefined } }).then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/services/${id}`),
    onSuccess: () => {
      toast.success('Service deleted');
      qc.invalidateQueries(['services']);
      setDeleteId(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Delete failed'),
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, isActive }) => {
      const fd = new FormData();
      fd.append('isActive', !isActive);
      return api.put(`/admin/services/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    onSuccess: () => qc.invalidateQueries(['services']),
    onError: (err) => toast.error(err.response?.data?.message || 'Update failed'),
  });

  const services = data?.data || [];

  return (
    <div>
      <PageHeader
        title="Services"
        subtitle={`${services.length} services`}
        action={
          <Link to="/services/new" className="btn-primary">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Service
          </Link>
        }
      />

      {isLoading ? (
        <LoadingSpinner />
      ) : services.length === 0 ? (
        <div className="card">
          <EmptyState title="No services yet" description="Add your first service." actionLabel="Add Service" actionTo="/services/new" />
        </div>
      ) : (
        <div className="space-y-3">
          {services.map((s) => (
            <div key={s.id} className="card p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-brand-50 dark:bg-brand-900/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-lg font-bold text-brand-600 dark:text-brand-400">{s.serviceNumber}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{s.title}</h3>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{s.category}</span>
                  {s.featured && <span className="badge-published">Featured</span>}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate">{s.shortDescription}</p>
                {s.bulletPoints?.length > 0 && (
                  <p className="text-xs text-gray-400 mt-1">{s.bulletPoints.length} bullet points</p>
                )}
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Active toggle */}
                <button
                  onClick={() => toggleActive.mutate({ id: s.id, isActive: s.isActive })}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${s.isActive ? 'bg-brand-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                  title={s.isActive ? 'Active — click to deactivate' : 'Inactive — click to activate'}
                >
                  <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${s.isActive ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
                </button>

                <Link to={`/services/${s.id}/edit`} className="btn-secondary !px-3 !py-1.5 text-xs">Edit</Link>
                <button onClick={() => setDeleteId(s.id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteId}
        title="Delete Service"
        message="This will permanently delete this service and all associated images."
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
