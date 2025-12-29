# SharedStake UI - Design System & UI/UX Guidelines

**Last Updated:** December 29, 2025  
**Status:** Design System Documentation

---

## Overview

This document outlines the design system, UI/UX guidelines, and visual standards for SharedStake UI. It provides a comprehensive reference for maintaining consistency across the application.

---

## Design Principles

### 1. User-Centric
- **Clear communication** - Users understand what they're doing
- **Transparency** - Show transaction status and fees clearly
- **Trust** - Build confidence through clear information

### 2. DeFi-First
- **Web3 patterns** - Familiar patterns for DeFi users
- **Wallet integration** - Seamless wallet connection
- **Transaction clarity** - Clear transaction flows

### 3. Accessibility
- **WCAG 2.1 AA** - Meet accessibility standards
- **Keyboard navigation** - Full keyboard support
- **Screen reader support** - Semantic HTML and ARIA labels

### 4. Performance
- **Fast loading** - Optimize for speed
- **Responsive** - Work on all devices
- **Progressive enhancement** - Core functionality works everywhere

---

## Visual Design System

### Color Palette

#### Primary Colors
- **Primary Blue**: `#3B82F6` - Main actions, links
- **Primary Dark**: `#1E40AF` - Hover states, emphasis
- **Primary Light**: `#60A5FA` - Secondary actions

#### Semantic Colors
- **Success**: `#10B981` - Success states, positive actions
- **Warning**: `#F59E0B` - Warnings, caution states
- **Error**: `#EF4444` - Errors, destructive actions
- **Info**: `#3B82F6` - Informational messages

#### Neutral Colors
- **Background**: `#FFFFFF` (light) / `#1F2937` (dark)
- **Surface**: `#F9FAFB` (light) / `#374151` (dark)
- **Text Primary**: `#111827` (light) / `#F9FAFB` (dark)
- **Text Secondary**: `#6B7280` (light) / `#9CA3AF` (dark)
- **Border**: `#E5E7EB` (light) / `#4B5563` (dark)

### Typography

#### Font Families
- **Primary**: System font stack (San Francisco, Segoe UI, etc.)
- **Monospace**: For addresses, transaction hashes

#### Font Sizes
- **Heading 1**: `3rem` (48px) - Page titles
- **Heading 2**: `2.25rem` (36px) - Section titles
- **Heading 3**: `1.875rem` (30px) - Subsection titles
- **Heading 4**: `1.5rem` (24px) - Card titles
- **Body Large**: `1.125rem` (18px) - Important text
- **Body**: `1rem` (16px) - Default text
- **Body Small**: `0.875rem` (14px) - Secondary text
- **Caption**: `0.75rem` (12px) - Labels, captions

#### Font Weights
- **Bold**: `700` - Headings, emphasis
- **Semibold**: `600` - Subheadings, buttons
- **Medium**: `500` - Important text
- **Regular**: `400` - Body text
- **Light**: `300` - Secondary text

### Spacing System

Based on 4px grid:
- **xs**: `0.25rem` (4px)
- **sm**: `0.5rem` (8px)
- **md**: `1rem` (16px)
- **lg**: `1.5rem` (24px)
- **xl**: `2rem` (32px)
- **2xl**: `3rem` (48px)
- **3xl**: `4rem` (64px)

### Border Radius

- **sm**: `0.25rem` (4px) - Small elements
- **md**: `0.5rem` (8px) - Default
- **lg**: `0.75rem` (12px) - Cards, modals
- **xl**: `1rem` (16px) - Large containers
- **full**: `9999px` - Pills, avatars

### Shadows

- **sm**: `0 1px 2px rgba(0,0,0,0.05)` - Subtle elevation
- **md**: `0 4px 6px rgba(0,0,0,0.1)` - Default elevation
- **lg**: `0 10px 15px rgba(0,0,0,0.1)` - Cards, modals
- **xl**: `0 20px 25px rgba(0,0,0,0.1)` - Large modals

---

## Component Design Patterns

### Buttons

#### Primary Button
```vue
<button class="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg">
  Connect Wallet
</button>
```

#### Secondary Button
```vue
<button class="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg">
  Cancel
</button>
```

#### Danger Button
```vue
<button class="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg">
  Withdraw
</button>
```

