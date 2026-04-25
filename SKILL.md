# talk-prep

**Opinionated 9-phase workflow for preparing a cinematic public talk in 1.5 hours instead of 5.**

Agent-agnostic. Works with Claude Code, Codex, Gemini CLI, Antigravity, Cursor, or standalone via `bun`.

---

## When to use

Use this skill when you need to prepare a conference talk, workshop, or keynote and you want:

- A structured path from raw idea → exported PPTX without reinventing the workflow each time.
- Images that look like editorial magazine photography, not AI slop.
- Text-editable slides you can still tweak in Canva / Google Slides / PowerPoint after export.
- Separation of concerns: ideate first, write second, style lock third, visuals last.

Do **not** use this for: 5-minute lightning talks (overkill), slide decks that are really reports (use a doc), or real-time live edits during a talk.

---

## How this skill is invoked

Pick the path that matches your environment.

### Claude Code

```
/talk-prep
```

Or reference this directory from any other Claude Code conversation:

```
Read ~/.claude/skills/talk-prep/SKILL.md and follow the 9-phase workflow for my talk about [TOPIC].
```

### Other agents (Codex, Gemini CLI, Antigravity, Cursor)

Clone the skill repo locally, then tell the agent:

```
Read ./talk-prep/SKILL.md and apply the 9-phase workflow to the talk brief I will paste next.
```

The SKILL.md is plain markdown with no Claude-specific frontmatter. Any agent capable of reading files and running `bun` can execute it.

### Standalone CLI (no agent)

You can run the image generation and PPTX export scripts directly:

```bash
bun ~/.claude/skills/talk-prep/scripts/gen-images.ts --map ./my-talk/06-image-map.md --out ./my-talk/images
bun ~/.claude/skills/talk-prep/scripts/html-to-pptx.ts --in ./my-talk/deck.html --out ./my-talk/deck.pptx
```

---

## The 9-phase workflow

Each phase ends with a **GATE** — do not advance until the user confirms. If the user says "skip gate", advance silently.

### Phase 1 — BRIEF (10 min)

Goal: capture the context so everything else is grounded.

Ask the user (or write from what you know):

- Who is the audience? One sentence. Be specific (e.g., "30 Vietnamese founders at a Sunday workshop in HCMC, mixed technical, skeptical about AI hype").
- What is the **one thing** they should remember tomorrow?
- What is the duration? (e.g., 40 min + 20 min Q&A)
- What is the venue / vibe? (e.g., "homey living room workshop, not a tech conference")
- Is there a forbidden framing? (e.g., "do not sound like a bootcamp ad")
- Does the user have pre-talk survey data, past talks, or social posts that should inform tone?

Write output to `00-brief.md` using `templates/00-brief.md`.

**GATE** — show brief, ask "OK?"

### Phase 2 — IDEAS (15 min)

Generate 20–30 rough ideas, not 3 polished ones. Idea density beats idea quality at this stage.

Use `prompts/brainstorm-socratic.md` as the prompting pattern: ask the user provocative questions about their own story and list what comes out.

Include:

- Personal failure stories (these are gold for founder talks).
- Surprising stats or contradictions the audience would not guess.
- Quotes from people the audience respects (not quotes from random LinkedIn influencers).
- "Boring but true" observations the audience has but nobody says out loud.

Write output to `01-ideas.md` using `templates/01-ideas.md`.

**GATE** — user picks 8–12 ideas to keep.

### Phase 3 — BRAINSTORM → OUTLINE (15 min)

Take the kept ideas and arrange them into 3–6 acts with a single emotional arc.

Use one of these arcs, pick explicitly:

- **Rise-Fall-Rise** (best for founder talks with 2 failures + 1 pivot).
- **Contradict-the-Rule** (best for "new paradigm" talks — start with a rule everyone believes, break it).
- **Before-After** (best for tools / capabilities talks).
- **Problem-Trap-Escape** (best for advice talks).

Write output to `02-outline.md` using `templates/02-outline.md`. Each act has: title, 1-sentence promise, 2–4 beats.

**GATE** — user approves arc + act titles.

### Phase 4 — SCRIPT (30 min)

Expand outline into a speakable script. Not a document, not bullets — an actual script the user will read out loud.

Rules:

- Short sentences. One idea per line.
- Include `(pause)` directives.
- Mark `**bold**` for word-by-word delivery.
- Mark `[SLIDE N]` at every slide boundary.
- Vietnamese or English, match the audience — do not code-switch mid-sentence unless the user does.

Write output to `03-script.md` using `templates/03-script.md`.

**GATE** — user reads it out loud once, reports friction points. Revise.

### Phase 5 — STYLE LOCK (10 min)

Decide the visual identity **before** making slides. This is the phase most workflows skip and then bleed 2 hours later.

Options:

1. **Use a preset.** v0.1 ships `founder-cinematic` (dark, amber accent, editorial photography). Read `presets/founder-cinematic/style.md`.
2. **Extract from a reference.** If the user has a PDF of a past talk they liked, use `prompts/style-extract-from-pdf.md` to pull tokens (bg color, text color, accent, fonts, photo mood, layout patterns).
3. **Custom from scratch.** Write tokens to `04-style-guide.md` using `templates/04-style-guide.md`.

Required tokens:

