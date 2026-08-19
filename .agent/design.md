# Design System

## Visual Direction

Style:
Modern
Minimal
Professional
Academic

Target Institution:
Universitas Amikom Purwokerto

---

## Color Palette

| Token | Hex | Usage |
|---|---|---|
| Primary | `#2563EB` | Primary actions, active states, links, CTA buttons |
| Primary Dark | `#1D4ED8` | Primary button hover, focus rings |
| Background | `#F8FAFC` | Page background |
| Surface | `#FFFFFF` | Cards, modals, sidebar, header |
| Text Primary | `#0F172A` | Body text, headings |
| Text Secondary | `#475569` | Supporting text, labels |
| Text Muted | `#64748B` | Placeholder text, captions, metadata |
| Border | `#E2E8F0` | Dividers, input borders, card borders |
| Success | `#16A34A` | Success states, vote confirmed, active badge |
| Warning | `#D97706` | Upcoming/scheduled badge, pending state |
| Danger | `#DC2626` | Destructive actions, error states, cancelled badge |
| Info | `#0284C7` | Informational alerts, result publication badge |

---

## Typography

Font:
Inter (Google Fonts)

Scale:
- Heading 1: 2rem / 700 weight
- Heading 2: 1.5rem / 600 weight
- Heading 3: 1.25rem / 600 weight
- Body: 1rem / 400 weight
- Small: 0.875rem / 400 weight
- Caption: 0.75rem / 400 weight

---

## Election State Badge Colors

| State | Color Token | Description |
|---|---|---|
| DRAFT | Text Muted / Border | Neutral gray |
| SCHEDULED | Warning | Yellow/amber |
| ACTIVE | Success | Green — currently open for voting |
| ENDED | Text Secondary | Gray |
| RESULT_PUBLISHED | Info | Blue |
| CANCELLED | Danger | Red |

---

## Components

### Button

- Primary: Background `#2563EB`, text white. Hover: `#1D4ED8`.
- Secondary: Background transparent, border `#E2E8F0`, text `#0F172A`. Hover: Background `#F8FAFC`.
- Danger: Background `#DC2626`, text white. Hover: `#B91C1C`.
- All buttons: border-radius 0.5rem, padding 0.5rem 1rem, transition 150ms.
- Disabled state: opacity 0.5, cursor not-allowed.

### Card

- Default: Background `#FFFFFF`, border `#E2E8F0`, border-radius 0.75rem,
  box-shadow subtle.
- Interactive: Card with hover effect (slight elevation / border-color shift
  to Primary). Used for candidate cards, election list items.

### Input

- Default: Border `#E2E8F0`, background `#FFFFFF`, border-radius 0.5rem.
  Focus: border-color `#2563EB`, ring `#2563EB` with opacity.
- Error: Border `#DC2626`, error message below in `#DC2626`.
- Disabled: Background `#F8FAFC`, text `#64748B`, cursor not-allowed.

### Badge

- Uses Election State Badge Colors table above.
- Small pill shape, border-radius 9999px.

### Modal

- Overlay: dark background at 50% opacity.
- Modal surface: Background `#FFFFFF`, border-radius 0.75rem, max-width 28rem.
- Voting confirmation modal is required for the vote submission action.
- Modal must clearly state the selected candidate before confirming.

### Spinner / Loading

- Primary color spinner for async operations.
- Full-page loading state for initial auth check.

---

## Layout

### Admin Layout

```
┌─────────────────────────────────────────────────┐
│  Header (logo + user menu + logout)             │
├──────────────┬──────────────────────────────────┤
│              │                                  │
│   Sidebar    │   Content Area                   │
│   Navigation │   (scrollable)                   │
│              │                                  │
└──────────────┴──────────────────────────────────┘
```

Sidebar links: Dashboard, Elections, (contextual: Candidates, Voters, Results)

### Voter Layout

```
┌─────────────────────────────────────────────────┐
│  Header (logo + election title + user info)     │
├─────────────────────────────────────────────────┤
│                                                 │
│   Main Content (centered, max-width container)  │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Auth Layout

```
┌─────────────────────────────────────────────────┐
│                                                 │
│   Centered card with logo, form, and submit     │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## UX Rules

1. The voting action must use a confirmation modal before submitting.
   The modal must display the selected candidate name and number.
2. After a successful vote, display a success confirmation state
   (not a redirect back to the vote page).
3. Candidates must be displayed in cards (Interactive card style).
4. The current election status badge must always be visible on election pages.
5. If a voter has already voted, the vote page must show a "already voted"
   state and must not display the ballot form.
6. If an election is not ACTIVE, the vote page must show the current state
   and explain why voting is unavailable.
7. If results are not yet published, the result page must show an appropriate
   waiting state with the scheduled `resultPublishedAt` time.
8. Error states must always be user-friendly (not raw technical errors).
9. All form submissions must show loading state during the async operation.
10. Responsive design is required. Mobile layout must be functional.