#### Button States
- **Default**: Normal appearance
- **Hover**: Slightly darker background
- **Active**: Pressed state
- **Disabled**: Reduced opacity, no interaction
- **Loading**: Spinner icon, disabled state

### Forms

#### Input Fields
- **Label**: Above input, clear and descriptive
- **Placeholder**: Example text, not instructions
- **Error State**: Red border, error message below
- **Success State**: Green border (optional)
- **Helper Text**: Below input, gray text

#### Form Layout
- **Vertical spacing**: `1rem` between fields
- **Grouping**: Related fields grouped visually
- **Required indicators**: Asterisk (*) for required fields

### Cards

#### Card Structure
- **Header**: Title and optional action
- **Body**: Main content
- **Footer**: Optional actions or metadata

#### Card Styling
- **Background**: White (light) / Dark gray (dark)
- **Border**: Subtle border or shadow
- **Padding**: `1.5rem` (24px)
- **Border Radius**: `0.75rem` (12px)

### Modals

#### Modal Structure
- **Overlay**: Semi-transparent backdrop
- **Container**: Centered, max-width constraint
- **Header**: Title and close button
- **Body**: Scrollable content
- **Footer**: Action buttons

#### Modal Sizes
- **Small**: `max-w-md` (448px) - Confirmations
- **Medium**: `max-w-lg` (512px) - Forms
- **Large**: `max-w-2xl` (672px) - Complex forms
- **Full**: `max-w-4xl` (896px) - Detailed views

### Navigation

#### Navigation Structure
- **Primary Nav**: Top navigation bar
- **Breadcrumbs**: Page hierarchy
- **Sidebar**: Optional (not currently used)

#### Navigation States
- **Active**: Highlighted, different color
- **Hover**: Subtle background change
- **Disabled**: Reduced opacity, no interaction

---

## Responsive Design

### Breakpoints

- **sm**: `640px` - Small tablets
- **md**: `768px` - Tablets
- **lg**: `1024px` - Small desktops
- **xl**: `1280px` - Desktops
- **2xl**: `1536px` - Large desktops

### Mobile-First Approach

Design for mobile first, then enhance for larger screens:
1. **Mobile** (< 640px) - Single column, stacked elements
2. **Tablet** (640px - 1024px) - Two columns, side-by-side
3. **Desktop** (> 1024px) - Multi-column, full layout

### Responsive Patterns

#### Grid Layouts
- **Mobile**: 1 column
- **Tablet**: 2 columns
- **Desktop**: 3-4 columns

#### Navigation
- **Mobile**: Hamburger menu
- **Desktop**: Horizontal navigation

#### Tables
- **Mobile**: Stacked cards
- **Desktop**: Traditional table

---

## Interaction Design

### Loading States

#### Skeleton Loaders
- Show placeholder content while loading
- Match final content layout
- Animated pulse effect

#### Spinners
- Use for button loading states
- Centered for page loading
- Size appropriate to context

### Feedback Patterns

#### Success Feedback
- **Toast notification** - Brief success message
- **Green checkmark** - Visual confirmation
- **Auto-dismiss** - 3-5 seconds

#### Error Feedback
- **Toast notification** - Error message
- **Red alert** - Visual error indicator
- **Persistent** - Requires user action

#### Warning Feedback
- **Yellow alert** - Warning message
- **Actionable** - User can proceed or cancel

### Transaction States

1. **Pending** - Transaction submitted, waiting for confirmation
2. **Confirming** - Transaction in mempool
3. **Confirmed** - Transaction mined successfully
4. **Failed** - Transaction failed or reverted

---

## Accessibility Guidelines

### Semantic HTML
- Use proper HTML elements (`<button>`, `<nav>`, `<main>`, etc.)
- Proper heading hierarchy (h1 → h2 → h3)
- Form labels associated with inputs

### ARIA Labels
- Add ARIA labels for icon-only buttons
- Describe interactive elements
- Provide context for screen readers

### Keyboard Navigation
- **Tab**: Navigate between interactive elements
- **Enter/Space**: Activate buttons/links
- **Escape**: Close modals
- **Arrow keys**: Navigate menus (if applicable)

### Color Contrast
- **Text**: Minimum 4.5:1 contrast ratio
- **Large text**: Minimum 3:1 contrast ratio
- **Interactive elements**: Clear focus indicators

