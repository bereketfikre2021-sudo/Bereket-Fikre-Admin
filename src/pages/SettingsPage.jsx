import { useState, useRef, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import toast from 'react-hot-toast';
import PageHeader from '../components/PageHeader';

// ─── Shared helpers ───────────────────────────────────────────────────────────
const EyeOff = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
  </svg>
);
const EyeOn = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

function InfoRow({ label, value, mono }) {
  return (
    <div className="flex justify-between items-center py-2.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
      <span className={`text-sm font-medium text-gray-900 dark:text-white truncate max-w-xs ${mono ? 'font-mono text-xs' : ''}`}>{value ?? '—'}</span>
    </div>
  );
}

function SectionCard({ title, description, children }) {
  return (
    <div className="card p-6">
      <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-1">{title}</h2>
      {description && <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{description}</p>}
      {children}
    </div>
  );
}

function ImageUploadCard({ label, hint, currentUrl, uploading, onFile }) {
  const inputRef = useRef(null);
  return (
    <div className="space-y-2">
      <label className="label">{label}</label>
      {hint && <p className="text-xs text-gray-400 -mt-1">{hint}</p>}
      <div
        className="relative group cursor-pointer rounded-lg overflow-hidden border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-brand-400 transition-colors"
        style={{ aspectRatio: '4/3' }}
        onClick={() => inputRef.current?.click()}
      >
        {currentUrl ? (
          <img src={currentUrl} alt={label} className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-gray-400">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <span className="text-xs">Click to upload</span>
          </div>
        )}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          {uploading ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : <span className="text-white text-xs font-medium">{currentUrl ? 'Change image' : 'Upload image'}</span>}
        </div>
        <input ref={inputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" className="hidden" onChange={onFile} />
      </div>
    </div>
  );
}

// ─── GENERAL TAB ─────────────────────────────────────────────────────────────
function GeneralTab() {
  return (
    <div className="space-y-6">
      <SectionCard title="Site Identity" description="Core information about this portfolio site.">
        <InfoRow label="Site Name" value="Bereket Fikre Portfolio" />
        <InfoRow label="Owner" value="Bereket Fikre" />
        <InfoRow label="Email" value="bereketfikre2021@gmail.com" />
        <InfoRow label="Frontend URL" value="https://bereketfikre.et" />
        <InfoRow label="Admin URL" value="http://localhost:4000" />
      </SectionCard>
      <SectionCard title="Environment" description="Current runtime configuration.">
        <InfoRow label="Node Environment" value="development" />
        <InfoRow label="API Port" value="5000" />
        <InfoRow label="Database" value="Neon PostgreSQL" />
        <InfoRow label="Storage" value="Cloudinary CDN" />
      </SectionCard>
    </div>
  );
}

// ─── SEO TAB ─────────────────────────────────────────────────────────────────
function SeoTab() {
  return (
    <div className="space-y-6">
      <SectionCard title="SEO Overview" description="Search engine optimization is managed per-content item. Each project, service, and insight has its own SEO title and description fields.">
        <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
          {[
            { item: 'Projects', path: '/projects', note: 'Edit any project → SEO section' },
            { item: 'Services', path: '/services', note: 'Edit any service → SEO section' },
            { item: 'Insights', path: '/insights', note: 'Edit any insight → SEO section' },
          ].map((r) => (
            <div key={r.item} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
              <div>
                <p className="font-medium text-gray-900 dark:text-white text-sm">{r.item}</p>
                <p className="text-xs text-gray-400 mt-0.5">{r.note}</p>
              </div>
              <a href={r.path} className="text-xs text-brand-600 dark:text-brand-400 hover:underline">Go →</a>
            </div>
          ))}
        </div>
      </SectionCard>
      <SectionCard title="Sitemap & Robots" description="Static files are deployed with the frontend build.">
        <InfoRow label="Sitemap" value="/sitemap.xml" mono />
        <InfoRow label="Robots.txt" value="/robots.txt" mono />
        <InfoRow label="OG Image" value="/og-image.png (auto-generated on build)" />
      </SectionCard>
    </div>
  );
}

// ─── SOCIAL TAB ──────────────────────────────────────────────────────────────
function SocialTab() {
  const links = [
    { label: 'Behance',   url: 'https://www.behance.net/bereketfikre' },
    { label: 'LinkedIn',  url: 'https://www.linkedin.com/in/bereketfikre' },
    { label: 'Instagram', url: 'https://www.instagram.com/bereketfikre' },
    { label: 'Twitter/X', url: '' },
    { label: 'GitHub',    url: '' },
  ];
  return (
    <div className="space-y-6">
      <SectionCard title="Social Links" description="Manage your public social media profiles. To update, edit the frontend Navigation or Footer component directly.">
        {links.map((l) => (
          <div key={l.label} className="flex items-center justify-between py-2.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
            <span className="text-sm text-gray-500 dark:text-gray-400 w-28">{l.label}</span>
            {l.url ? (
              <a href={l.url} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-600 dark:text-brand-400 hover:underline truncate max-w-xs">{l.url}</a>
            ) : (
              <span className="text-xs text-gray-400 italic">Not set</span>
            )}
          </div>
        ))}
      </SectionCard>
    </div>
  );
}

// ─── CLOUDINARY TAB ──────────────────────────────────────────────────────────
function CloudinaryTab() {
  return (
    <div className="space-y-6">
      <SectionCard title="Cloudinary Configuration" description="Media storage credentials. Manage these in your .env file or Render dashboard.">
        <InfoRow label="Cloud Name" value="gmkts6ct" mono />
        <InfoRow label="API Key" value="969687•••••••" mono />
        <InfoRow label="API Secret" value="••••••••••••••••" mono />
        <InfoRow label="Status" value="✓ Connected" />
      </SectionCard>
      <SectionCard title="Storage Folders" description="Images are organised into these Cloudinary folders.">
        {[
          'bereketfikre/services',
          'bereketfikre/featured-projects',
          'bereketfikre/case-studies',
          'bereketfikre/design-blogs',
          'bereketfikre/testimonials',
          'bereketfikre/trusted-partners',
          'bereketfikre/site-content',
        ].map((f) => (
          <div key={f} className="py-1.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
            <span className="text-sm font-mono text-gray-700 dark:text-gray-300">{f}</span>
          </div>
        ))}
      </SectionCard>
    </div>
  );
}

// ─── SECURITY TAB ────────────────────────────────────────────────────────────
function SecurityTab() {
  const { admin } = useAuth();
  return (
    <div className="space-y-6">
      <SectionCard title="Authentication" description="JWT-based authentication with refresh token rotation.">
        <InfoRow label="Access Token TTL" value="1 hour" />
        <InfoRow label="Refresh Token TTL" value="7 days" />
        <InfoRow label="Last Login" value={admin?.lastLoginAt ? new Date(admin.lastLoginAt).toLocaleString() : '—'} />
        <InfoRow label="Active Sessions" value="1" />
      </SectionCard>
      <SectionCard title="Rate Limiting" description="Applied to all /api routes to prevent abuse.">
        <InfoRow label="General limit" value="100 req / 15 min" />
        <InfoRow label="Auth endpoints" value="10 req / 15 min" />
        <InfoRow label="Contact forms" value="5 req / 15 min" />
      </SectionCard>
      <SectionCard title="Password" description="Change your admin account password.">
        <a href="/settings" className="btn-secondary text-xs inline-flex" onClick={(e) => { e.preventDefault(); }}>
          Go to Account tab → Change Password
        </a>
        <p className="text-xs text-gray-400 mt-2">Use the Account tab to update your password securely.</p>
      </SectionCard>
    </div>
  );
}

// ─── ACCOUNT TAB (renamed from "User") ───────────────────────────────────────
function AccountTab() {
  const { admin, updateAdmin } = useAuth();
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef(null);

  const handleAvatarFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    const fd = new FormData();
    fd.append('avatar', file);
    try {
      const { data } = await api.put('/auth/avatar', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      updateAdmin({ avatar: data.data.avatar });
      toast.success('Profile photo updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setAvatarUploading(false);
      e.target.value = '';
    }
  };

  const changePasswordMutation = useMutation({
    mutationFn: (data) => api.put('/auth/change-password', data),
    onSuccess: () => {
      toast.success('Password changed! Please log in again.');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => { localStorage.clear(); window.location.href = '/login'; }, 1500);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to change password.'),
  });

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) return toast.error('New passwords do not match.');
    if (passwords.newPassword.length < 8) return toast.error('New password must be at least 8 characters.');
    changePasswordMutation.mutate({ currentPassword: passwords.currentPassword, newPassword: passwords.newPassword });
  };

  const toggleShow = (field) => setShowPasswords((s) => ({ ...s, [field]: !s[field] }));

  return (
    <div className="space-y-6">
      <SectionCard title="Account Information">
        <div className="flex flex-wrap items-center gap-4 mb-5 pb-5 border-b border-gray-100 dark:border-gray-800">
          <div className="relative w-16 h-16 rounded-full cursor-pointer group flex-shrink-0" onClick={() => avatarInputRef.current?.click()}>
            {admin?.avatar ? (
              <img src={admin.avatar} alt={admin.name} className="w-16 h-16 rounded-full object-cover" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-brand-700 dark:text-brand-300 font-bold text-2xl">
                {admin?.name?.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              {avatarUploading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : (
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </div>
            <input ref={avatarInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp,image/gif" className="hidden" onChange={handleAvatarFile} />
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">{admin?.name}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Click photo to change</p>
          </div>
        </div>
        <InfoRow label="Name" value={admin?.name} />
        <InfoRow label="Email" value={admin?.email} />
        <InfoRow label="Role" value={admin?.role} />
      </SectionCard>
      <SectionCard title="Change Password" description="You'll be logged out after changing.">
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          {[
            { key: 'current', field: 'currentPassword', label: 'Current Password' },
            { key: 'new', field: 'newPassword', label: 'New Password', hint: 'At least 8 characters', min: 8 },
            { key: 'confirm', field: 'confirmPassword', label: 'Confirm New Password' },
          ].map(({ key, field, label, hint, min }) => (
            <div key={key}>
              <label className="label">{label}</label>
              <div className="relative">
                <input type={showPasswords[key] ? 'text' : 'password'} value={passwords[field]} onChange={(e) => setPasswords((p) => ({ ...p, [field]: e.target.value }))} className="input pr-10" required minLength={min} />
                <button type="button" onClick={() => toggleShow(key)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                  {showPasswords[key] ? <EyeOff /> : <EyeOn />}
                </button>
              </div>
              {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
            </div>
          ))}
          <button type="submit" disabled={changePasswordMutation.isPending} className="btn-primary">
            {changePasswordMutation.isPending ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Updating...</> : 'Update Password'}
          </button>
        </form>
      </SectionCard>
    </div>
  );
}

// ─── APPEARANCE TAB ──────────────────────────────────────────────────────────
function AppearanceTab() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'system');

  const apply = (t) => {
    setTheme(t);
    localStorage.setItem('theme', t);
    if (t === 'dark')  document.documentElement.classList.add('dark');
    else if (t === 'light') document.documentElement.classList.remove('dark');
    else {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
    }
    toast.success(`Theme set to ${t}`);
  };

  return (
    <div className="space-y-6">
      <SectionCard title="Theme" description="Choose the colour scheme for the admin panel.">
        <div className="grid grid-cols-3 gap-3 mt-2">
          {[
            {
              id: 'light', label: 'Light',
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="5"/>
                  <path strokeLinecap="round" d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
                </svg>
              ),
            },
            {
              id: 'dark', label: 'Dark',
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z"/>
                </svg>
              ),
            },
            {
              id: 'system', label: 'System',
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <rect x="2" y="3" width="20" height="14" rx="2"/>
                  <path strokeLinecap="round" d="M8 21h8M12 17v4"/>
                </svg>
              ),
            },
          ].map((t) => (
            <button key={t.id} type="button" onClick={() => apply(t.id)}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${theme === t.id ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'}`}>
              {t.icon}
              <span className="text-sm font-medium">{t.label}</span>
            </button>
          ))}
        </div>
      </SectionCard>
      <SectionCard title="Brand Colours" description="The admin panel uses the same brand palette as the portfolio.">
        <div className="flex flex-wrap gap-3 mt-1">
          {[
            { name: 'Navy',      hex: '#050a1f' },
            { name: 'Mint',      hex: '#b4e8c9' },
            { name: 'Brand 600', hex: '#16a34a' },
          ].map((c) => (
            <div key={c.name} className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-700" style={{ background: c.hex }} />
              <div>
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{c.name}</p>
                <p className="text-xs font-mono text-gray-400">{c.hex}</p>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

// ─── WEBSITE TAB (hero + about content) ──────────────────────────────────────
function WebsiteTab() {
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useQuery({
    queryKey: ['site-settings'],
    queryFn: () => api.get('/site-settings').then((r) => r.data.data),
  });
  const [form, setForm] = useState(null);
  useEffect(() => { if (settings && !form) setForm(settings); }, [settings, form]);

  const [heroUploading,  setHeroUploading]  = useState(false);
  const [aboutUploading, setAboutUploading] = useState(false);
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const saveMutation = useMutation({
    mutationFn: (data) => api.put('/admin/site-settings', data),
    onSuccess: (res) => { queryClient.setQueryData(['site-settings'], res.data.data); toast.success('Website settings saved'); },
    onError: (err) => toast.error(err.response?.data?.message || 'Save failed'),
  });

  const handleSave = (e) => {
    e.preventDefault();
    const { heroLine1Prefix, heroLine1Highlight, heroLine2, statProjectsValue, statProjectsLabel, statClientsValue, statClientsLabel, statYearsValue, statYearsLabel, aboutHeading, aboutBodyDesktop, aboutBodyMobile } = form;
    saveMutation.mutate({ heroLine1Prefix, heroLine1Highlight, heroLine2, statProjectsValue, statProjectsLabel, statClientsValue, statClientsLabel, statYearsValue, statYearsLabel, aboutHeading, aboutBodyDesktop, aboutBodyMobile });
  };

  const handleHeroImage = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setHeroUploading(true);
    const fd = new FormData(); fd.append('image', file);
    try { const { data } = await api.put('/admin/site-settings/hero-image', fd, { headers: { 'Content-Type': 'multipart/form-data' } }); queryClient.setQueryData(['site-settings'], data.data); setForm((f) => ({ ...f, heroImage: data.data.heroImage })); toast.success('Hero image updated'); }
    catch (err) { toast.error(err.response?.data?.message || 'Upload failed'); }
    finally { setHeroUploading(false); e.target.value = ''; }
  };

  const handleAboutImage = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setAboutUploading(true);
    const fd = new FormData(); fd.append('image', file);
    try { const { data } = await api.put('/admin/site-settings/about-image', fd, { headers: { 'Content-Type': 'multipart/form-data' } }); queryClient.setQueryData(['site-settings'], data.data); setForm((f) => ({ ...f, aboutImage: data.data.aboutImage })); toast.success('About image updated'); }
    catch (err) { toast.error(err.response?.data?.message || 'Upload failed'); }
    finally { setAboutUploading(false); e.target.value = ''; }
  };

  if (isLoading || !form) return <div className="flex items-center justify-center py-16"><div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <SectionCard title="Hero Section" description="Animated headline and profile photo on the homepage.">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div><label className="label">Line 1 — Prefix</label><input className="input" value={form.heroLine1Prefix} onChange={set('heroLine1Prefix')} placeholder="Creating " /></div>
            <div><label className="label">Line 1 — Highlight</label><input className="input" value={form.heroLine1Highlight} onChange={set('heroLine1Highlight')} placeholder="Extraordinary" /></div>
            <div><label className="label">Line 2</label><input className="input" value={form.heroLine2} onChange={set('heroLine2')} placeholder="Experiences" /></div>
          </div>
          <ImageUploadCard label="Hero Photo" hint="Portrait, min 800×1000 px" currentUrl={form.heroImage} uploading={heroUploading} onFile={handleHeroImage} />
        </div>
      </SectionCard>
      <SectionCard title="Hero Stats" description="Three numbers displayed below the headline.">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[{ vk: 'statProjectsValue', lk: 'statProjectsLabel', n: 'Stat 1' }, { vk: 'statClientsValue', lk: 'statClientsLabel', n: 'Stat 2' }, { vk: 'statYearsValue', lk: 'statYearsLabel', n: 'Stat 3' }].map(({ vk, lk, n }) => (
            <div key={vk} className="space-y-3 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{n}</p>
              <div><label className="label">Value</label><input className="input" value={form[vk]} onChange={set(vk)} placeholder="100+" /></div>
              <div><label className="label">Label</label><input className="input" value={form[lk]} onChange={set(lk)} placeholder="Projects" /></div>
            </div>
          ))}
        </div>
      </SectionCard>
      <SectionCard title="About Section" description="Text and photo in the About Me section.">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div><label className="label">Heading</label><input className="input" value={form.aboutHeading} onChange={set('aboutHeading')} placeholder="Hello, I'm Bereket Fikre" /></div>
            <div>
              <label className="label">Description</label>
              <textarea className="input min-h-[100px] resize-y" value={form.aboutBodyDesktop} onChange={(e) => setForm((f) => ({ ...f, aboutBodyDesktop: e.target.value, aboutBodyMobile: e.target.value }))} placeholder="A creative designer crafting…" />
              <p className="text-xs text-gray-400 mt-1">Shown on all screen sizes.</p>
            </div>
          </div>
          <ImageUploadCard label="About Photo" hint="Portrait, min 600×480 px" currentUrl={form.aboutImage} uploading={aboutUploading} onFile={handleAboutImage} />
        </div>
      </SectionCard>
      <div className="flex justify-end">
        <button type="submit" disabled={saveMutation.isPending} className="btn-primary">
          {saveMutation.isPending ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</> : 'Save Website Settings'}
        </button>
      </div>
    </form>
  );
}

// ─── NAV items ────────────────────────────────────────────────────────────────
const TABS = [
  {
    id: 'general', label: 'General',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>,
  },
  {
    id: 'website', label: 'Website',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>,
  },
  {
    id: 'seo', label: 'SEO',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>,
  },
  {
    id: 'social', label: 'Social',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.59 13.51l6.83 3.98M15.41 6.51L8.59 10.49"/></svg>,
  },
  {
    id: 'cloudinary', label: 'Cloudinary',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z"/></svg>,
  },
  {
    id: 'security', label: 'Security',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>,
  },
  {
    id: 'account', label: 'Account',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  },
  {
    id: 'appearance', label: 'Appearance',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>,
  },
];

const SUBTITLES = {
  general:    'Site identity and environment info',
  website:    'Manage homepage content and images',
  seo:        'Search engine optimization overview',
  social:     'Social media profile links',
  cloudinary: 'Media storage configuration',
  security:   'Auth, rate limiting and session info',
  account:    'Manage your admin account',
  appearance: 'Theme and visual preferences',
};

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const [active, setActive] = useState('general');

  return (
    <div className="max-w-5xl">
      <PageHeader title="Settings" subtitle={SUBTITLES[active]} />

      <div className="flex gap-6">
        {/* Left nav */}
        <nav className="w-44 flex-shrink-0 space-y-0.5">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                active === t.id
                  ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {active === 'general'    && <GeneralTab />}
          {active === 'website'    && <WebsiteTab />}
          {active === 'seo'        && <SeoTab />}
          {active === 'social'     && <SocialTab />}
          {active === 'cloudinary' && <CloudinaryTab />}
          {active === 'security'   && <SecurityTab />}
          {active === 'account'    && <AccountTab />}
          {active === 'appearance' && <AppearanceTab />}
        </div>
      </div>
    </div>
  );
}
