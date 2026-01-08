# Splitwise-Inspired UI/UX Redesign Plan

## Overview
Transform the expense tracker from a functional but basic UI into a modern, Splitwise-inspired interface with excellent UX.

## Current State
- SvelteKit + Tailwind CSS application
- Tab-based navigation (Transactions, Summary, Lorenzo, Maria)
- Table-based data display
- Basic forms and minimal styling
- Teal primary color (already Splitwise-like!)

---

## Design Philosophy (Splitwise-Inspired)

### Visual Identity
- **Primary Color**: Keep teal (#1CC29F) - matches Splitwise
- **Balance Colors**: Green for "you are owed", Red/Orange for "you owe"
- **Clean Whitespace**: Cards with generous padding
- **Rounded Corners**: Soft, approachable feel (rounded-xl)
- **Subtle Shadows**: Layered depth without heaviness

### UX Principles
- **Balance-First**: Show who owes whom prominently
- **Timeline View**: Transactions as a timeline, not a table
- **User Identity**: Colorful avatars for each person
- **Mobile-First**: Touch-friendly, responsive design
- **Micro-interactions**: Smooth transitions and feedback

---

## Implementation Plan

### Phase 1: Design System & Base Components

**1.1 Create UI Component Library** (`src/lib/components/ui/`)
- `Button.svelte` - Primary, secondary, ghost, danger variants
- `Card.svelte` - Consistent card styling with slots
- `Avatar.svelte` - User avatars with initials and colors
- `Badge.svelte` - Category and status badges
- `Input.svelte` - Styled form inputs
- `Select.svelte` - Styled select dropdowns
- `Modal.svelte` - Branded confirmation dialogs

**1.2 Update Color System** (`app.css`)
```css
--color-lorenzo: #5C6BC0  /* Indigo for Lorenzo */
--color-maria: #EC407A    /* Pink for Maria */
--color-owed: #4CAF50     /* Green - you are owed */
--color-owes: #FF5722     /* Orange - you owe */
```

### Phase 2: Layout & Navigation

**2.1 New Header Design** (`+page.svelte`)
- App logo/name on left
- User avatars toggle (switch between Lorenzo/Maria views)
- Clean, minimal navigation

**2.2 Balance Hero Section** (NEW)
- Large, prominent balance display
- "Lorenzo owes Maria R$ XX" or "You're settled up!"
- Visual progress bar or balance indicator
- Settle up action button

**2.3 Tab Navigation Redesign**
- Pills/segments instead of underlined tabs
- Icons + labels
- Smooth transitions between tabs

### Phase 3: Transaction List Redesign

**3.1 Timeline View** (`TransactionTable.svelte` → `TransactionList.svelte`)
- Card-based transaction items (not table rows)
- Left avatar showing who paid
- Right side showing amount and split info
- Category badge with icon
- Date grouping headers ("Today", "Yesterday", "January 2026")
- Swipe-to-delete on mobile (optional)

**3.2 Search & Filters**
- Floating search bar with icon
- Filter chips for expense types
- Month/date range filter

### Phase 4: Forms & Input Redesign

**4.1 Expense Form Redesign** (`ExpenseForm.svelte`)
- Full-width card layout
- Large, touch-friendly inputs
- Visual expense type selector (icon grid)
- Better date picker styling
- Clear visual feedback on submit

**4.2 CSV Import Redesign** (`CsvImport.svelte`)
- Cleaner drag-drop zone
- Better preview with card layout
- Progress indication
- Success/error animations

### Phase 5: Summary Views

**5.1 Combined Summary Redesign** (`CombinedSummary.svelte`)
- Balance card at top (who owes whom)
- Category breakdown with progress bars
- Monthly trend visualization
- Expense type cards with icons

**5.2 Individual Summary Redesign** (`IndividualSummary.svelte`)
- Personal balance card
- Income vs expenses visualization
- Category spending breakdown
- Monthly comparison

### Phase 6: Polish & Animations

**6.1 Micro-interactions**
- Button press effects
- Card hover lifts
- Smooth tab transitions
- Form validation animations
- Success toast notifications

**6.2 Empty States**
- Friendly illustrations or icons
- Clear call-to-action
- Helpful onboarding text

**6.3 Mobile Optimization**
- Bottom sheet for add expense
- Touch-friendly button sizes (min 44px)
- Optimized spacing for mobile

---

## Files to Modify

### New Files
- `src/lib/components/ui/Button.svelte`
- `src/lib/components/ui/Card.svelte`
- `src/lib/components/ui/Avatar.svelte`
- `src/lib/components/ui/Badge.svelte`
- `src/lib/components/ui/Input.svelte`
- `src/lib/components/ui/Modal.svelte`
- `src/lib/components/BalanceHero.svelte`
- `src/lib/components/TransactionItem.svelte`

### Files to Heavily Modify
- `src/app.css` - Extended color system and base styles
- `src/routes/+page.svelte` - New layout and navigation
- `src/lib/components/TransactionTable.svelte` - Convert to timeline view
- `src/lib/components/ExpenseForm.svelte` - Redesigned form
- `src/lib/components/CsvImport.svelte` - Cleaner design
- `src/lib/components/CombinedSummary.svelte` - Card-based layout
- `src/lib/components/IndividualSummary.svelte` - Visual breakdown

---

## User Preferences (Confirmed)
- **Platform**: Desktop-first with responsive mobile support
- **Dark mode**: Yes, include dark/light theme toggle
- **Animations**: Subtle - smooth transitions, professional feel

---

## Execution Order

1. **Phase 1**: Create UI component library + update color system with dark mode
2. **Phase 2**: Redesign layout, header, and add Balance Hero section
3. **Phase 3**: Transform transaction table into timeline view
4. **Phase 4**: Redesign forms with new components
5. **Phase 5**: Update summary views with cards and visualizations
6. **Phase 6**: Add subtle animations and polish
