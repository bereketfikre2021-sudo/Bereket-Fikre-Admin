# Bereket Fikre Portfolio — Admin Panel

Modern React + Vite admin dashboard for managing all portfolio content.

---

## Quick Start

```bash
cd Admin
npm install

# Create .env
echo "VITE_API_URL=http://localhost:5000/api" > .env

# Start dev server
npm run dev
```

Admin panel runs at `http://localhost:3000`

> The Backend API must be running first. Default credentials are set in `Backend/.env`.

---

## Features

- **Dashboard** — Stats overview, unread badge, recent activity
- **Projects** — Full CRUD with thumbnail upload, gallery, SEO, drag-order
- **Services** — Full CRUD with bullet points, process steps, image upload
- **Insights** — Case studies + blog posts with cover image, tags, reading time
- **Partners** — Trusted By logos + Client Testimonials with ratings
- **FAQ** — Accordion management with categories and ordering
- **Contact Messages** — View, reply, status management
- **Project Requests** — Multi-field request viewer with notes
- **Settings** — Change password
- **Dark Mode** — Auto-detects system preference, toggleable
- **Responsive** — Works on mobile, tablet, and desktop

---

## Build for Production

```bash
npm run build
# Output in dist/
```

Deploy the `dist/` folder to Netlify, Vercel, Render Static, or any static host.

Set `VITE_API_URL` to your production backend URL during build.
