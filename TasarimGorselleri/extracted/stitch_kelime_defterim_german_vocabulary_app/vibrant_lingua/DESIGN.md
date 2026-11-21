---
name: Vibrant Lingua
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#464554'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#777586'
  outline-variant: '#c7c4d7'
  surface-tint: '#5148d7'
  primary: '#2a14b4'
  on-primary: '#ffffff'
  primary-container: '#4338ca'
  on-primary-container: '#c1beff'
  inverse-primary: '#c3c0ff'
  secondary: '#b90538'
  on-secondary: '#ffffff'
  secondary-container: '#dc2c4f'
  on-secondary-container: '#fffbff'
  tertiary: '#00442d'
  on-tertiary: '#ffffff'
  tertiary-container: '#005e3f'
  on-tertiary-container: '#4ddda2'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e3dfff'
  primary-fixed-dim: '#c3c0ff'
  on-primary-fixed: '#100069'
  on-primary-fixed-variant: '#372abf'
  secondary-fixed: '#ffdadb'
  secondary-fixed-dim: '#ffb2b7'
  on-secondary-fixed: '#40000d'
  on-secondary-fixed-variant: '#92002a'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 34px
    fontWeight: '800'
    lineHeight: 40px
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 32px
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 28px
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 26px
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 17px
    fontWeight: '600'
    lineHeight: 22px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 18px
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 10px
    fontWeight: '700'
    lineHeight: 12px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  margin: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style
The design system embodies an energetic, razor-sharp, and native-feeling mobile experience tailored for language mastery. Combining the tactile, fluid responsiveness of modern iOS polish with the structural clarity and adaptive color dynamics of modern Android interfaces, the aesthetic balances playful gamification with serious academic utility.

### Brand Personality & Emotional Impact
- **Electric & Focused:** High-clarity micro-surfaces, punchy chromatic accents, and zero visual drag ensure that flashcard drilling, grammar breakdowns, and repetition loops feel snappy and rewarding.
- **Empowering & Organized:** Immediate cognitive ease is established through distinct grammatical color-coding (German noun genders), cutting down ambiguity and accelerating pattern recognition.
- **Tactile Modernity:** Subtly elevated cards, luminous interactive states, and soft micro-borders evoke a premium mobile tool built with extreme craft.

## Colors
The palette abandons muted, desaturated tones in favor of vivid ultramarine and high-chroma semantic accents set against crisp, pure surfaces.

### Semantic German Article Tokens
Grammatical genders rely on instantaneous, accessible recognition:
- **Masculine (`der`):** Electric Cobalt (`#2563EB`) — Background Tint: `#EFF6FF`, Border: `#BFDBFE`
- **Feminine (`die`):** Vivid Fuchsia Rose (`#E11D48`) — Background Tint: `#FFF1F2`, Border: `#FECDD3`
- **Neuter (`das`):** Crisp Emerald Teal (`#059669`) — Background Tint: `#ECFDF5`, Border: `#A7F3D0`
- **Plural (`die Pl.`):** Electric Violet (`#7C3AED`) — Background Tint: `#F5F3FF`, Border: `#DDD6FE`

### Surface & Functional Distribution
- **Canvas Base:** Pure slate-white (`#F8FAFC`) to maintain contrast without harsh sterile glares.
- **Surface Elevated:** Optical white (`#FFFFFF`) for cards, sheets, and study decks.
- **Borders & Dividers:** High-precision, subtle slate tone (`#E2E8F0`), preventing muddy borders while retaining structural clarity.
- **Text Elements:** Ultra-dark Slate (`#0F172A`) for primary headlines, with neutral cool slate (`#475569`) reserved for secondary definitions and contextual metadata.

## Typography
Plus Jakarta Sans delivers structural balance and geometric warmth. The tall x-height and open letter apertures maintain extreme legibility during rapid flashcard reviews and lengthy sample sentence parsing.

### Editorial Hierarchy
- **German Vocabulary Headwords:** Rendered in `headline-lg` or `display-lg` with `700` or `800` weight to serve as the dominant visual focal anchor.
- **Phonetics & Grammar Tags:** Rendered in `label-md` or `label-sm` with tight uppercase tracking (+0.04em) to deliver clean, modern metadata chips.
- **Example Context & Translations:** Rendered in `body-md` and `body-lg` using natural line heights for continuous reading comfort.

