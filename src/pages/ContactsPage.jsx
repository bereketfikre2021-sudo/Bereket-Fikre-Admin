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
function QuickReply({ contact, onSend, onClose }) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const textareaRef = useRef(null);

  const handleSend = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      await onSend(contact.id, text.trim());
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
              To: {contact.name} &lt;{contact.email}&gt;
            </p>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="mb-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
          Re: {contact.subject}
        </div>
        <textarea
          ref={textareaRef}
          autoFocus
          className="input resize-none text-sm min-h-[120px]"
          placeholder={`Hi ${contact.name},\n\nThank you for reaching out...`}
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

function ContactDetail({ contact, onClose, onStatusChange, onNotesSave, onReplySent }) {
  const [notes, setNotes] = useState(contact.notes || '');
  const [savingNotes, setSavingNotes] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    await onNotesSave(contact.id, contact.status, notes);
    setSavingNotes(false);
  };

  const handleSendReply = async () => {
    if (!replyText.trim()) return;
    setSendingReply(true);
    try {
      await onReplySent(contact.id, replyText.trim());
      setReplyText('');
    } finally {
      setSendingReply(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="card max-w-lg w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">{contact.subject}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{contact.name} · {contact.email}</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Message */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{contact.message}</p>
        </div>

        {/* Status + date row */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <p className="text-xs text-gray-400">{new Date(contact.createdAt).toLocaleString()}</p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">Status:</span>
            <select
              value={contact.status}
              onChange={(e) => onStatusChange(contact.id, e.target.value)}
              className="input !py-1 !text-xs w-32"
            >
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>)}
            </select>
          </div>
        </div>

        {/* Reply */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
            Send Reply
            <span className="ml-1 font-normal text-gray-400">(sent directly to {contact.email})</span>
          </label>
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            rows={4}
            placeholder={`Hi ${contact.name},\n\nThank you for reaching out...`}
            className="input resize-none text-sm"
          />
          <div className="flex justify-end mt-1.5">
            <button
              onClick={handleSendReply}
              disabled={sendingReply || !replyText.trim()}
              className="btn-primary !py-1.5 !px-4 text-xs disabled:opacity-40 flex items-center gap-1.5"
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
        </div>

        {/* Notes */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
            Internal Notes
            <span className="ml-1 font-normal text-gray-400">(not visible to sender)</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Add a follow-up reminder or context…"
            className="input resize-none text-sm"
          />
          <div className="flex justify-end mt-1.5">
            <button
              onClick={handleSaveNotes}
              disabled={savingNotes || notes === (contact.notes || '')}
              className="btn-secondary !py-1 !px-3 text-xs disabled:opacity-40"
            >
              {savingNotes ? 'Saving…' : 'Save note'}
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
          <button onClick={onClose} className="btn-secondary text-xs !py-1.5 ml-auto">Close</button>
        </div>
      </div>
    </div>
  );
}

export default function ContactsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [quickReply, setQuickReply] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['contacts', { search, status, page }],
    queryFn: () => api.get('/admin/contacts', { params: { search, status, page, limit: 15 } }).then((r) => r.data),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status, notes }) => api.put(`/admin/contacts/${id}/status`, { status, notes }),
    onSuccess: () => {
      qc.invalidateQueries(['contacts']);
      qc.invalidateQueries(['dashboard']);
    },
  });

  const replyMutation = useMutation({
    mutationFn: ({ id, replyMessage }) => api.post(`/admin/contacts/${id}/reply`, { replyMessage }),
    onSuccess: (_, { id }) => {
      toast.success('Reply sent successfully!');
      qc.invalidateQueries(['contacts']);
      qc.invalidateQueries(['dashboard']);
      setSelected((s) => s?.id === id ? { ...s, status: 'REPLIED' } : s);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to send reply. Check email settings.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/contacts/${id}`),
    onSuccess: () => {
      toast.success('Message deleted');
      qc.invalidateQueries(['contacts']);
      qc.invalidateQueries(['dashboard']);
      setDeleteId(null);
      setSelected(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Delete failed'),
  });

  const contacts = data?.data || [];
  const pagination = data?.pagination;

  const openContact = async (contact) => {
    setSelected(contact);
    if (contact.status === 'NEW') {
      updateStatus.mutate({ id: contact.id, status: 'READ' });
    }
  };

  const handleNotesSave = async (id, status, notes) => {
    await updateStatus.mutateAsync({ id, status, notes });
    setSelected((s) => ({ ...s, notes }));
    toast.success('Note saved');
  };

  return (
    <div>
      <PageHeader
        title="Contact Messages"
        subtitle={`${pagination?.total ?? 0} total`}
        action={
          <button
            onClick={() => downloadCsv('/admin/contacts/export', 'contacts.csv').catch(() => toast.error('Export failed'))}
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
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search messages..." />
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="input sm:w-44">
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <LoadingSpinner />
        ) : contacts.length === 0 ? (
          <EmptyState title="No messages yet" description="Contact form submissions will appear here." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                    <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">From</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400 hidden md:table-cell">Subject</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400 hidden sm:table-cell">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400 hidden lg:table-cell">Date</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {contacts.map((c) => (
                    <tr
                      key={c.id}
                      className={`hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors cursor-pointer ${c.status === 'NEW' ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                      onClick={() => openContact(c)}
                    >
                      <td className="px-4 py-3">
                        <div>
                          <p className={`font-medium text-gray-900 dark:text-white ${c.status === 'NEW' ? 'font-semibold' : ''}`}>{c.name}</p>
                          <p className="text-xs text-gray-400">{c.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400 hidden md:table-cell max-w-[200px]">
                        <p className="truncate">{c.subject}</p>
                        {c.notes && (
                          <p className="text-xs text-brand-500 dark:text-brand-400 mt-0.5 flex items-center gap-1">
                            <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
                            <span className="truncate">{c.notes}</span>
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell"><StatusBadge status={c.status} /></td>
                      <td className="px-4 py-3 text-xs text-gray-400 hidden lg:table-cell">{new Date(c.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          {/* Quick reply */}
                          <button
                            onClick={() => setQuickReply(c)}
                            className="p-1.5 text-gray-400 hover:text-blue-500 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
                            title="Quick reply"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                          </button>
                          <button onClick={() => setDeleteId(c.id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">
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
          contact={quickReply}
          onClose={() => setQuickReply(null)}
          onSend={(id, replyMessage) => replyMutation.mutateAsync({ id, replyMessage })}
        />
      )}

      {selected && (
        <ContactDetail
          contact={selected}
          onClose={() => setSelected(null)}
          onNotesSave={handleNotesSave}
          onReplySent={(id, replyMessage) => replyMutation.mutateAsync({ id, replyMessage })}
          onStatusChange={(id, status) => {
            updateStatus.mutate({ id, status });
            setSelected((s) => ({ ...s, status }));
          }}
        />
      )}

      <ConfirmDialog
        isOpen={!!deleteId}
        title="Delete Message"
        message="This will permanently delete this contact message."
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
