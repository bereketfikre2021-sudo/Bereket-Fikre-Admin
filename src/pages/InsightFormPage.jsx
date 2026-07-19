import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import toast from 'react-hot-toast';
import PageHeader from '../components/PageHeader';
import ImageUpload from '../components/ImageUpload';
import TagInput from '../components/TagInput';
import LoadingSpinner from '../components/LoadingSpinner';
import RichTextEditor from '../components/RichTextEditor';
import { useUnsavedChanges, UnsavedBanner, useFormSaveShortcut } from '../hooks/useUnsavedChanges';

const DRAFT_KEY = 'admin_draft_insight';

const EMPTY = {
  type: 'CASE_STUDY', title: '', excerpt: '', content: '',
  category: '', tags: [], author: 'Bereket Fikre',
  readingTime: '', publishDate: '', status: 'DRAFT',
  seoTitle: '', seoDescription: '',
};

export default function InsightFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [form, setForm] = useState(EMPTY);
  const [coverImage, setCoverImage] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const [showRestoreBanner, setShowRestoreBanner] = useState(false);
  const handleSubmitRef = useRef(null);

  useUnsavedChanges(isDirty);
  useFormSaveShortcut(() => handleSubmitRef.current?.());

  // ── Draft autosave (new form only) ──────────────────────────────────────────
  useEffect(() => {
    if (isEdit) return;
    const saved = localStorage.getItem(DRAFT_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.title || parsed.excerpt) setShowRestoreBanner(true);
      } catch {}
    }
  }, [isEdit]);

  useEffect(() => {
    if (isEdit || !isDirty) return;
    const timer = setTimeout(() => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
    }, 800);
    return () => clearTimeout(timer);
  }, [form, isDirty, isEdit]);

  const restoreDraft = () => {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (!saved) return;
    try {
      setForm(JSON.parse(saved));
      setIsDirty(true);
      setShowRestoreBanner(false);
      toast.success('Draft restored');
    } catch {}
  };

  const discardDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
    setShowRestoreBanner(false);
  };

  const { data: existing, isLoading } = useQuery({
    queryKey: ['insight', id],
    queryFn: () => api.get(`/admin/insights/${id}`).then((r) => r.data.data),
    enabled: isEdit,
  });

  useEffect(() => {
    if (existing) {
      setForm({
        type: existing.type || 'CASE_STUDY',
        title: existing.title || '',
        excerpt: existing.excerpt || '',
        content: existing.content || '',
        category: existing.category || '',
        tags: existing.tags || [],
        author: existing.author || 'Bereket Fikre',
        readingTime: existing.readingTime || '',
        publishDate: existing.publishDate ? existing.publishDate.split('T')[0] : '',
        status: existing.status || 'DRAFT',
        seoTitle: existing.seoTitle || '',
        seoDescription: existing.seoDescription || '',
      });
    }
  }, [existing]);

  const mutation = useMutation({
    mutationFn: (fd) => {
      const url = isEdit ? `/admin/insights/${id}` : '/admin/insights';
      const method = isEdit ? 'put' : 'post';
      return api[method](url, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Insight updated!' : 'Insight created!');
      setIsDirty(false);
      localStorage.removeItem(DRAFT_KEY);
      qc.invalidateQueries(['insights']);
      qc.invalidateQueries(['dashboard']);
      navigate('/insights');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Save failed.'),
  });

  const handleSubmit = (e) => {
    e?.preventDefault();
    // Rich text editor produces HTML; treat empty paragraph as no content
    const contentText = form.content.replace(/<[^>]*>/g, '').trim();
    if (!contentText) {
      toast.error('Full content is required.');
      return;
    }
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => {
      if (Array.isArray(v)) v.forEach((item) => fd.append(k, item));
      else fd.append(k, v ?? '');
    });
    if (coverImage) fd.append('coverImage', coverImage);
    mutation.mutate(fd);
  };
  handleSubmitRef.current = handleSubmit;

  const set = (k) => (e) => { setForm((f) => ({ ...f, [k]: e.target?.value ?? e })); setIsDirty(true); };

  if (isEdit && isLoading) return <LoadingSpinner />;

  return (
    <div className="max-w-4xl">
      <UnsavedBanner isDirty={isDirty} />
      {/* Draft restore banner — new form only */}
      {showRestoreBanner && !isEdit && (
        <div className="mb-4 flex items-center gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 text-sm text-amber-800 dark:text-amber-200">
          <svg className="w-4 h-4 flex-shrink-0 text-amber-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          <span className="flex-1">You have an unsaved draft. Restore it?</span>
          <button onClick={restoreDraft} className="font-semibold underline hover:no-underline">Restore</button>
          <button onClick={discardDraft} className="text-amber-500 hover:text-amber-700 dark:hover:text-amber-300">Discard</button>
        </div>
      )}
      <PageHeader title={isEdit ? 'Edit Insight' : 'New Insight'} backTo="/insights" />

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          <div className="lg:col-span-2 space-y-5">
            <div className="card p-5 space-y-4">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Content</h2>

              <div>
                <label className="label">Type *</label>
                <div className="flex gap-3">
                  {['CASE_STUDY', 'BLOG_POST'].map((t) => (
                    <label key={t} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        value={t}
                        checked={form.type === t}
                        onChange={set('type')}
                        className="text-brand-600 focus:ring-brand-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {t === 'CASE_STUDY' ? 'Case Study' : 'Blog Post'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Title *</label>
                <input value={form.title} onChange={set('title')} className="input" placeholder="Insight title" required />
              </div>

              <div>
                <label className="label">Excerpt * <span className="text-xs text-gray-400 font-normal">(shown on card)</span></label>
                <textarea value={form.excerpt} onChange={set('excerpt')} rows={2} className="input resize-none" placeholder="Short summary..." required />
              </div>

              <div>
                <label className="label">Full Content *</label>
                <RichTextEditor
                  value={form.content}
                  onChange={(html) => { setForm((f) => ({ ...f, content: html })); setIsDirty(true); }}
                  placeholder="Write the full article content here…"
                  minHeight={400}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Category *</label>
                  <input value={form.category} onChange={set('category')} className="input" placeholder="Brand Design · Identity" required />
                </div>
                <div>
                  <label className="label">Author</label>
                  <input value={form.author} onChange={set('author')} className="input" />
                </div>
              </div>

              <TagInput label="Tags" value={form.tags} onChange={set('tags')} placeholder="branding, identity..." />
            </div>

            <div className="card p-5 space-y-4">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">SEO</h2>
              <div>
                <label className="label">SEO Title</label>
                <input value={form.seoTitle} onChange={set('seoTitle')} className="input" maxLength={60} />
                <p className="text-xs text-gray-400 mt-1">{form.seoTitle.length}/60</p>
              </div>
              <div>
                <label className="label">SEO Description</label>
                <textarea value={form.seoDescription} onChange={set('seoDescription')} rows={2} className="input resize-none" maxLength={160} />
                <p className="text-xs text-gray-400 mt-1">{form.seoDescription.length}/160</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="card p-4">
              <ImageUpload label="Cover Image" currentUrl={existing?.coverImage} onChange={setCoverImage} />
            </div>

            <div className="card p-4 space-y-4">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Settings</h2>
              <div>
                <label className="label">Status</label>
                <select value={form.status} onChange={set('status')} className="input">
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                </select>
              </div>
              <div>
                <label className="label">Publish Date</label>
                <input type="date" value={form.publishDate} onChange={set('publishDate')} className="input" />
              </div>
              <div>
                <label className="label">Reading Time (min)</label>
                <input type="number" value={form.readingTime} onChange={set('readingTime')} className="input" placeholder="Auto-calculated" min={1} />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button type="submit" disabled={mutation.isPending} className="btn-primary flex-1 sm:flex-none justify-center">
            {mutation.isPending ? (
              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
            ) : (isEdit ? 'Update Insight' : 'Create Insight')}
          </button>
          <button type="button" onClick={() => navigate('/insights')} className="btn-secondary flex-1 sm:flex-none justify-center">Cancel</button>
        </div>
      </form>
    </div>
  );
}
