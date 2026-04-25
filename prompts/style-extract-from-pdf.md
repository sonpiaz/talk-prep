# Style extraction prompt

Use when the speaker has a PDF of a past talk (their own or someone else's) and says "I want this aesthetic." Extract tokens so the new deck is not a rebuild by hand.

## Inputs needed

- Path or URL to the reference PDF (or screenshots of ~8 representative slides).
- Speaker's self-rating of the reference (e.g., "this was my 7.5/10 deck").
- One sentence on what worked and one on what did not.

## Extraction prompt (paste to your agent)

> Read the attached PDF. For each of the items below, pick a single value based on what dominates across the slides. If two values compete, pick the one that appears in the opener and closer (titles weigh more than body).
>
> Output a completed `templates/04-style-guide.md` only — no commentary.
>
> Items to extract:
>
> 1. **Background color** — sample the pixel color of blank areas on slides without images. Give hex.
> 2. **Foreground text color** — the dominant text color. Give hex.
> 3. **Muted text color** — the secondary / caption color. Give hex.
> 4. **Accent color** — the color used for single-word emphasis, stats, or highlights. Give hex.
> 5. **Heading font family** — identify by eye. If unclear, describe (e.g., "geometric sans, 800 weight, slight condensed"). Suggest a Google Fonts match.
> 6. **Body font family** — same process.
> 7. **Mono / label font** — if the deck uses monospace for kickers or labels, identify it.
> 8. **Italic / quote font** — if quotes are italic serif, identify.
> 9. **Photo mood** — one sentence describing the photography style (e.g., "dark editorial cinematography with muted earthy tones, shallow DOF, no embedded text").
> 10. **Layout patterns** — list the distinct patterns you see (title hero, stat big number, quote dark, compare row, etc.). For each, sketch where title / body / image sit.
> 11. **Forbidden list** — what the deck clearly avoids (e.g., no bullet lists with more than 3 items, no emoji, no stock photos of people).

## Validating the extraction

After receiving the filled style guide:

1. Paste the hex colors into a color picker. Do they match the PDF to the eye? If not, re-sample.
2. Put 3 slides side by side with the extracted tokens applied to `html-scaffold.html`. Does it feel like the same family? If not, the tokens are off.
3. Show the speaker. Ask: "is this the vibe, or is something missing?" Common miss: the PDF has a subtle texture or grain that the tokens did not capture.

## When NOT to extract from PDF

- The reference is a slide that looks great but the speaker's content is totally different. Style transplants badly when content mood differs.
- The reference relies on custom illustrations the speaker cannot reproduce. Extract colors + type only, leave illustrations out.
- The speaker wants to be "like X but different". Extraction makes the new deck LOOK like X. If the ask is inspiration-not-imitation, write a custom style guide instead.
