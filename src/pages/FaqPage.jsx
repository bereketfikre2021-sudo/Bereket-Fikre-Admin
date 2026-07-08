import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import toast from 'react-hot-toast';
import PageHeader from '../components/PageHeader';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';

function FaqModal({ faq, onClose, onSave }) {
  const [form, setForm] = useState({
    question: faq?.question || '',
    answer: faq?.answer || '',
    category: faq?.category || 'General',
    displayOrder: faq?.displayOrder ?? 0,
    isActive: faq?.isActive !== false,
  });
  const [saving, setSaving] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target?.value ?? e }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="card max-w-lg w-full p-6 shadow-xl">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">{faq ? 'Edit FAQ' : 'Add FAQ'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Question *</label>
            <input value={form.question} onChange={set('question')} className="input" required />
          </div>
          <div>
            <label className="label">Answer *</label>
            <textarea value={form.answer} onChange={set('answer')} rows={5} className="input" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Category</label>
              <input value={form.category} onChange={set('category')} className="input" placeholder="General" />
            </div>
            <div>
              <label className="label">Display Order</label>
              <input type="number" value={form.displayOrder} onChange={set('displayOrder')} className="input" min={0} />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} className="w-4 h-4 rounded border-gray-300 text-brand-600" />
            <span className="text-sm">Active</span>
          </label>
          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
              {saving ? 'Saving...' : (faq ? 'Update' : 'Create')}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function FaqPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(null); // null | 'new' | faq object
  const [deleteId, setDeleteId] = useState(null);
  const [expanded, setExpanded] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['faqs'],
    queryFn: () => api.get('/faqs', { params: { limit: 100, isActive: undefined } }).then((r) => r.data),
  });

  const saveMutation = useMutation({
    mutationFn: (body) =>
      modal && modal !== 'new'
        ? api.put(`/admin/faqs/${modal.id}`, body)
        : api.post('/admin/faqs', body),
    onSuccess: () => {
      toast.success(modal !== 'new' && modal ? 'FAQ updated' : 'FAQ created');
      qc.invalidateQueries(['faqs']);
      setModal(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Save failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/faqs/${id}`),
    onSuccess: () => {
      toast.success('FAQ deleted');
      qc.invalidateQueries(['faqs']);
      qc.invalidateQueries(['dashboard']);
      setDeleteId(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Delete failed'),
  });

  const faqs = data?.data || [];

  return (
    <div>
      <PageHeader
        title="FAQ"
        subtitle={`${faqs.length} questions`}
        action={
          <button onClick={() => setModal('new')} className="btn-primary">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add FAQ
          </button>
        }
      />

      {isLoading ? (
        <LoadingSpinner />
      ) : faqs.length === 0 ? (
        <div className="card">
          <EmptyState title="No FAQs yet" description="Add your first FAQ question." actionLabel="Add FAQ" onAction={() => setModal('new')} />
        </div>
      ) : (
        <div className="space-y-2">
          {faqs.map((faq) => (
            <div key={faq.id} className="card overflow-hidden">
              <button
                className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                onClick={() => setExpanded(expanded === faq.id ? null : faq.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-xs font-mono text-gray-400 flex-shrink-0 w-6">{faq.displayOrder}</span>
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{faq.question}</p>
                  {faq.category && (
                    <span className="hidden sm:block text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded flex-shrink-0">{faq.category}</span>
                  )}
                  {!faq.isActive && <span className="text-xs text-red-500 flex-shrink-0">Inactive</span>}
                </div>
                <div className="flex items-center gap-1 ml-3 flex-shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); setModal(faq); }}
                    className="p-1.5 text-gray-400 hover:text-brand-600 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-900/20"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteId(faq.id); }}
                    className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                  <svg className={`w-4 h-4 text-gray-400 transition-transform ${expanded === faq.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>
              {expanded === faq.id && (
                <div className="px-4 pb-4 pt-0 border-t border-gray-100 dark:border-gray-800">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {modal !== null && (
        <FaqModal
          faq={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSave={saveMutation.mutate}
        />
      )}

      <ConfirmDialog
        isOpen={!!deleteId}
        title="Delete FAQ"
        message="This will permanently delete this question and answer."
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