## Layout & Spacing
The layout follows a touch-optimized mobile standard using a 4px/8px modular rhythm, anchored by an edge-to-edge container structure with comfortable safe margins.

### Mobile Grid & Ergonomics
- **Screen Margins:** Standard mobile canvas width features a 16px (`1rem`) outer margin.
- **Vertical Rhythm:** Standard spacing between flashcard components, list items, and study deck blocks is kept to 12px or 16px (`space-md`) to ensure thumb-friendly separation without excessive page height.
- **Action Safe Zones:** Primary floating actions (audio playback, flip card, mark mastered) adhere to a 56px bottom touch boundary clearing Android/iOS navigation pills.

## Elevation & Depth
Visual hierarchy is conveyed through crisp tonal separation combined with subtle ambient shadows and low-contrast perimeter strokes.

### Tiers & Elevation Style
- **Base Surface (`Level 0`):** Pure `#F8FAFC`. Zero elevation.
- **Card Surfaces (`Level 1`):** Pure `#FFFFFF` surface with a delicate 1px boundary stroke of `#E2E8F0` and an ambient, colored contact shadow: `0 2px 8px -2px rgba(15, 23, 42, 0.04), 0 1px 3px -1px rgba(15, 23, 42, 0.02)`.
- **Floating Modals & Active Flashcards (`Level 2`):** Slightly elevated with `0 12px 24px -4px rgba(67, 56, 202, 0.08), 0 4px 8px -2px rgba(15, 23, 42, 0.04)` and a 1px border of `#E2E8F0`.
- **Gender Tinted Elevation:** For gender-specific vocabulary containers, the base card preserves a faint 5% opacity tint of the respective article color along with a subtle matching glow on interaction or swipe.

## Shapes
A roundedness level of 2 (`0.5rem` / 8px base, scaled to 16px on core containers) establishes a friendly, modern mobile form factor.

### Geometry Breakdown
- **Vocabulary Cards & Modals:** `rounded-lg` (16px / `1rem`) creates soft, approachable cards that fit naturally within native touch gestures.
- **Interactive Buttons & Input Fields:** `rounded-lg` (12px / `0.75rem`) for a tactile, pill-adjacent grip.
- **Chips & Gender Tags:** Full pill radius (`rounded-full` / 9999px) to clearly differentiate inline tags and filters from structural containers.

## Components

### Vocabulary Flashcards
The primary learning unit. Constructed on an optical white surface with a 16px corner radius, framed by a 1px `#E2E8F0` border.
- Features a top-aligned colored accent stripe or left edge accent (4px) corresponding directly to the grammatical article (`#2563EB`, `#E11D48`, or `#059669`).
- Displays the German word in bold typography with its respective color badge, accompanied by an audio trigger button on the top right.

### Buttons & Interactive CTAs
- **Primary Action (Learn, Check, Continue):** Deep Ultramarine (`#4338CA`), white bold text, with a subtle active press scale (`transform: scale(0.98)`).
- **Secondary / Action Feedback (Correct / Mastered):** Vibrant Mint Emerald (`#10B981`) background with crisp white typography.
- **Review / Repeat Action:** Vibrant Coral Rose (`#F43F5E`) outline or solid fill.

### Article Chips & Badges
Small, pill-shaped markers indicating noun genders:
- **`der`:** Background `#EFF6FF`, Border `#BFDBFE`, Text `#1D4ED8`
- **`die`:** Background `#FFF1F2`, Border `#FECDD3`, Text `#BE123C`
- **`das`:** Background `#ECFDF5`, Border `#A7F3D0`, Text `#047857`
All chips use `label-sm` with 6px vertical and 10px horizontal padding.

### Input Fields & Search
Search bars and spell-check fields use `#FFFFFF` backgrounds with an inset `#E2E8F0` border, shifting to a 2px `#4338CA` ring when focused. Placeholder text is set in neutral slate (`#94A3B8`).

### Lists & Dictionaries
List items are bounded by full-width white card rows or subtle 1px dividers on `#F8FAFC`. Each row features the German article tag pinned to the left, followed by the headword and a right-aligned subtle translation preview.