### Screen Reader Support
- Descriptive alt text for images
- ARIA labels for icons
- Live regions for dynamic content
- Skip links for navigation

---

## Animation Guidelines

### Transitions

#### Duration
- **Fast**: `150ms` - Hover states, small changes
- **Medium**: `300ms` - Default transitions
- **Slow**: `500ms` - Page transitions, modals

#### Easing
- **Ease-in-out**: Default for most transitions
- **Ease-out**: Entering animations
- **Ease-in**: Exiting animations

### Animation Principles
- **Purposeful** - Animations serve a purpose
- **Subtle** - Don't distract from content
- **Consistent** - Use same timing/easing
- **Performant** - Use CSS transforms/opacity

---

## Content Guidelines

### Writing Style

#### Tone
- **Professional** - Clear and concise
- **Friendly** - Approachable, not overly formal
- **Helpful** - Guide users through processes

#### Voice
- **Active voice** - "Stake your ETH" not "ETH can be staked"
- **Clear instructions** - Step-by-step guidance
- **Error messages** - Explain what went wrong and how to fix

### Content Structure

#### Headings
- **Clear hierarchy** - Use proper heading levels
- **Descriptive** - Headings describe content
- **Scannable** - Users can scan quickly

#### Lists
- **Bullet points** - For unordered lists
- **Numbered** - For step-by-step instructions
- **Short items** - Keep list items concise

#### Links
- **Descriptive text** - "Learn more about staking" not "Click here"
- **Clear purpose** - Users know where link goes
- **External links** - Indicate external links

---

## Brand Guidelines

### Logo Usage
- **Minimum size** - Maintain readability
- **Clear space** - Adequate spacing around logo
- **Color variations** - Light/dark versions available

### Typography
- **Consistent fonts** - Use system font stack
- **Hierarchy** - Clear visual hierarchy
- **Readability** - Sufficient contrast and size

### Color Usage
- **Primary colors** - Use for main actions
- **Semantic colors** - Use appropriately (success, error, etc.)
- **Consistency** - Same colors for same purposes

---

## Design Tokens

### Tailwind Configuration

Design tokens are configured in `tailwind.config.js`:

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3B82F6',
          dark: '#1E40AF',
          light: '#60A5FA',
        },
        // ... other colors
      },
      spacing: {
        // ... spacing scale
      },
      // ... other tokens
    },
  },
}
```

---

## Component Library

### Shared Components

Located in `src/components/Common/`:
- **ApproveButton** - Token approval button
- **ConnectButton** - Wallet connection button
- **DappTxBtn** - Transaction button with loading states
- **SharedButton** - Base button component
- **SharedLink** - Styled link component

### Usage Guidelines

1. **Use shared components** - Don't recreate existing components
2. **Extend when needed** - Add props for variations
3. **Maintain consistency** - Follow existing patterns
4. **Document changes** - Update docs when modifying components

---

## Design Tools

### Recommended Tools
- **Figma** - Design mockups and prototypes
- **Tailwind CSS** - Utility-first CSS framework
- **Vue DevTools** - Component inspection
- **Browser DevTools** - Responsive testing

### Design Workflow
1. **Design** - Create mockups in Figma
2. **Review** - Get stakeholder approval
3. **Implement** - Build in Vue with Tailwind
4. **Test** - Test across devices and browsers
5. **Iterate** - Refine based on feedback

---

## Related Documentation

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System architecture
- **[DEVELOPMENT_SETUP.md](./DEVELOPMENT_SETUP.md)** - Development setup
- **[README.md](./README.md)** - Project overview
- **[IMPROVED_GAP_ANALYSIS_TEMPLATE.md](./IMPROVED_GAP_ANALYSIS_TEMPLATE.md)** - Gap analysis methodology
- **[AGENT_HANDOFF.md](./AGENT_HANDOFF.md)** - Next steps for agent sessions

---

## Design Checklist

Before implementing a new feature:

- [ ] Design follows color palette
- [ ] Typography uses defined scale
- [ ] Spacing uses 4px grid
- [ ] Responsive design considered
- [ ] Accessibility requirements met
- [ ] Loading states defined
- [ ] Error states defined
- [ ] Animation timing consistent
- [ ] Content is clear and helpful
- [ ] Uses shared components where possible

---

**Document Version:** 1.0  
**Last Updated:** December 29, 2025  
**Maintained By:** Design & Development Team
