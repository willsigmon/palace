# PALACE Implementation Plan

## Phase 1 — MVP: "I can see my conversations and search them"

### Scaffold & Design System
- [x] Project scaffold: Next.js 16.2, Tailwind 4, TypeScript, GSAP, Zustand
- [x] Design tokens: full PALACE "Warm Noir" color system, typography, spacing
- [x] Ambient background with drifting gradient orbs
- [x] Sidebar navigation (desktop) + bottom tabs (mobile)

### API Integration
- [x] Typed API client for wsigomi REST (api.wsig.me)
- [x] Type definitions matching omi.db + enrichment.db schema
- [ ] Verify API connectivity with live data
- [ ] Handle auth token flow (env var → header)

### The Stream (Home)
- [x] Paginated conversation timeline with infinite scroll
- [x] Conversation cards: title, overview, people, time, type badge
- [x] Date grouping (Today, Yesterday, weekday, full date)
- [x] Stats header (conversation/memory/people counts)
- [ ] GSAP scroll-driven card reveals

### Conversation Detail
- [x] Full transcript view with speaker labels
- [x] AI summary section
- [x] People badges
- [x] Session metadata (date, time, duration, type)
- [ ] View Transitions API for card → detail expansion

### Search
- [x] Cmd+K overlay with FTS5-powered results
- [x] Debounced search (200ms)
- [x] Result type badges and color coding
- [x] Keyboard navigation (arrow keys, enter, escape)

### Deploy
- [ ] GitHub repo created
- [ ] .gitignore configured (no .env.local)
- [ ] Vercel deployment
- [ ] Cloudflare Tunnel verified for api.wsig.me

---

## Phase 2 — Intelligence (upcoming)
- [ ] Pattern Cards (needs /patterns endpoint in wsigomi)
- [ ] Serendipity Cards (needs /serendipity endpoint)
- [ ] Topic tags with color coding
- [ ] People profiles page
- [ ] Synthesis page (needs /synthesize endpoint)
- [ ] Weekly digest via ntfy
- [ ] SSE for real-time conversation alerts
- [ ] PWA service worker

## Phase 3 — The Graph (upcoming)
- [ ] D3 force-directed people graph
- [ ] Topic cluster visualization
- [ ] Time slider animation
- [ ] Graph ↔ Stream linking

## Phase 4 — Dream State (future)
- [ ] Voice input
- [ ] Relationship CRM nudges
- [ ] Conversation annotations
- [ ] Spatial 3D graph (Three.js)