- Background color (hex)
- Foreground text color (hex)
- Accent color (hex)
- Heading font (Google Fonts name)
- Body font
- Mono / label font (optional)
- Photo mood (1 sentence: e.g., "cinematic editorial, Kinfolk magazine, muted earthy, moody natural light")
- 6–8 layout patterns (title hero, photo full-bleed, stat big number, compare row, quote, grid, statement, handwritten accent)

**GATE** — user confirms. This is the most important gate. Changing style after slides exist is expensive.

### Phase 6 — SLIDE CONTENT (20 min)

Convert script to slide-sized content blocks. One slide ≠ one page of script.

Rules:

- 1 idea per slide. If a slide has two ideas, split it.
- Maximum ~15 words of body text per slide. If more, move to speaker notes.
- Stat slides = one giant number + one-line caption.
- Quote slides = the quote + attribution only.
- Never put the talk outline on a slide. The audience is not taking notes.

Write output to `05-slides.md` using `templates/05-slides.md`.

**GATE** — user approves slide count (target: 10–16 for a 40-min talk).

### Phase 7 — VISUALS (15 min)

Decide what each slide needs: fal.ai image, screenshot, or text only.

Write output to `06-image-map.md` using `templates/06-image-map.md`.

For each `fal.ai`-tagged slide, write a prompt using the photo mood + a concrete object / scene. Use `presets/founder-cinematic/image-prompts.md` as a reference for Kinfolk-style cinematic prompts.

Then run:

```bash
KYMA_API_KEY=... bun scripts/gen-images.ts --map 06-image-map.md --out ./images
```

If Kyma does not have image models yet, the script falls back to `FAL_KEY` direct, then Unsplash placeholder.

**GATE** — user reviews generated images. Regen any that miss. Cost per image ≈ $0.06, 10–15s.

### Phase 8 — BUILD DECK (10 min)

Fill the HTML scaffold with slide content + generated images.

1. Copy `presets/founder-cinematic/html-scaffold.html` to your talk folder as `deck.html`.
2. Replace placeholder `<section>` blocks with your slides.
3. Link images from `./images/01-hero.jpg` etc.
4. Open in Chromium, walk through with arrow keys.

Keyboard navigation: `→` / `←` / `Space` already wired in the scaffold.

**GATE** — user previews deck in browser, approves.

### Phase 9 — EXPORT + REHEARSE (10 min)

Export to PPTX for handoff:

```bash
bun scripts/html-to-pptx.ts --in deck.html --out deck.pptx
```

The PPTX is text-editable (not rasterized). Import to Canva, Google Slides, PowerPoint — text remains selectable.

Then rehearse:

- Read `03-script.md` out loud with `deck.html` on screen.
- Time yourself. If you are more than 10% over, cut slides, do not speed up.
- Record one dry run on phone. Watch back at 1.5x. Note where you sound bored — those are cuts.

**Done.**

---

## Directory layout produced

For a talk named `my-talk`, the workflow produces:

```
my-talk/
├── 00-brief.md
├── 01-ideas.md
├── 02-outline.md
├── 03-script.md
├── 04-style-guide.md
├── 05-slides.md
├── 06-image-map.md
├── deck.html
├── deck.pptx
└── images/
    ├── 01-hero.jpg
    ├── 03-triangle.jpg
    └── ...
```

---

## Providers and fallbacks

### Text LLM

This skill does not call text LLMs directly — the agent you are using IS the text LLM. It follows the prompts in `prompts/` and produces the markdown files.

### Image generation

Tier 1: **Kyma** (default). Set `KYMA_API_KEY`. Models auto-discovered via `https://kymaapi.com/registry/image-models.json` (falls back to bundled `config/kyma-registry-fallback.json` if endpoint is unreachable).

Tier 2: **fal.ai direct**. Set `FAL_KEY`. Used if no `KYMA_API_KEY` present or Kyma has no image models registered yet.

Tier 3: **Unsplash placeholder**. No key required. Used if both above fail. Produces a neutral placeholder URL — you get slides that render, just not the visual identity.

The `scripts/gen-images.ts` script picks the highest tier available and tells you which one it used.

### Routing hints

The registry JSON maps intents → models:

- `vietnamese_text_in_image` → Ideogram V3 (FLUX fails diacritics).
- `cinematic_photo` → FLUX 1.1 Pro Ultra (Kinfolk vibe winner).
- `logo_wordmark` → Ideogram V3 (Recraft produces illustrations not wordmarks).
- `flat_illustration` → Recraft V3.

Your image prompts in `06-image-map.md` can tag intent; the script routes automatically.

---

## What this skill does not do

- Write the talk for you. It structures YOUR story. Garbage in, garbage out.
- Handle live animations, video, or audio (v0.2).
- Translate between languages. If your audience is Vietnamese, script in Vietnamese.
- Deploy slides anywhere. Export to PPTX, you take it from there.

---

## v0.1 scope

- 1 preset: `founder-cinematic`.
- 2 scripts: `gen-images.ts`, `html-to-pptx.ts`.
- 7 templates.
- 2 prompt files.
- Kyma → fal.ai → Unsplash fallback chain with registry-based model discovery.

Roadmap (v0.2): `clean-briefing` and `photo-narrative` presets, examples folder, video/audio support.

---

## License

MIT. See `LICENSE`.
