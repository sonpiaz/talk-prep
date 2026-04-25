# Preset — founder-cinematic

Dark background + cream text + amber accent + editorial cinematic photography. Feels like a Kinfolk magazine + a founder letter. Works for workshops, keynote openings, and any talk where the speaker owns a personal failure → pivot arc.

## Design tokens

```css
:root {
  /* Core palette */
  --bg:           #0A0A0C;   /* near-black, warmer than pure #000 */
  --bg-soft:      #14141A;   /* for layered cards / scrims */
  --text:         #F5E6CE;   /* cream, not white — reads warm */
  --muted:        #A89E8C;   /* secondary text, captions */
  --accent:       #F5B942;   /* amber — for numbers, highlights, single-word emphasis */
  --accent-soft:  #8C6E2E;   /* muted amber — for deprecated/old state in compare slides */
  --rule:         #2A2A30;   /* thin dividers */

  /* Type scale */
  --fs-display:   96px;
  --fs-title:     64px;
  --fs-subtitle:  32px;
  --fs-body:      24px;
  --fs-caption:   18px;
  --fs-mono:      20px;

  /* Grid */
  --slide-w:      1920px;
  --slide-h:      1080px;
  --pad:          96px;
}
```

## Fonts

Load via Google Fonts in the scaffold `<head>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;800&family=IBM+Plex+Mono:wght@500&family=Fraunces:ital,wght@1,400;1,600&display=swap" rel="stylesheet">
```

| Role | Family | Weight |
|---|---|---|
| Display / heading | Be Vietnam Pro | 800 |
| Body | Be Vietnam Pro | 400 / 500 |
| Mono / label (act numbers, kickers) | IBM Plex Mono | 500 |
| Italic / English quotes | Fraunces | italic 400 / 600 |

Be Vietnam Pro handles Vietnamese diacritics natively (đ, ă, â, ư, ơ) without fallback glitches.

## Photo mood (paste into every image prompt)

```
cinematic editorial photography, Kinfolk magazine aesthetic, moody natural light, muted earthy palette, deep shadows, shallow depth of field, fine 35mm film grain, ultra-detailed, no text, no watermarks, no people faces visible, 4K
```

## Layout patterns

All eight are wired as CSS classes in `html-scaffold.html`.

1. **`.slide-title-hero`** — full-bleed image, title block bottom-left over dark gradient scrim. Use for opener and closer.
2. **`.slide-photo-bleed`** — full-bleed image, optional bottom caption in `--muted`.
3. **`.slide-stat`** — centered giant number in `--accent`, one-line caption below in `--text`.
4. **`.slide-compare`** — two or three columns, each with a mono kicker + body block. Deprecated column uses `--accent-soft`; live column uses `--accent`.
5. **`.slide-quote`** — large Fraunces italic quote (left 50%), image right 50%, attribution in `--muted`.
6. **`.slide-grid`** — 2×2 grid, each tile = photo + one-line caption OR stat + label.
7. **`.slide-statement`** — typography only, centered, no image. Use sparingly (max 2–3 per deck).
8. **`.slide-handwritten`** — background photo + handwriting PNG overlay (scanned from speaker's notebook). Use once per deck for a personal touch.

## Rules this preset enforces

- No emoji anywhere.
- Max 3 font weights total (currently: 400, 500, 800).
- Stats slides = ONE number + ONE caption. Two numbers = split into two slides.
- Quotes are always italic Fraunces, never bold Be Vietnam Pro.
- Body text never exceeds 15 words. Longer = cut, or move to speaker notes.
- Photos never have embedded text (photo mood prompt excludes text/watermarks).

## Why this preset exists

Son ran a workshop on 2026-04-24 using this aesthetic. Deck rated 7.5/10 on first pass. Trade-off: dark + cinematic reads "premium, not preachy" to founder audiences that distrust bootcamp-style decks. If your audience is corporate / analytical, prefer `clean-briefing` (v0.2).
