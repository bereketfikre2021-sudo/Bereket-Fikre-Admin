import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import toast from 'react-hot-toast';
import PageHeader from '../components/PageHeader';
import ImageUpload from '../components/ImageUpload';
import TagInput from '../components/TagInput';
import LoadingSpinner from '../components/LoadingSpinner';
import { useUnsavedChanges, UnsavedBanner, useFormSaveShortcut } from '../hooks/useUnsavedChanges';

const EMPTY = {
  serviceNumber: '01', title: '', category: '', shortDescription: '',
  fullDescription: '', bulletPoints: [], technologies: [],
  ctaText: 'Request a Quote', ctaLink: '#contact',
  displayOrder: 0, featured: false, isActive: true,
  type: '', deliveryTime: '', seoTitle: '', seoDescription: '',
  iconSvg: '', iconClass: '',
};

export default function ServiceFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [form, setForm] = useState(EMPTY);
  const [featuredImage, setFeaturedImage] = useState(null);
  const [bulletInput, setBulletInput] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const handleSubmitRef = useRef(null);

  useUnsavedChanges(isDirty);
  useFormSaveShortcut(() => handleSubmitRef.current?.());

  const { data: existing, isLoading } = useQuery({
    queryKey: ['service', id],
    queryFn: () => api.get(`/admin/services/${id}`).then((r) => r.data.data),
    enabled: isEdit,
  });

  useEffect(() => {
    if (existing) {
      setForm({
        serviceNumber: existing.serviceNumber || '01',
        title: existing.title || '',
        category: existing.category || '',
        shortDescription: existing.shortDescription || '',
        fullDescription: existing.fullDescription || '',
        bulletPoints: existing.bulletPoints || [],
        technologies: existing.technologies || [],
        ctaText: existing.ctaText || 'Request a Quote',
        ctaLink: existing.ctaLink || '#contact',
        displayOrder: existing.displayOrder ?? 0,
        featured: existing.featured || false,
        isActive: existing.isActive !== false,
        type: existing.type || '',
        deliveryTime: existing.deliveryTime || '',
        seoTitle: existing.seoTitle || '',
        seoDescription: existing.seoDescription || '',
        iconSvg: existing.iconSvg || '',
        iconClass: existing.iconClass || '',
      });
    }
  }, [existing]);

  const mutation = useMutation({
    mutationFn: (fd) => {
      const url = isEdit ? `/admin/services/${id}` : '/admin/services';
      const method = isEdit ? 'put' : 'post';
      return api[method](url, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Service updated!' : 'Service created!');
      setIsDirty(false);
      qc.invalidateQueries(['services']);
      navigate('/services');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Save failed.'),
  });

  const handleSubmit = (e) => {
    e?.preventDefault();
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => {
      if (Array.isArray(v)) v.forEach((item) => fd.append(k, item));
      else fd.append(k, v ?? '');
    });
    if (featuredImage) fd.append('featuredImage', featuredImage);
    mutation.mutate(fd);
  };
  handleSubmitRef.current = handleSubmit;

  const set = (k) => (e) => { setForm((f) => ({ ...f, [k]: e.target?.value ?? e })); setIsDirty(true); };

  const addBullet = () => {
    if (bulletInput.trim()) {
      setForm((f) => ({ ...f, bulletPoints: [...f.bulletPoints, bulletInput.trim()] }));
      setBulletInput('');
    }
  };

  const removeBullet = (i) =>
    setForm((f) => ({ ...f, bulletPoints: f.bulletPoints.filter((_, idx) => idx !== i) }));

  if (isEdit && isLoading) return <LoadingSpinner />;

  return (
    <div className="max-w-4xl">
      <UnsavedBanner isDirty={isDirty} />
      <PageHeader title={isEdit ? 'Edit Service' : 'New Service'} backTo="/services" />

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            <div className="card p-5 space-y-4">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Basic Info</h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Service Number</label>
                  <input value={form.serviceNumber} onChange={set('serviceNumber')} className="input" placeholder="01" />
                </div>
                <div>
                  <label className="label">Category *</label>
                  <input value={form.category} onChange={set('category')} className="input" placeholder="Branding Service" required />
                </div>
              </div>

              <div>
                <label className="label">Title *</label>
                <input value={form.title} onChange={set('title')} className="input" placeholder="Brand Identity" required />
              </div>

              <div>
                <label className="label">Short Description * <span className="text-xs text-gray-400 font-normal">(shown on homepage cards)</span></label>
                <input value={form.shortDescription} onChange={set('shortDescription')} className="input" placeholder="Logo design, visual systems, brand consistency" required />
              </div>

              <div>
                <label className="label">Full Description</label>
                <textarea value={form.fullDescription} onChange={set('fullDescription')} rows={4} className="input" placeholder="Detailed description for modal" />
              </div>

              {/* Bullet Points */}
              <div>
                <label className="label">What's Included (Bullet Points)</label>
                <div className="space-y-2">
                  {form.bulletPoints.map((bp, i) => (
                    <div key={i} className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
                      <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">{bp}</span>
                      <button type="button" onClick={() => removeBullet(i)} className="text-gray-400 hover:text-red-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <input
                      value={bulletInput}
                      onChange={(e) => setBulletInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addBullet(); } }}
                      className="input flex-1"
                      placeholder="Add bullet point..."
                    />
                    <button type="button" onClick={addBullet} className="btn-secondary">Add</button>
                  </div>
                </div>
              </div>

              <TagInput label="Technologies / Tools" value={form.technologies} onChange={set('technologies')} />
            </div>

            {/* CTA & SEO */}
            <div className="card p-5 space-y-4">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">CTA & Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">CTA Button Text</label>
                  <input value={form.ctaText} onChange={set('ctaText')} className="input" />
                </div>
                <div>
                  <label className="label">CTA Button Link</label>
                  <input value={form.ctaLink} onChange={set('ctaLink')} className="input" />
                </div>
                <div>
                  <label className="label">Service Type</label>
                  <input value={form.type} onChange={set('type')} className="input" placeholder="Complete Branding" />
                </div>
                <div>
                  <label className="label">Delivery Time</label>
                  <input value={form.deliveryTime} onChange={set('deliveryTime')} className="input" placeholder="14-21 Business Days" />
                </div>
              </div>
              <div>
                <label className="label">Icon Class</label>
                <input value={form.iconClass} onChange={set('iconClass')} className="input" placeholder="Optional CSS icon class" />
              </div>
              <div>
                <label className="label">Icon SVG</label>
                <textarea value={form.iconSvg} onChange={set('iconSvg')} rows={3} className="input font-mono text-xs" placeholder="<svg>...</svg>" />
              </div>
            </div>

            <div className="card p-5 space-y-4">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">SEO</h2>
              <div>
                <label className="label">SEO Title</label>
                <input value={form.seoTitle} onChange={set('seoTitle')} className="input" maxLength={60} />
              </div>
              <div>
                <label className="label">SEO Description</label>
                <textarea value={form.seoDescription} onChange={set('seoDescription')} rows={2} className="input resize-none" maxLength={160} />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="card p-4">
              <ImageUpload label="Featured Image" currentUrl={existing?.featuredImage} onChange={setFeaturedImage} />
            </div>

            <div className="card p-4 space-y-4">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Settings</h2>
              <div>
                <label className="label">Display Order</label>
                <input type="number" value={form.displayOrder} onChange={set('displayOrder')} className="input" min={0} />
              </div>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input type="checkbox" checked={form.featured} onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))} className="w-4 h-4 rounded border-gray-300 text-brand-600" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Featured</span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} className="w-4 h-4 rounded border-gray-300 text-brand-600" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
              </label>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={mutation.isPending} className="btn-primary">
            {mutation.isPending ? (
              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
            ) : (isEdit ? 'Update Service' : 'Create Service')}
          </button>
          <button type="button" onClick={() => navigate('/services')} className="btn-secondary">Cancel</button>
        </div>
      </form>
    </div>
  );
}
