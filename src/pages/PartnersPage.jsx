import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import toast from 'react-hot-toast';
import PageHeader from '../components/PageHeader';
import LoadingSpinner from '../components/LoadingSpinner';
import ConfirmDialog from '../components/ConfirmDialog';
import ImageUpload from '../components/ImageUpload';
import InlineThumbnail from '../components/InlineThumbnail';

// ---- Partner Card Form (inline modal) ----
function PartnerModal({ partner, onClose, onSave }) {
  const [form, setForm] = useState({ companyName: partner?.companyName || '', website: partner?.website || '', displayOrder: partner?.displayOrder ?? 0, isActive: partner?.isActive !== false });
  const [logo, setLogo] = useState(null);
  const [saving, setSaving] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target?.value ?? e }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (logo) fd.append('logo', logo);
    await onSave(fd);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="card max-w-md w-full p-6 shadow-xl">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">{partner ? 'Edit Partner' : 'Add Partner'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <ImageUpload label="Logo" currentUrl={partner?.logo} onChange={setLogo} hint="PNG, WebP, SVG" />
          <div>
            <label className="label">Company Name *</label>
            <input value={form.companyName} onChange={set('companyName')} className="input" required />
          </div>
          <div>
            <label className="label">Website</label>
            <input value={form.website} onChange={set('website')} className="input" type="url" placeholder="https://..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Display Order</label>
              <input type="number" value={form.displayOrder} onChange={set('displayOrder')} className="input" min={0} />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} className="w-4 h-4 rounded border-gray-300 text-brand-600" />
                <span className="text-sm">Active</span>
              </label>
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
              {saving ? 'Saving...' : (partner ? 'Update' : 'Create')}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---- Testimonial Card Form (inline modal) ----
function TestimonialModal({ t, onClose, onSave }) {
  const [form, setForm] = useState({
    clientName: t?.clientName || '', company: t?.company || '', position: t?.position || '',
    testimonial: t?.testimonial || '', rating: t?.rating ?? 5,
    featured: t?.featured || false, displayOrder: t?.displayOrder ?? 0, isActive: t?.isActive !== false,
  });
  const [profileImage, setProfileImage] = useState(null);
  const [saving, setSaving] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target?.value ?? e }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (profileImage) fd.append('profileImage', profileImage);
    await onSave(fd);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
      <div className="card max-w-lg w-full p-6 shadow-xl my-4">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">{t ? 'Edit Testimonial' : 'Add Testimonial'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <ImageUpload label="Profile Image" currentUrl={t?.profileImage} onChange={setProfileImage} hint="Square image recommended" />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Client Name *</label>
              <input value={form.clientName} onChange={set('clientName')} className="input" required />
            </div>
            <div>
              <label className="label">Company</label>
              <input value={form.company} onChange={set('company')} className="input" />
            </div>
          </div>
          <div>
            <label className="label">Position</label>
            <input value={form.position} onChange={set('position')} className="input" placeholder="CEO, Designer..." />
          </div>
          <div>
            <label className="label">Testimonial *</label>
            <textarea value={form.testimonial} onChange={set('testimonial')} rows={3} className="input resize-none" required />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Rating (1-5)</label>
              <input type="number" value={form.rating} onChange={set('rating')} className="input" min={1} max={5} />
            </div>
            <div>
              <label className="label">Order</label>
              <input type="number" value={form.displayOrder} onChange={set('displayOrder')} className="input" min={0} />
            </div>
            <div className="flex flex-col gap-1.5 justify-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input type="checkbox" checked={form.featured} onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))} className="w-4 h-4 rounded border-gray-300 text-brand-600" />
                Featured
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} className="w-4 h-4 rounded border-gray-300 text-brand-600" />
                Active
              </label>
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
              {saving ? 'Saving...' : (t ? 'Update' : 'Create')}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---- Main Page ----
