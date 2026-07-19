import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { downloadCsv } from '../lib/api';
import toast from 'react-hot-toast';
import PageHeader from '../components/PageHeader';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';
import SearchInput from '../components/SearchInput';
import StatusBadge from '../components/StatusBadge';
import Pagination from '../components/Pagination';

const STATUS_OPTIONS = ['NEW', 'READ', 'REPLIED', 'ARCHIVED'];

// ─── Quick-reply popover ──────────────────────────────────────────────────────
function QuickReply({ request, onSend, onClose }) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      await onSend(request.id, text.trim());
      onClose();
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="card w-full max-w-md p-5 shadow-xl">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Quick Reply</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              To: {request.firstName} {request.lastName} &lt;{request.email}&gt;
            </p>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="mb-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 text-xs text-gray-500 dark:text-gray-400">
          Re: {request.serviceNeeded} project request
        </div>
        <textarea
          autoFocus
          className="input resize-none text-sm min-h-[120px]"
          placeholder={`Hi ${request.firstName},\n\nThank you for your project request...`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSend(); }}
        />
        <p className="text-xs text-gray-400 mt-1 mb-3">Ctrl+Enter to send</p>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="btn-secondary text-xs !py-1.5">Cancel</button>
          <button
            onClick={handleSend}
            disabled={sending || !text.trim()}
            className="btn-primary text-xs !py-1.5 flex items-center gap-1.5 disabled:opacity-40"
          >
            {sending ? (
              <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Sending...</>
            ) : (
              <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg> Send</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function RequestDetail({ request, onClose, onStatusChange, onReplySent }) {
  const [notes, setNotes] = useState(request.notes || '');
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  const handleSaveNotes = () => {
    onStatusChange(request.id, request.status, notes);
    toast.success('Notes saved');
  };

  const handleSendReply = async () => {
    if (!replyText.trim()) return;
    setSendingReply(true);
    try {
      await onReplySent(request.id, replyText.trim());
      setReplyText('');
    } finally {
      setSendingReply(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
      <div className="card max-w-2xl w-full p-6 shadow-xl my-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              Project Request from {request.firstName} {request.lastName}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{request.email}</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg flex-shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500 dark:text-gray-400 mb-0.5">Phone</p>
              <p className="text-gray-900 dark:text-white">{request.phone || 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400 mb-0.5">Company</p>
              <p className="text-gray-900 dark:text-white">{request.company || 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400 mb-0.5">Service Needed</p>
              <p className="text-gray-900 dark:text-white">{request.serviceNeeded}</p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400 mb-0.5">Budget Range</p>
              <p className="text-gray-900 dark:text-white">{request.budgetRange}</p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400 mb-0.5">Timeline</p>
              <p className="text-gray-900 dark:text-white">{request.timeline}</p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400 mb-0.5">Preferred Contact</p>
              <p className="text-gray-900 dark:text-white">{request.preferredContactMethod}</p>
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Project Description</p>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{request.projectDescription}</p>
            </div>
          </div>

          {/* Reply */}
          <div>
            <label className="label">Send Reply <span className="text-xs text-gray-400 font-normal">(sent to {request.email})</span></label>
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows={4}
              className="input resize-none"
              placeholder={`Hi ${request.firstName},\n\nThank you for your project request...`}
            />
            <button
              onClick={handleSendReply}
              disabled={sendingReply || !replyText.trim()}
              className="btn-primary text-xs mt-2 flex items-center gap-1.5 disabled:opacity-40"
            >
              {sendingReply ? (
                <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Sending...</>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Send Reply
                </>
              )}
            </button>
          </div>

          <div>
            <label className="label">Admin Notes (Internal)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="input resize-none"
              placeholder="Add notes about this request..."
            />
            <button onClick={handleSaveNotes} className="btn-secondary text-xs mt-2">Save Notes</button>
          </div>

          <div className="flex items-center justify-between gap-3 pt-2 border-t border-gray-200 dark:border-gray-800">
            <p className="text-xs text-gray-400">
              {new Date(request.createdAt).toLocaleString()}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">Status:</span>
              <select
                value={request.status}
                onChange={(e) => onStatusChange(request.id, e.target.value, notes)}
                className="input !py-1 !text-xs w-32"
              >
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>)}
              </select>
            </div>
          </div>

          <div className="flex gap-2">
            {request.phone && (
              <a href={`tel:${request.phone}`} className="btn-secondary text-xs !py-1.5">Call {request.phone}</a>
            )}
            <button onClick={onClose} className="btn-secondary text-xs !py-1.5 ml-auto">Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProjectRequestsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [quickReply, setQuickReply] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['project-requests', { search, status, page }],
    queryFn: () => api.get('/admin/project-requests', { params: { search, status, page, limit: 15 } }).then((r) => r.data),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status, notes }) => api.put(`/admin/project-requests/${id}/status`, { status, notes }),
    onSuccess: () => {
      qc.invalidateQueries(['project-requests']);
      qc.invalidateQueries(['dashboard']);
    },
  });

  const replyMutation = useMutation({
    mutationFn: ({ id, replyMessage }) => api.post(`/admin/project-requests/${id}/reply`, { replyMessage }),
    onSuccess: (_, { id }) => {
      toast.success('Reply sent successfully!');
      qc.invalidateQueries(['project-requests']);
      qc.invalidateQueries(['dashboard']);
      setSelected((s) => s?.id === id ? { ...s, status: 'REPLIED' } : s);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to send reply. Check email settings.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/project-requests/${id}`),
    onSuccess: () => {
      toast.success('Request deleted');
      qc.invalidateQueries(['project-requests']);
      qc.invalidateQueries(['dashboard']);
      setDeleteId(null);
      setSelected(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Delete failed'),
  });

  const requests = data?.data || [];
  const pagination = data?.pagination;

  const openRequest = async (req) => {
    setSelected(req);
    if (req.status === 'NEW') {
      updateStatus.mutate({ id: req.id, status: 'READ', notes: req.notes });
    }
  };

  return (
    <div>
      <PageHeader
        title="Project Requests"
        subtitle={`${pagination?.total ?? 0} total`}
        action={
          <button
            onClick={() => downloadCsv('/admin/project-requests/export', 'project-requests.csv').catch(() => toast.error('Export failed'))}
            className="btn-secondary flex items-center gap-1.5 text-xs"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export CSV
          </button>
        }
      />

      <div className="card p-4 mb-4 flex flex-col sm:flex-row gap-3">
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search requests..." />
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="input sm:w-44">
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <LoadingSpinner />
        ) : requests.length === 0 ? (
          <EmptyState title="No requests yet" description="Project request submissions will appear here." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                    <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Client</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400 hidden md:table-cell">Service</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400 hidden lg:table-cell">Budget</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400 hidden sm:table-cell">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400 hidden lg:table-cell">Date</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {requests.map((r) => (
                    <tr
                      key={r.id}
                      className={`hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors cursor-pointer ${r.status === 'NEW' ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                      onClick={() => openRequest(r)}
                    >
                      <td className="px-4 py-3">
                        <div>
                          <p className={`font-medium text-gray-900 dark:text-white ${r.status === 'NEW' ? 'font-semibold' : ''}`}>
                            {r.firstName} {r.lastName}
                          </p>
                          <p className="text-xs text-gray-400">{r.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-xs hidden md:table-cell">{r.serviceNeeded}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-xs hidden lg:table-cell">{r.budgetRange}</td>
                      <td className="px-4 py-3 hidden sm:table-cell"><StatusBadge status={r.status} /></td>
                      <td className="px-4 py-3 text-xs text-gray-400 hidden lg:table-cell">{new Date(r.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          {/* Quick reply */}
                          <button
                            onClick={() => setQuickReply(r)}
                            className="p-1.5 text-gray-400 hover:text-blue-500 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
                            title="Quick reply"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                          </button>
                          <button onClick={() => setDeleteId(r.id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">
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

      {quickReply && (
        <QuickReply
          request={quickReply}
          onClose={() => setQuickReply(null)}
          onSend={(id, replyMessage) => replyMutation.mutateAsync({ id, replyMessage })}
        />
      )}

      {selected && (
        <RequestDetail
          request={selected}
          onClose={() => setSelected(null)}
          onReplySent={(id, replyMessage) => replyMutation.mutateAsync({ id, replyMessage })}
          onStatusChange={(id, status, notes) => {
            updateStatus.mutate({ id, status, notes });
            setSelected((s) => ({ ...s, status, notes }));
          }}
        />
      )}

      <ConfirmDialog
        isOpen={!!deleteId}
        title="Delete Request"
        message="This will permanently delete this project request."
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
