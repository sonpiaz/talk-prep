# Image Prompts — founder-cinematic

Reference library of prompt patterns that produce Kinfolk-magazine results via FLUX 1.1 Pro Ultra. Copy, adapt, and paste into your `06-image-map.md`.

Every prompt ends with the shared **style suffix** defined in `style.md` under "Photo mood". Leave `[cinematic_photo]` tag on the line so `gen-images.ts` routes it to FLUX.

---

## Shared style suffix (append to every prompt)

```
cinematic editorial photography, Kinfolk magazine aesthetic, moody natural light, muted earthy palette, deep shadows, shallow depth of field, fine 35mm film grain, ultra-detailed, no text, no watermarks, no people faces visible, 4K
```

---

## Opener — threshold / horizon

```
Lone silhouette standing on a rocky cliff at first light of dawn, vast misty ocean horizon, warm golden rim light breaking through grey clouds, sense of contemplation and threshold, {{STYLE}} [cinematic_photo]
```

## Rule / paradigm — heavy objects

```
Three vintage triangular stone weights cracked and broken apart on dark weathered wooden table, single beam of natural side light, dramatic chiaroscuro, dust motes in air, {{STYLE}} [cinematic_photo]
```

## Failure / loss — extinguished candles

```
Two extinguished beeswax candles on weathered oak desk, scattered burnt paper edges and ash, single ember still glowing faintly, melancholic still life composition, warm amber low light, {{STYLE}} [cinematic_photo]
```

## Commitment / launch — boat into sea

```
Small wooden fishing boat being pushed off shore into rough open sea at dusk, motion blur on dark water, salt spray, lone sailor pushing from behind in shadow, Hokusai-inspired moody tone, {{STYLE}} [cinematic_photo]
```

## Craft / tools — workshop flat lay

```
Top-down flat lay of artisan workshop tools arranged on raw natural linen, hand-forged iron chisels, leather notebooks, brass measuring instruments, fountain pen, soft directional window light, {{STYLE}} [cinematic_photo]
```

## Time / compression — hourglass

```
Single antique brass hourglass on rough stone surface, fast warm sand stream illuminated by sharp side light, dust particles floating, monochrome warm tones, deep negative space, {{STYLE}} [cinematic_photo]
```

## Questions / reflection — open notebook

```
Open vintage leather notebook with handwritten ink questions on aged cream paper, fountain pen resting diagonally on page, warm desk lamp glow, intimate workspace, shallow focus, {{STYLE}} [cinematic_photo]
```

## Closing — long path forward

```
Long winding stone path through misty mountain valley at sunrise, distant lighthouse glowing softly on horizon, hopeful direction-forward composition, atmospheric layered depth, golden hour, {{STYLE}} [cinematic_photo]
```

---

## When to reach for Ideogram or Recraft instead

### Vietnamese text in image (signage, packaging, wordmark)

FLUX struggles with diacritics (ă, â, ư, ơ, đ) — route to Ideogram V3.

```
Hand-painted wooden shop signboard with the text "Gác Mai" in flowing Vietnamese calligraphy, aged brass lettering on deep forest green background, warm evening light, {{STYLE}} [vietnamese_text_in_image]
```

### Logo / wordmark

Recraft produces illustrations, not clean logos. Route to Ideogram V3.

```
Minimalist wordmark logo reading "KYMA" in bold sans-serif uppercase, amber color on pure black background, balanced letter spacing, flat vector logo design [logo_wordmark]
```

### Flat illustration / diagram

```
Flat vector illustration of a simple mountain path with three milestone markers, limited palette of cream amber and charcoal, clean geometric shapes, no gradients, editorial infographic style [flat_illustration]
```

---

## Prompt engineering tips

1. **Open with a concrete noun.** "Lone silhouette..." beats "A sense of contemplation...".
2. **Specify light direction.** "Warm golden rim light" gives the model something to calculate; "beautiful lighting" does not.
3. **Exclude what hurts:** `no text, no watermarks, no people faces visible` — embedded text is the biggest slop tell.
4. **One subject per frame.** Two subjects → either competing for focus or awkwardly composited.
5. **Time of day is a style lever.** "Dawn" / "dusk" / "blue hour" shift palette drastically — pick per slide mood, not randomly.
6. **Regenerate is cheap** (~$0.06/image). If the first result is 80% there, generate 2 more variants before tweaking the prompt.
