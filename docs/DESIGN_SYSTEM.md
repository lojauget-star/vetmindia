# VETMIND - OFFICIAL DESIGN SYSTEM & VISUAL IDENTITY SPECIFICATION

**Version**: 1.0.0  
**Status**: APPROVED  
**Author**: Principal Software Engineer  

---

## 1. VISUAL PHILOSOPHY & BRAND IDENTITY

Vetmind's visual identity reflects **clinical precision, human warmth, editorial elegance, and understated luxury**. It deliberately rejects generic "AI SaaS" aesthetics (such as electric purple accents, dark-mode neon glows, and heavy drop shadows) in favor of a clean, tactile clinical environment.

---

## 2. OFFICIAL COLOR PALETTE & TOKENS

```css
:root {
  /* Primary Clinical Palette */
  --color-clinical-blue: #4F46E5;
  --color-clinical-blue-dark: #3730A3;
  --color-clinical-blue-light: #EEF2FF;

  /* Trusted Green Accent */
  --color-trusted-green: #0F8A5F;
  --color-trusted-green-dark: #08704C;
  --color-trusted-green-light: #ECFDF5;

  /* Surface & Background */
  --color-background: #F7F7F5;
  --color-surface: #FFFFFF;
  --color-surface-subtle: #FAF9F6;

  /* Typography Colors */
  --color-text-primary: #292D3A;
  --color-text-secondary: #667085;
  --color-text-tertiary: #98A2B3;

  /* Borders & Dividers */
  --color-border: #E7E7E3;
  --color-border-subtle: #F0F0EC;

  /* Status Colors */
  --color-urgency-critical: #DC2626;
  --color-urgency-high: #EA580C;
  --color-urgency-moderate: #D97706;
  --color-urgency-low: #0F8A5F;
}
```

---

## 3. TYPOGRAPHY: INTER

The official and exclusive typeface for Vetmind is **Inter**.

- **Font Family**: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
- **Scale Hierarchy**:

| Token | Size / Line Height | Weight | Usage |
| :--- | :--- | :--- | :--- |
| `display-1` | 36px / 44px | Bold (700) | Major landing / workspace headers |
| `heading-1` | 28px / 36px | SemiBold (600) | Section titles & Clinical Case headers |
| `heading-2` | 22px / 28px | SemiBold (600) | Card titles & modal headers |
| `heading-3` | 18px / 24px | Medium (500) | Sub-sections & table headers |
| `body-large` | 16px / 24px | Regular (400) | Primary clinical text & summary paragraphs |
| `body-default` | 14px / 20px | Regular (400) | Secondary text & form inputs |
| `caption` | 12px / 16px | Medium (500) | Metadata badges, timestamps, tags |

---

## 4. TACTILE PAPER TEXTURE SPECIFICATION

Vetmind incorporates an extremely subtle, high-end tactile paper texture overlay across the background surface `#F7F7F5` to evoke an editorial clinical chart feel.

```css
/* Premium Paper Texture Module */
.bg-paper-texture {
  background-color: var(--color-background);
  background-image: radial-gradient(rgba(41, 45, 58, 0.02) 1px, transparent 0);
  background-size: 24px 24px;
  position: relative;
}

.bg-paper-texture::before {
  content: "";
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  opacity: 0.015;
  pointer-events: none;
  background: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
}
```

---

## 5. UI COMPONENT & ELEVATION RULES

- **Shadows**: Only minimal, crisp borders (`1px solid #E7E7E3`) and hairline subtle shadows (`0 1px 3px rgba(0, 0, 0, 0.04)`) are allowed. Heavy diffuse drop shadows are forbidden.
- **Borders & Radii**:
  - Cards & Panels: `rounded-xl` (`12px` border radius)
  - Buttons & Inputs: `rounded-lg` (`8px` border radius)
  - Badges & Tags: `rounded-full` (`9999px`)
- **Gradients**: NO multi-color rainbow or neon AI gradients. Only flat solids or ultra-subtle 1-degree opacity fades (e.g. from `#FFFFFF` to `#FAF9F6`).
