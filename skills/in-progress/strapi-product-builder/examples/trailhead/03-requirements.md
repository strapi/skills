# Functional Requirements

## Core features (MVP)
- Browse and search trails by name and region.
- View a trail page showing its details and its most recent condition reports, newest first, with a "freshness" indicator.
- Authenticated users can post a condition report on a trail: a condition rating (enum), a short note, an optional photo, and the date hiked.
- Reports display reporter name and "time ago."
- Moderators can create/edit/curate the canonical trail records and mark featured trails.

## Account & auth
- End-user accounts: **yes** — required to *post* reports; reading is fully public.
- Editorial admin accounts: **yes** — moderators edit trails in the Strapi admin.
- Roles needed: anonymous read (public), authenticated reporter (post reports), moderator (curate trails). Admin/editor handled on the Strapi side.

## Content the product manages

### Editorial content (managed in Strapi admin)
- **Trail**: canonical record — name, region, difficulty, length, description, location, hero image, featured flag.
- **Region**: grouping for trails (name, slug).

### User-generated content (created via API)
- **Report**: a condition report attached to a Trail by an authenticated user — rating, note, photo, dateHiked.

### Reusable shapes (likely Strapi components)
- **Location** (lat/lng + trailhead description) — used by Trail.
- **SEO** (meta title/description/og image) — used by Trail pages.

### Flexible layouts (likely Strapi dynamic zones)
- Trail page **content blocks** (optional, post-MVP): gallery, tips, nearby-trails — a dynamic zone on Trail. Flagged as v2; MVP uses a fixed layout.

## Localization & drafts
- Multi-language (i18n): **no** for MVP (single region/language).
- Draft & publish: **yes** for Trail (moderators stage new trails before publishing); **no** for Report (reports are live immediately).

## Integrations
- Image storage/CDN: needed for report photos and trail hero images (covered by Strapi Cloud media).
- Email: transactional only (auth verification / password reset). No marketing email in MVP.

## Non-functional requirements
- Performance: trail page should load recent reports fast; reads are public and cacheable.
- Scale: ~2k users and a few hundred trails in year one — modest.
- Security: only authenticated users post; a user can edit/delete only their own reports; basic abuse guard (rate limit posting).
- Compliance: store minimal PII (email + display name); standard privacy policy. No special regime.

## Out of scope for MVP
- Comments/replies on reports — defer to v2.
- Photo moderation queue / flagging — defer to v2.
- Native mobile app — web only for MVP.
- Trail page dynamic-zone content blocks — defer to v2.