export default function PartnersPage() {
  const qc = useQueryClient();
  const [partnerModal, setPartnerModal] = useState(null); // null | 'new' | partner object
  const [testimonialModal, setTestimonialModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null); // { type, id }

  const { data: partnersData, isLoading: loadingPartners } = useQuery({
    queryKey: ['partners'],
    queryFn: () => api.get('/partners', { params: { limit: 50 } }).then((r) => r.data),
  });

  const { data: testimonialsData, isLoading: loadingTestimonials } = useQuery({
    queryKey: ['testimonials'],
    queryFn: () => api.get('/testimonials', { params: { limit: 50 } }).then((r) => r.data),
  });

  const savePartner = async (fd) => {
    try {
      if (partnerModal && partnerModal !== 'new') {
        await api.put(`/admin/partners/${partnerModal.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Partner updated');
      } else {
        await api.post('/admin/partners', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Partner added');
      }
      qc.invalidateQueries(['partners']);
      setPartnerModal(null);
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
  };

  const saveTestimonial = async (fd) => {
    try {
      if (testimonialModal && testimonialModal !== 'new') {
        await api.put(`/admin/testimonials/${testimonialModal.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Testimonial updated');
      } else {
        await api.post('/admin/testimonials', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Testimonial added');
      }
      qc.invalidateQueries(['testimonials']);
      setTestimonialModal(null);
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
  };

  const deleteMutation = useMutation({
    mutationFn: ({ type, id }) => api.delete(`/admin/${type}/${id}`),
    onSuccess: (_, { type }) => {
      toast.success(`${type === 'partners' ? 'Partner' : 'Testimonial'} deleted`);
      qc.invalidateQueries([type]);
      setDeleteTarget(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Delete failed'),
  });

  const partners = partnersData?.data || [];
  const testimonials = testimonialsData?.data || [];

  return (
    <div className="space-y-8">
      {/* Partners */}
      <div>
        <PageHeader
          title="Trusted Partners"
          subtitle={`${partners.length} partners`}
          action={
            <button onClick={() => setPartnerModal('new')} className="btn-primary">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add Partner
            </button>
          }
        />

        {loadingPartners ? <LoadingSpinner /> : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {partners.map((p) => (
              <div key={p.id} className="card p-4 flex items-center gap-3">
                <InlineThumbnail
                  src={p.logo}
                  alt={p.companyName}
                  endpoint={`/admin/partners/${p.id}/logo`}
                  fieldName="logo"
                  onSuccess={(updated) => {
                    qc.setQueryData(['partners'], (old) => old
                      ? { ...old, data: old.data.map((x) => x.id === updated.id ? { ...x, logo: updated.logo } : x) }
                      : old
                    );
                  }}
                  size="w-12 h-12"
                  shape="rounded-lg"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white text-sm truncate">{p.companyName}</p>
                  <p className="text-xs text-gray-400 truncate">{p.website || 'No website'}</p>
                  {!p.isActive && <span className="text-xs text-red-500">Inactive</span>}
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => setPartnerModal(p)} className="p-1.5 text-gray-400 hover:text-brand-600 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-900/20">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button onClick={() => setDeleteTarget({ type: 'partners', id: p.id })} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Testimonials */}
      <div>
        <PageHeader
          title="Client Testimonials"
          subtitle={`${testimonials.length} testimonials`}
          action={
            <button onClick={() => setTestimonialModal('new')} className="btn-primary">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add Testimonial
            </button>
          }
        />

        {loadingTestimonials ? <LoadingSpinner /> : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {testimonials.map((t) => (
              <div key={t.id} className="card p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <InlineThumbnail
                      src={t.profileImage}
                      alt={t.clientName}
                      endpoint={`/admin/testimonials/${t.id}/image`}
                      fieldName="profileImage"
                      onSuccess={(updated) => {
                        qc.setQueryData(['testimonials'], (old) => old
                          ? { ...old, data: old.data.map((x) => x.id === updated.id ? { ...x, profileImage: updated.profileImage } : x) }
                          : old
                        );
                      }}
                      size="w-8 h-8"
                      shape="rounded-full"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{t.clientName}</p>
                      <p className="text-xs text-gray-400">{t.company}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => setTestimonialModal(t)} className="p-1 text-gray-400 hover:text-brand-600 rounded">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button onClick={() => setDeleteTarget({ type: 'testimonials', id: t.id })} className="p-1 text-gray-400 hover:text-red-500 rounded">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">"{t.testimonial}"</p>
                <div className="flex items-center gap-1 mt-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <svg key={i} className={`w-3 h-3 ${i < t.rating ? 'text-yellow-400' : 'text-gray-200 dark:text-gray-700'}`} fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                  {t.featured && <span className="ml-1 text-xs text-brand-600 dark:text-brand-400">Featured</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {partnerModal !== null && (
        <PartnerModal
          partner={partnerModal === 'new' ? null : partnerModal}
          onClose={() => setPartnerModal(null)}
          onSave={savePartner}
        />
      )}
      {testimonialModal !== null && (
        <TestimonialModal
          t={testimonialModal === 'new' ? null : testimonialModal}
          onClose={() => setTestimonialModal(null)}
          onSave={saveTestimonial}
        />
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Item"
        message="This action cannot be undone."
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
