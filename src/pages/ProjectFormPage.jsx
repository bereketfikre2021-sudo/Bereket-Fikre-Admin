import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import toast from 'react-hot-toast';
import PageHeader from '../components/PageHeader';
import ImageUpload from '../components/ImageUpload';
import TagInput from '../components/TagInput';
import LoadingSpinner from '../components/LoadingSpinner';

// Categories matching the frontend Portfolio.jsx filter tabs exactly
const CATEGORY_OPTIONS = [
  { value: 'Recent Projects',    label: 'Recent Projects' },
  { value: 'Brand Identity',     label: 'Brand Identity' },
  { value: 'Digital Design',     label: 'Digital Design' },
  { value: 'Print & Marketing',  label: 'Print & Marketing' },
  { value: 'Creative Direction', label: 'Creative Direction' },
];

const EMPTY = {
  title: '', category: '', shortDescription: '', fullDescription: '',
  technologies: [], liveUrl: '', githubUrl: '', featured: false,
  displayOrder: 0, status: 'DRAFT', seoTitle: '', seoDescription: '',
};

export default function ProjectFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [form, setForm] = useState(EMPTY);
  const [thumbnail, setThumbnail] = useState(null); // File object
  const [errors, setErrors] = useState({});

  const { data: existing, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => api.get(`/admin/projects/${id}`).then((r) => r.data.data),
    enabled: isEdit,
  });

  useEffect(() => {
    if (existing) {
      setForm({
        title: existing.title || '',
        category: existing.category || '',
        shortDescription: existing.shortDescription || '',
        fullDescription: existing.fullDescription || '',
        technologies: existing.technologies || [],
        liveUrl: existing.liveUrl || '',
        githubUrl: existing.githubUrl || '',
        featured: existing.featured || false,
        displayOrder: existing.displayOrder ?? 0,
        status: existing.status || 'DRAFT',
        seoTitle: existing.seoTitle || '',
        seoDescription: existing.seoDescription || '',
      });
    }
  }, [existing]);

  const mutation = useMutation({
    mutationFn: (formData) => {
      const url = isEdit ? `/admin/projects/${id}` : '/admin/projects';
      const method = isEdit ? 'put' : 'post';
      return api[method](url, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Project updated!' : 'Project created!');
      qc.invalidateQueries(['projects']);
      qc.invalidateQueries(['dashboard']);
      navigate('/projects');
    },
    onError: (err) => {
      const data = err.response?.data;
      if (data?.errors) {
        const errs = {};
        data.errors.forEach(({ field, message }) => { errs[field] = message; });
        setErrors(errs);
        toast.error('Please fix the validation errors.');
      } else {
        toast.error(data?.message || 'Save failed.');
      }
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => {
      if (Array.isArray(v)) {
        v.forEach((item) => fd.append(k, item));
      } else {
        fd.append(k, v);
      }
    });
    if (thumbnail) fd.append('thumbnail', thumbnail);
    mutation.mutate(fd);
  };

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target?.value ?? e }));

  if (isEdit && isLoading) return <LoadingSpinner />;

  return (
    <div className="max-w-4xl">
      <PageHeader
        title={isEdit ? 'Edit Project' : 'New Project'}
        backTo="/projects"
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Fields */}
          <div className="lg:col-span-2 space-y-5">
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

              <TagInput label="Technologies Used" value={form.technologies} onChange={set('technologies')} placeholder="React, Figma, Photoshop..." />

              <div className="grid grid-cols-2 gap-4">
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
                <label className="label">SEO Title <span className="text-xs text-gray-400 font-normal">(max 60 chars)</span></label>
                <input value={form.seoTitle} onChange={set('seoTitle')} className="input" placeholder="Leave blank to use title" maxLength={60} />
                <p className="text-xs text-gray-400 mt-1">{form.seoTitle.length}/60</p>
              </div>
              <div>
                <label className="label">SEO Description <span className="text-xs text-gray-400 font-normal">(max 160 chars)</span></label>
                <textarea value={form.seoDescription} onChange={set('seoDescription')} rows={2} className="input resize-none" maxLength={160} />
                <p className="text-xs text-gray-400 mt-1">{form.seoDescription.length}/160</p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Thumbnail */}
            <div className="card p-4">
              <ImageUpload
                label="Thumbnail"
                currentUrl={existing?.thumbnail}
                onChange={setThumbnail}
                hint="JPG, PNG, WebP — recommended 600×400"
              />
            </div>

            {/* Settings */}
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

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                />
                <div>
                  <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">Show in Recent Projects</span>
                  <p className="text-xs text-gray-400 mt-0.5">Appears in the "Recent Projects" tab on the frontend</p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3">
          <button type="submit" disabled={mutation.isPending} className="btn-primary">
            {mutation.isPending ? (
              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
            ) : (isEdit ? 'Update Project' : 'Create Project')}
          </button>
          <button type="button" onClick={() => navigate('/projects')} className="btn-secondary">Cancel</button>
        </div>
      </form>
    </div>
  );
}
