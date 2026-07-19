import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import toast from 'react-hot-toast';
import PageHeader from '../components/PageHeader';
import ImageUpload from '../components/ImageUpload';
import TagInput from '../components/TagInput';
import LoadingSpinner from '../components/LoadingSpinner';
import ConfirmDialog from '../components/ConfirmDialog';
import { useUnsavedChanges, UnsavedBanner, useFormSaveShortcut } from '../hooks/useUnsavedChanges';

const DRAFT_KEY = 'admin_draft_project';

const CATEGORY_OPTIONS = [
  { value: 'Recent Projects',                label: 'Recent Projects' },
  { value: 'Brand Identity',                 label: 'Brand Identity' },
  { value: 'Digital Design · Social Media',  label: 'Digital Design — Social Media' },
  { value: 'Digital Design · Web Banners',   label: 'Digital Design — Web Banners' },
  { value: 'Print & Marketing',              label: 'Print & Marketing' },
  { value: 'Creative Direction',             label: 'Creative Direction' },
];

const EMPTY = {
  title: '', category: '', shortDescription: '', fullDescription: '',
  technologies: [], liveUrl: '', githubUrl: '', featured: false,
  displayOrder: 0, status: 'DRAFT', seoTitle: '', seoDescription: '',
};

export default function ProjectFormPage() {
  const { id }    = useParams();
  const isEdit    = !!id;
  const navigate  = useNavigate();
  const qc        = useQueryClient();

  const [form,            setForm]           = useState(EMPTY);
  const [thumbnail,       setThumbnail]      = useState(null);
  const [errors,          setErrors]         = useState({});
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [deleteGalleryId, setDeleteGalleryId] = useState(null);
  const [isDirty,         setIsDirty]        = useState(false);
  const [showRestoreBanner, setShowRestoreBanner] = useState(false);
  const galleryInputRef = useRef(null);

  useUnsavedChanges(isDirty);
  const handleSubmitRef = useRef(null);
  useFormSaveShortcut(() => handleSubmitRef.current?.());

  // ── Draft autosave (new form only) ──────────────────────────────────────────
  useEffect(() => {
    if (isEdit) return;
    const saved = localStorage.getItem(DRAFT_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.title || parsed.shortDescription) setShowRestoreBanner(true);
      } catch {}
    }
  }, [isEdit]);

  // Autosave to localStorage every time form changes (new form only)
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

  // ── Fetch existing project (edit mode) ──────────────────────────────────────
  const { data: existing, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn:  () => api.get(`/admin/projects/${id}`).then((r) => r.data.data),
    enabled:  isEdit,
  });

  useEffect(() => {
    if (existing) {
      setForm({
        title:            existing.title            || '',
        category:         existing.category         || '',
        shortDescription: existing.shortDescription || '',
        fullDescription:  existing.fullDescription  || '',
        technologies:     existing.technologies     || [],
        liveUrl:          existing.liveUrl           || '',
        githubUrl:        existing.githubUrl         || '',
        featured:         existing.featured          || false,
        displayOrder:     existing.displayOrder      ?? 0,
        status:           existing.status            || 'DRAFT',
        seoTitle:         existing.seoTitle          || '',
        seoDescription:   existing.seoDescription    || '',
      });
    }
  }, [existing]);

  const galleryImages = existing?.galleryImages || [];

  // ── Save project ─────────────────────────────────────────────────────────────
  const mutation = useMutation({
    mutationFn: (fd) => {
      const url    = isEdit ? `/admin/projects/${id}` : '/admin/projects';
      const method = isEdit ? 'put' : 'post';
      return api[method](url, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Project updated!' : 'Project created!');
      setIsDirty(false);
      localStorage.removeItem(DRAFT_KEY);
      qc.invalidateQueries(['projects']);
      qc.invalidateQueries(['dashboard']);
      navigate('/projects');
    },
    onError: (err) => {
      const data = err.response?.data;
      if (data?.errors && data.errors.length > 0) {
        const errs = {};
        data.errors.forEach(({ field, message }) => { errs[field] = message; });
        setErrors(errs);
        const details = data.errors.map(({ field, message }) => `${field}: ${message}`).join('\n');
        toast.error(`Validation failed:\n${details}`, { duration: 8000 });
      } else {
        toast.error(data?.message || 'Save failed.');
      }
    },
  });

  const handleSubmit = (e) => {
    e?.preventDefault();
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => {
      if (Array.isArray(v)) v.forEach((item) => fd.append(k, item));
      else fd.append(k, v);
    });
    if (thumbnail) fd.append('thumbnail', thumbnail);
    mutation.mutate(fd);
  };
  handleSubmitRef.current = handleSubmit;

  const set = (k) => (e) => { setForm((f) => ({ ...f, [k]: e.target?.value ?? e })); setIsDirty(true); };

  // ── Gallery handlers (edit mode only) ────────────────────────────────────────
  const handleGalleryUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setGalleryUploading(true);
    try {
      for (const file of files) {
        const fd = new FormData();
        fd.append('image', file);
        await api.post(`/admin/projects/${id}/gallery`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      toast.success(`${files.length} image${files.length > 1 ? 's' : ''} uploaded`);
      qc.invalidateQueries(['project', id]);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setGalleryUploading(false);
      e.target.value = '';
    }
  };

  const handleGalleryDelete = async () => {
    try {
      await api.delete(`/admin/projects/${id}/gallery/${deleteGalleryId}`);
      toast.success('Image removed');
      qc.invalidateQueries(['project', id]);
      setDeleteGalleryId(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

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
      <PageHeader title={isEdit ? 'Edit Project' : 'New Project'} backTo="/projects" />

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">

          {/* ── Left column ── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Basic Info */}
            <div className="card p-5 space-y-4">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Basic Info</h2>

              <div>
                <label className="label">Title *</label>
                <input value={form.title} onChange={set('title')} className="input" placeholder="Project title" required />
                {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
              </div>

              <div>
                <label className="label">Category *</label>
                <select value={form.category} onChange={set('category')} className="input" required>
                  <option value="">Select a category...</option>
                  {CATEGORY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category}</p>}
              </div>

              <div>
                <label className="label">Short Description *</label>
                <textarea value={form.shortDescription} onChange={set('shortDescription')} rows={2} className="input resize-none" placeholder="Brief summary (shown on cards)" required />
                <p className="text-xs text-gray-400 mt-1">{form.shortDescription.length}/500</p>
              </div>

              <div>
                <label className="label">Full Description *</label>
                <textarea value={form.fullDescription} onChange={set('fullDescription')} rows={5} className="input" placeholder="Detailed project description" required />
              </div>

              <TagInput label="Technologies Used" value={form.technologies} onChange={set('technologies')} placeholder="Adobe Illustrator, Figma..." />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Live URL</label>
                  <input value={form.liveUrl} onChange={set('liveUrl')} className="input" placeholder="https://..." type="url" />
                </div>
                <div>
                  <label className="label">GitHub URL</label>
                  <input value={form.githubUrl} onChange={set('githubUrl')} className="input" placeholder="https://github.com/..." type="url" />
                </div>
              </div>
            </div>

            {/* SEO */}
            <div className="card p-5 space-y-4">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">SEO</h2>
              <div>
                <label className="label">SEO Title <span className="text-xs text-gray-400 font-normal">(max 60)</span></label>
                <input value={form.seoTitle} onChange={set('seoTitle')} className="input" placeholder="Leave blank to use title" maxLength={60} />
                <p className="text-xs text-gray-400 mt-1">{form.seoTitle.length}/60</p>
              </div>
              <div>
                <label className="label">SEO Description <span className="text-xs text-gray-400 font-normal">(max 160)</span></label>
                <textarea value={form.seoDescription} onChange={set('seoDescription')} rows={2} className="input resize-none" maxLength={160} />
                <p className="text-xs text-gray-400 mt-1">{form.seoDescription.length}/160</p>
              </div>
            </div>
          </div>

          {/* ── Right sidebar ── */}
          <div className="space-y-4">
            <div className="card p-4">
              <ImageUpload
                label="Thumbnail"
                currentUrl={existing?.thumbnail}
                onChange={setThumbnail}
                hint="JPG, PNG, WebP — 600×400 recommended"
              />
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
                <label className="label">Display Order</label>
                <input type="number" value={form.displayOrder} onChange={set('displayOrder')} className="input" min={0} />
              </div>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) => { setForm((f) => ({ ...f, featured: e.target.checked })); setIsDirty(true); }}
                  className="w-4 h-4 mt-0.5 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                />
                <div>
                  <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">Show in Recent Projects</span>
                  <p className="text-xs text-gray-400 mt-0.5">Appears in the "Recent Projects" tab</p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* ── Gallery — full width, edit mode only ── */}
        {isEdit && (
          <div className="card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                Gallery Images
                <span className="ml-2 text-xs font-normal text-gray-400 normal-case">
                  ({galleryImages.length} image{galleryImages.length !== 1 ? 's' : ''})
                </span>
              </h2>
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                disabled={galleryUploading}
                className="btn-secondary !py-1.5 !px-3 text-xs"
              >
                {galleryUploading ? (
                  <><div className="w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" /> Uploading...</>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Add Images
                  </>
                )}
              </button>
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                multiple
                className="hidden"
                onChange={handleGalleryUpload}
              />
            </div>

            {galleryImages.length === 0 ? (
              <div
                className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg py-10 text-center cursor-pointer hover:border-brand-400 transition-colors"
                onClick={() => galleryInputRef.current?.click()}
              >
                <svg className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm text-gray-400">Click to add gallery images</p>
                <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">JPG, PNG, WebP — select multiple at once</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {galleryImages.map((img) => (
                  <div key={img.id} className="relative group rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800" style={{ aspectRatio: '16/9' }}>
                    <img src={img.url} alt={img.altText || 'Gallery'} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => setDeleteGalleryId(img.id)}
                        className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                        title="Remove"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
                {/* Add more tile */}
                <div
                  className="rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-brand-400 transition-colors flex items-center justify-center cursor-pointer"
                  style={{ aspectRatio: '16/9' }}
                  onClick={() => galleryInputRef.current?.click()}
                >
                  <div className="text-center">
                    <svg className="w-6 h-6 text-gray-300 dark:text-gray-600 mx-auto mb-1" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    <p className="text-xs text-gray-400">Add more</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Submit ── */}
        <div className="flex flex-wrap gap-3">
          <button type="submit" disabled={mutation.isPending} className="btn-primary flex-1 sm:flex-none justify-center">
            {mutation.isPending ? (
              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
            ) : (isEdit ? 'Update Project' : 'Create Project')}
          </button>
          <button type="button" onClick={() => navigate('/projects')} className="btn-secondary">Cancel</button>
        </div>
      </form>

      {/* Gallery delete confirmation */}
      <ConfirmDialog
        isOpen={!!deleteGalleryId}
        title="Remove Gallery Image"
        message="This will permanently delete this image. This cannot be undone."
        onConfirm={handleGalleryDelete}
        onCancel={() => setDeleteGalleryId(null)}
      />
    </div>
  );
}
