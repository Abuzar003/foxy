# Haazir — Landing Page Plan

**Haazir** (Urdu/Hindi for "present / available now") perfectly fits an on-demand services platform. Tagline suggestion: **"Help is Haazir."** — your trusted pros, instantly or on schedule.

A premium, dark-themed single-page landing site with gold + teal accents, designed to introduce the platform, showcase services, build trust, and provide clear customer support entry points.

---

## Page Sections (top to bottom)

### 1. Sticky Navigation Bar
- Logo "Haazir" (gold wordmark with a small location/spark icon)
- Links: Services • How it works • Support • About
- Right side: "Become a Provider" (ghost button) + "Book Now" (gold CTA)
- Transparent on top, solid dark blur on scroll

### 2. Hero Section
- Dark gradient background with subtle teal glow + faint pattern
- Headline: **"Trusted home services, Haazir at your doorstep."**
- Subhead: "Book electricians, plumbers, gardeners, drivers, painters and more — instantly or whenever you need."
- **Search bar (centerpiece)**:
  - Field 1: "What service do you need?" (with dropdown suggestions)
  - Field 2: City / location (with location pin icon)
  - Gold "Find a Pro" button
- Trust strip below: "10,000+ verified pros • 4.9★ average rating • 24/7 support"

### 3. Service Categories
- Section title: "Services available on Haazir"
- Grid of 8 service tiles (4×2 on desktop, 2×4 on mobile):
  Electrician • Plumber • Gardener • Driver • Painter • AC Repair • Cleaning • Carpenter
- Each tile: icon, name, "from PKR XXX", subtle teal hover glow
- "View all services" link below

### 4. How It Works
- 4 numbered steps with icons in a horizontal row:
  1. **Choose a service** — pick what you need
  2. **Pick a time** — instant or scheduled
  3. **Get matched** — verified pro assigned
  4. **Relax & rate** — job done, pay securely
- Connecting dotted line between steps (teal)

### 5. Why Haazir (Trust / Value Props)
- 3-column feature grid:
  - **Verified Pros** — background-checked, skilled professionals
  - **Upfront Pricing** — no surprises, transparent rates
  - **Instant Availability** — book now or schedule later
- Each card with gold icon on dark surface

### 6. Testimonials
- Section title: "Loved by thousands of homes"
- 3 customer cards (avatar, name, city, 5 stars, quote)
- Subtle teal border, slight tilt/lift on hover

### 7. Customer Support — Help Center
- Section title: "We're here 24/7"
- **24/7 Available** badge (gold pill, pulsing dot) at top
- 4 help cards in a grid:
  - **Call Us** — phone number, "Avg pickup < 30s"
  - **Live Chat** — "Chat with an agent now" → opens chat
  - **Email** — support@haazir.com, "Reply within 2 hours"
  - **FAQs** — "Browse common questions"
- Below the cards: short FAQ accordion (5 common Qs: How do I book? • Are pros verified? • Payment methods? • Cancellation policy? • Service areas?)

### 8. Become a Provider (CTA strip)
- Dark teal banner: "Earn with Haazir — join 10,000+ pros"
- Gold "Apply Now" button

### 9. Footer
- 4 columns: Company • Services • Support • Legal
- Newsletter signup (email + gold subscribe button)
- Social icons, app store badges (placeholder)
- Bottom bar: © 2026 Haazir • Privacy • Terms

---

## Design System

- **Theme**: Premium dark
- **Background**: Deep charcoal / near-black with subtle gradient
- **Surfaces**: Slightly lifted dark cards with soft borders
- **Accents**: Gold (primary CTA, highlights) + Teal (secondary, hover glows, links)
- **Text**: Warm white for headlines, muted grey for body
- **Typography**: Modern sans-serif — bold display headlines, clean body
- **Components**: Rounded corners (xl), soft shadows, subtle glow on hover, smooth fade-in animations on scroll

## Technical Notes

- Single-page React app, all sections on `/` (Index.tsx)
- Update `index.css` design tokens (HSL) for dark theme + gold/teal palette
- Update `tailwind.config.ts` to expose `gold`, `teal`, `surface` semantic tokens
- Use shadcn `Button`, `Input`, `Card`, `Accordion`, `Badge` — restyled via tokens
- All section content static for now (no backend); search/booking buttons can route to a future `/services` page or scroll to the services section
- Lucide icons throughout; placeholder avatars for testimonials
- Fully responsive (mobile-first), smooth scroll for nav anchors
- Update page `<title>` and meta description for SEO
